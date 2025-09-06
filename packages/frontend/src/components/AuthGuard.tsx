import { useEffect, useState } from "react";
import { useNavigate, Outlet } from "react-router";
import { useQuery } from "@apollo/client";
import { gql } from "@apollo/client";
import { useAuth } from "@/contexts/AuthContext";

const CHECK_USER = gql`
  query CheckUser {
    me {
      id
      sub
      name
      email
    }
  }
`;

export const AuthGuard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [hasInitialCheck, setHasInitialCheck] = useState(false);

  // Check if user exists in our database
  const {
    data,
    loading: checkingUser,
    error,
  } = useQuery(CHECK_USER, {
    skip: !user || authLoading,
    fetchPolicy: hasInitialCheck ? "cache-only" : "cache-first",
    nextFetchPolicy: "cache-only",
    notifyOnNetworkStatusChange: false,
  });

  useEffect(() => {
    // Only run once when initial check is complete
    if (hasInitialCheck) return;

    // Skip during loading states
    if (authLoading || checkingUser) return;

    // Add cleanup flag to prevent navigation after unmount
    let isActive = true;

    // Perform navigation only if component is still mounted
    const performNavigation = (path: string) => {
      if (isActive) {
        navigate(path);
      }
    };

    if (!user) {
      // Not logged in, redirect to login
      performNavigation("/login");
    } else if (error) {
      // Distinguish between different error types
      if (error.graphQLErrors?.[0]?.extensions?.code === "NOT_FOUND") {
        // User not found in database, needs profile setup
        console.log("User not found in database, redirecting to profile setup");
        performNavigation("/signup-profile");
      } else {
        // Network or other error - log but don't redirect
        console.error("Error checking user profile:", error);
        // Still allow access to avoid blocking users due to network issues
      }
    } else if (!data?.me) {
      // No profile data (but no error), redirect to profile setup
      performNavigation("/signup-profile");
    }

    setHasInitialCheck(true);

    return () => {
      isActive = false;
    };
  }, [user, authLoading, checkingUser, data, error, navigate, hasInitialCheck]);

  if ((authLoading || checkingUser) && !hasInitialCheck) {
    return (
      <div
        className="flex justify-center items-center min-h-screen"
        role="status"
        aria-label="認証状態を確認中"
      >
        <div className="text-lg text-gray-400">読み込み中...</div>
      </div>
    );
  }

  // After initial check, always render Outlet to prevent unmounting
  // This allows background authentication checks without disrupting the user experience
  return (
    <>
      {checkingUser && hasInitialCheck && (
        <div
          className="fixed top-0 left-0 right-0 z-50"
          role="status"
          aria-label="データを更新中"
        >
          <div className="h-1 bg-blue-500 animate-pulse" />
          <span className="sr-only">
            バックグラウンドでデータを更新しています。
          </span>
        </div>
      )}
      <Outlet />
    </>
  );
};
