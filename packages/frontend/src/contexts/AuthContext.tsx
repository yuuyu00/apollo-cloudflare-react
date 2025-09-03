import { createContext, useContext } from "react";
import {
  useAuth as useClerkAuth,
  useUser as useClerkUser,
  useClerk,
  useSignUp,
  useSignIn,
} from "@clerk/clerk-react";
import type { SignUpResource } from "@clerk/types";

// Custom user type for compatibility with existing code
interface User {
  id: string;
  email: string;
  email_confirmed_at: string | null;
  created_at: string;
}

// Custom session type for compatibility with existing code
interface Session {
  access_token: null; // Not used with Clerk but kept for compatibility
  user: User | null;
}

// Sign up result type
interface SignUpResult {
  status: "complete" | "needs_verification" | "incomplete";
  verificationMethod?: "email_code";
  result?: SignUpResource;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<SignUpResult>;
  verifyEmail: (code: string) => Promise<void>;
  signOut: () => Promise<void>;
  signUpState: SignUpResource | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const clerk = useClerk();
  const { signUp: clerkSignUp } = useSignUp();
  const { signIn: clerkSignIn } = useSignIn();
  const { isLoaded, userId, sessionId } = useClerkAuth();
  const { user: clerkUser, isLoaded: userLoaded } = useClerkUser();

  const loading = !isLoaded || !userLoaded;

  const user = clerkUser
    ? {
        id: clerkUser.id,
        email: clerkUser.primaryEmailAddress?.emailAddress || "",
        email_confirmed_at:
          clerkUser.primaryEmailAddress?.verification?.status === "verified"
            ? new Date().toISOString()
            : null,
        created_at:
          clerkUser.createdAt?.toISOString() || new Date().toISOString(),
      }
    : null;

  const session =
    userId && sessionId
      ? {
          access_token: null,
          user: user,
        }
      : null;

  const signIn = async (email: string, password: string) => {
    if (!clerkSignIn) {
      throw new Error("Sign in is not available");
    }

    try {
      const result = await clerkSignIn.create({
        identifier: email,
        password,
      });

      if (result.status === "complete") {
        await clerk.setActive({ session: result.createdSessionId });
        window.location.href = "/";
      } else {
        throw new Error("Sign in failed");
      }
    } catch (error) {
      if (error && typeof error === "object" && "errors" in error) {
        const clerkError = error as { errors?: Array<{ message?: string }> };
        throw new Error(clerkError.errors?.[0]?.message || "Sign in failed");
      }
      throw new Error("Sign in failed");
    }
  };

  const signUp = async (email: string, password: string) => {
    if (!clerkSignUp) {
      throw new Error("Sign up is not available");
    }

    try {
      const result = await clerkSignUp.create({
        emailAddress: email,
        password,
      });

      if (result.status === "complete") {
        // アカウント作成完了
        await clerk.setActive({ session: result.createdSessionId });
        return { status: "complete" as const };
      } else if (result.unverifiedFields?.includes("email_address")) {
        // メール認証が必要
        await result.prepareEmailAddressVerification({
          strategy: "email_code",
        });
        return {
          status: "needs_verification" as const,
          verificationMethod: "email_code" as const,
        };
      } else {
        return { status: "incomplete" as const, result };
      }
    } catch (error) {
      if (error && typeof error === "object") {
        if ("errors" in error) {
          const clerkError = error as { errors?: Array<{ message?: string }> };
          throw new Error(clerkError.errors?.[0]?.message || "Sign up failed");
        }
        if ("message" in error) {
          throw new Error((error as Error).message || "Sign up failed");
        }
      }
      throw new Error("Sign up failed");
    }
  };

  const verifyEmail = async (code: string) => {
    if (!clerkSignUp) {
      throw new Error("Sign up is not available");
    }

    try {
      const result = await clerkSignUp.attemptEmailAddressVerification({
        code,
      });

      if (result.status === "complete") {
        await clerk.setActive({ session: result.createdSessionId });
      } else {
        throw new Error("Verification failed");
      }
    } catch (error) {
      if (error && typeof error === "object") {
        if ("errors" in error) {
          const clerkError = error as { errors?: Array<{ message?: string }> };
          throw new Error(
            clerkError.errors?.[0]?.message || "Verification failed"
          );
        }
        if ("message" in error) {
          throw new Error((error as Error).message || "Verification failed");
        }
      }
      throw new Error("Verification failed");
    }
  };

  const signOut = async () => {
    await clerk.signOut();
    window.location.href = "/login";
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    verifyEmail,
    signOut,
    signUpState: clerkSignUp || null,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
