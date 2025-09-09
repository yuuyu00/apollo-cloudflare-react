import { ApolloServer } from "@apollo/server";
import { startServerAndCreateCloudflareWorkersHandler } from "@as-integrations/cloudflare-workers";
import { PrismaClient } from "@prisma/client";
import { PrismaD1 } from "@prisma/adapter-d1";
import { typeDefs } from "./schema";
import { resolvers } from "./resolvers";
import { verifyJWT, AuthError } from "./auth";
import { Context, createContext } from "./context";

async function createGraphQLContext(
  request: Request,
  env: Env,
  db: D1Database
): Promise<Context> {
  const adapter = new PrismaD1(db);
  const prisma = new PrismaClient({ adapter });

  let user = null;
  try {
    const requestBody = await request.clone().text();
    const isSignUpRequest = requestBody.includes("signUp");

    user = await verifyJWT(request, env, {
      skipUserIdCheck: isSignUpRequest,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      console.warn("Auth error:", error.message);
    }
    console.error("Authentication failed:", error);
  }

  return createContext(prisma, user, env);
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": env.CORS_ORIGIN || "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Allow-Credentials": "true",
          // Security headers
          "X-Content-Type-Options": "nosniff",
          "X-Frame-Options": "DENY",
          "X-XSS-Protection": "1; mode=block",
          "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
          "Referrer-Policy": "strict-origin-when-cross-origin",
        },
      });
    }

    // Clone the request for authentication to avoid body stream issues
    const authRequest = request.clone();

    const server = new ApolloServer({
      typeDefs,
      resolvers,
      introspection:
        env.GRAPHQL_INTROSPECTION === "true" ||
        env.ENVIRONMENT !== "production",
      formatError: (formattedError, error) => {
        if (env.ENVIRONMENT !== "production") {
          console.error(error);
          return {
            ...formattedError,
            extensions: {
              ...formattedError.extensions,
              originalError: error,
            },
          };
        }
        return formattedError;
      },
    });

    const handleGraphQL = startServerAndCreateCloudflareWorkersHandler(server, {
      context: async ({ env }: { request: Request; env: Env }) => {
        return createGraphQLContext(authRequest, env, env.DB);
      },
    });

    const response = await handleGraphQL(request, env, ctx);

    const responseHeaders = new Headers(response.headers);

    // CORS headers
    responseHeaders.set("Access-Control-Allow-Origin", env.CORS_ORIGIN || "*");
    responseHeaders.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    responseHeaders.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );
    responseHeaders.set("Access-Control-Allow-Credentials", "true");

    // Security headers
    responseHeaders.set("X-Content-Type-Options", "nosniff");
    responseHeaders.set("X-Frame-Options", "DENY");
    responseHeaders.set("X-XSS-Protection", "1; mode=block");
    responseHeaders.set("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'");
    responseHeaders.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    responseHeaders.set("Referrer-Policy", "strict-origin-when-cross-origin");
    responseHeaders.set("Permissions-Policy", "geolocation=(), microphone=(), camera=()");

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  },
};
