import { createClerkClient } from "@clerk/backend";
import type { Env } from "./types";

export interface AuthUser {
  sub: string;
  email: string;
  userId: number;
  sessionId: string;
  role?: string;
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

export async function verifyJWT(
  request: Request,
  env: Env,
  options?: { skipUserIdCheck?: boolean }
): Promise<AuthUser | null> {
  try {
    // Get the Authorization header
    const authHeader = request.headers.get("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }

    const clerk = createClerkClient({
      secretKey: env.CLERK_SECRET_KEY,
      publishableKey: env.CLERK_PUBLISHABLE_KEY,
      jwtKey: env.CLERK_PEM_PUBLIC_KEY,
    });

    try {
      const requestState = await clerk.authenticateRequest(request, {
        authorizedParties: [env.CORS_ORIGIN ?? ""],
      });

      if (!requestState.isAuthenticated) {
        return null;
      }

      const auth = requestState.toAuth();
      const emailFromClaims =
        (auth.sessionClaims?.email as string | null) ?? null;
      const userIdFromClaims =
        (auth.sessionClaims?.userId as number | null) ?? null;

      if (
        (!emailFromClaims || !emailFromClaims.includes("@")) &&
        !options?.skipUserIdCheck
      ) {
        throw new AuthError("Invalid email in token");
      }

      if (!userIdFromClaims && !options?.skipUserIdCheck) {
        throw new AuthError("Invalid userId in token");
      }

      const user: AuthUser = {
        sub: auth.userId,
        userId: userIdFromClaims ?? 0,
        sessionId: auth.sessionId,
        email: emailFromClaims ?? "",
      };

      return user;
    } catch (error) {
      console.error("authenticateRequest failed:", error);
      return null;
    }
  } catch (error) {
    console.error("Token verification error:", error);

    if (error && typeof error === "object" && "clerkError" in error) {
      const clerkError = error as { clerkError: boolean; status?: number };
      if (clerkError.status === 401) {
        return null;
      }
    }

    console.error("Unexpected auth error:", error);
    return null;
  }
}

/**
 * GraphQL リゾルバー用の認証ガード
 */
export function requireAuth(user: AuthUser | null): AuthUser {
  if (!user) {
    throw new AuthError("Authentication required");
  }
  return user;
}

/**
 * 特定のロールを要求するガード
 */
export function requireRole(
  user: AuthUser | null,
  requiredRole: string
): AuthUser {
  const authenticatedUser = requireAuth(user);

  if (authenticatedUser.role !== requiredRole) {
    throw new AuthError(`Role '${requiredRole}' required`);
  }

  return authenticatedUser;
}
