import { createClerkClient } from "@clerk/backend";

export interface AuthUser {
  sub: string;
  email: string;
  userId: number;
  sessionId: string;
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

export async function verifyJWT(
  request: Request,
  env: Env
): Promise<AuthUser | null> {
  try {
    const authHeader = request.headers.get("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }

    const secretKey = await env.CLERK_SECRET_KEY.get();

    const clerk = createClerkClient({
      secretKey,
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

      if (!emailFromClaims || !emailFromClaims.includes("@")) {
        throw new AuthError("Invalid email in token");
      }

      if (!userIdFromClaims) {
        throw new AuthError("Invalid userId in token");
      }

      const user: AuthUser = {
        sub: auth.userId,
        userId: userIdFromClaims,
        sessionId: auth.sessionId,
        email: emailFromClaims,
      };

      return user;
    } catch (error) {
      console.error("authenticateRequest failed:", error);
      return null;
    }
  } catch (error) {
    console.error("Token verification error:", error);
    return null;
  }
}

export function requireAuth(user: AuthUser | null): AuthUser {
  if (!user) {
    throw new AuthError("Authentication required");
  }
  return user;
}
