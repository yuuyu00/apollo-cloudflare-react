import { v4 as uuidv4 } from "uuid";
import { verifyJWT, requireAuth } from "./auth";
import type { Env } from "./types";

const ALLOWED_FORMATS = ["image/jpeg", "image/jpg", "image/png"];
const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB

function securityHeaders(origin: string) {
  return {
    // CORS headers
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    // Security headers
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Content-Security-Policy": "default-src 'self'; script-src 'none'; style-src 'none'; img-src 'none'",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
  };
}

function errorResponse(message: string, status: number, origin: string) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...securityHeaders(origin),
    },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const origin = env.CORS_ORIGIN || "*";

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: securityHeaders(origin),
      });
    }

    // Only handle POST /upload
    if (request.method !== "POST" || url.pathname !== "/upload") {
      return errorResponse("Method not allowed", 405, origin);
    }

    // Verify authentication using Clerk
    const user = await verifyJWT(request, env);

    if (!user) {
      return errorResponse("Unauthorized", 401, origin);
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return errorResponse("No file provided", 400, origin);
    }

    // Validate file type
    if (!ALLOWED_FORMATS.includes(file.type)) {
      return errorResponse(
        "Invalid file format. Only JPG, JPEG, and PNG are allowed",
        400,
        origin
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return errorResponse("File size exceeds 1MB limit", 400, origin);
    }

    // Generate unique key
    const fileExtension = file.name.split(".").pop() || "jpg";
    const uuid = uuidv4();
    const key = `images/articles/${user.userId}/${uuid}.${fileExtension}`;

    try {
      // Upload to R2
      const arrayBuffer = await file.arrayBuffer();
      await env.IMAGES_BUCKET.put(key, arrayBuffer, {
        httpMetadata: {
          contentType: file.type,
        },
        customMetadata: {
          userId: user.userId.toString(),
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
        },
      });

      return new Response(
        JSON.stringify({
          success: true,
          key,
          size: file.size,
          type: file.type,
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...securityHeaders(origin),
          },
        }
      );
    } catch (error) {
      console.error("R2 upload error:", error);
      return errorResponse("Failed to upload image", 500, origin);
    }
  },
};
