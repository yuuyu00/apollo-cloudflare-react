import { v4 as uuidv4 } from "uuid";
import { verifyJWT } from "./auth";

const ALLOWED_FORMATS = ["image/jpeg", "image/jpg", "image/png"];
const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB
const CACHE_TTL = 31536000; // 1 year in seconds
const OUTPUT_FORMAT = "image/webp"; // Single format for caching

const IMAGE_TRANSFORMATIONS = {
  content: {
    width: 800,
    quality: 85,
    fit: "scale-down" as const,
  },
  thumb: {
    width: 300,
    height: 200,
    quality: 80,
    fit: "cover" as const,
  },
} as const;

type TransformationType = keyof typeof IMAGE_TRANSFORMATIONS;

/**
 * Handle GET requests for image retrieval with caching
 */
async function handleGetImage(
  request: Request,
  env: Env,
  url: URL,
  ctx?: ExecutionContext
): Promise<Response> {
  const pathPattern = /^\/images\/articles\/(\d+)\/([\w-]+\.\w+)$/;
  const match = url.pathname.match(pathPattern);

  if (!match) {
    return new Response("Not Found", { status: 404 });
  }

  const [, userId, filename] = match;
  const r2Key = `images/articles/${userId}/${filename}`;
  const transformType = (url.searchParams.get("type") ||
    "content") as TransformationType;

  if (!IMAGE_TRANSFORMATIONS[transformType]) {
    return new Response("Invalid transformation type", { status: 400 });
  }

  // Use actual request URL as cache key for better CDN integration
  const cacheKeyRequest = new Request(request.url, {
    method: "GET",
    headers: request.headers,
  });
  const cache = caches.default;

  try {
    // Check cache first
    const cachedResponse = await cache.match(cacheKeyRequest);
    if (cachedResponse) {
      const response = new Response(cachedResponse.body, cachedResponse);
      response.headers.set("X-Cache-Status", "HIT");
      response.headers.set(
        "CF-Cache-Status",
        cachedResponse.headers.get("CF-Cache-Status") || "HIT"
      );
      return response;
    }

    // Cache miss - fetch and transform
    const originalImage = await env.IMAGES_BUCKET.get(r2Key);
    if (!originalImage) {
      return new Response("Image not found", { status: 404 });
    }

    if (!env.IMAGES_API) {
      return new Response("Images API not configured", { status: 503 });
    }

    // Transform image
    const transform = IMAGE_TRANSFORMATIONS[transformType];
    const transformOptions: any = {
      width: transform.width,
      quality: transform.quality,
      fit: transform.fit,
    };

    if ("height" in transform) {
      transformOptions.height = transform.height;
    }

    // Always output as WebP for consistent caching
    const transformedImageResult = await env.IMAGES_API.input(
      originalImage.body
    )
      .transform(transformOptions)
      .output({ format: OUTPUT_FORMAT, quality: transform.quality });

    const transformedImage = await transformedImageResult.response();
    const imageArrayBuffer = await transformedImage.arrayBuffer();

    // Build response headers with multi-layer caching support
    const headers = new Headers({
      "Content-Type": OUTPUT_FORMAT,
      // Layer 1: Browser cache (1 year)
      "Cache-Control": `public, max-age=${CACHE_TTL}, s-maxage=${CACHE_TTL}, immutable`,
      // Layer 2: CDN cache control (Cloudflare-specific)
      "CDN-Cache-Control": `max-age=${CACHE_TTL}`,
      "X-Cache-Status": "MISS",
      "X-Transform-Type": transformType,
    });

    // CORS headers
    const origin = env.CORS_ORIGIN || "*";
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    headers.set(
      "Access-Control-Expose-Headers",
      "X-Cache-Status, CF-Cache-Status"
    );

    // Simple ETag for conditional requests
    const etag = `"${filename}-${transformType}"`;
    headers.set("ETag", etag);

    // Add debugging information
    if (request.cf?.colo) {
      headers.set("X-Edge-Location", String(request.cf.colo));
    }

    // Check for conditional request
    const ifNoneMatch = request.headers.get("If-None-Match");
    if (ifNoneMatch === etag) {
      return new Response(null, {
        status: 304,
        headers: {
          ETag: etag,
          "Cache-Control": `public, max-age=${CACHE_TTL}, s-maxage=${CACHE_TTL}, immutable`,
          "CDN-Cache-Control": `max-age=${CACHE_TTL}`,
          "X-Cache-Status": "MISS-304",
        },
      });
    }

    // Create response (cf options are for fetch, not Response constructor)
    const response = new Response(imageArrayBuffer, {
      status: 200,
      headers,
    });

    // Layer 3: Store in Worker Cache API (data center local)
    const responseToCache = response.clone();
    if (ctx) {
      ctx.waitUntil(
        cache
          .put(cacheKeyRequest, responseToCache)
          .catch((err) => console.error("Cache put error:", err))
      );
    } else {
      cache
        .put(cacheKeyRequest, responseToCache)
        .catch((err) => console.error("Cache put error:", err));
    }

    return response;
  } catch (error) {
    console.error("Error processing image:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

/**
 * Handle image upload
 */
async function handleUpload(request: Request, env: Env): Promise<Response> {
  const origin = env.CORS_ORIGIN || "*";

  // Verify authentication
  const user = await verifyJWT(request, env);
  if (!user) {
    return jsonResponse({ error: "Unauthorized" }, 401, origin);
  }

  // Parse form data
  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return jsonResponse({ error: "No file provided" }, 400, origin);
  }

  // Validate file
  if (!ALLOWED_FORMATS.includes(file.type)) {
    return jsonResponse(
      { error: "Invalid file format. Only JPG, JPEG, and PNG are allowed" },
      400,
      origin
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return jsonResponse({ error: "File size exceeds 1MB limit" }, 400, origin);
  }

  // Generate unique key
  const fileExtension = file.name.split(".").pop() || "jpg";
  const uuid = uuidv4();
  const key = `images/articles/${user.userId}/${uuid}.${fileExtension}`;

  try {
    // Upload to R2
    const arrayBuffer = await file.arrayBuffer();
    await env.IMAGES_BUCKET.put(key, arrayBuffer, {
      httpMetadata: { contentType: file.type },
      customMetadata: {
        userId: user.userId.toString(),
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
      },
    });

    return jsonResponse(
      {
        success: true,
        key,
        size: file.size,
        type: file.type,
      },
      200,
      origin
    );
  } catch (error) {
    console.error("R2 upload error:", error);
    return jsonResponse({ error: "Failed to upload image" }, 500, origin);
  }
}

/**
 * Helper function to create JSON responses with CORS headers
 */
function jsonResponse(data: any, status: number, origin: string): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

/**
 * Handle CORS preflight requests
 */
function handleCors(origin: string): Response {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const url = new URL(request.url);
    const origin = env.CORS_ORIGIN || "*";

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return handleCors(origin);
    }

    // Handle GET requests for images
    if (request.method === "GET") {
      return handleGetImage(request, env, url, ctx);
    }

    // Handle POST requests for upload
    if (request.method === "POST" && url.pathname === "/upload") {
      return handleUpload(request, env);
    }

    return jsonResponse({ error: "Method not allowed" }, 405, origin);
  },
};
