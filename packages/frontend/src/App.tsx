import React, { useEffect, useMemo } from "react";
import {
  createBrowserRouter,
  RouterProvider,
  Link,
  Outlet,
  useNavigate,
} from "react-router";
import {
  ApolloProvider,
  ApolloClient,
  InMemoryCache,
  createHttpLink,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { ClerkProvider, useAuth as useClerkAuth } from "@clerk/clerk-react";
import {
  ArticleDetail,
  ArticleList,
  Login,
  Signup,
  CreateArticle,
  SignUpProfile,
} from "./screens";
import ImageCacheTest from "./pages/ImageCacheTest";
import { AuthProvider } from "./contexts/AuthContext";
import { ToastProvider } from "./contexts/ToastContext";
import { AuthGuard } from "./components/AuthGuard";
import { EmailConfirmationHandler } from "./components/EmailConfirmationHandler";
import { Button } from "./components/ui/button";
import { useAuth } from "./contexts/AuthContext";
import { PlusIcon } from "@heroicons/react/24/solid";
import { setupZodJapaneseErrorMap } from "./lib/zod-japanese";

const Header = () => {
  const { user, signOut } = useAuth();

  return (
    <div className="absolute top-0 right-0 p-6">
      {user ? (
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">{user.email}</span>
          <Button
            onClick={signOut}
            plain
            className="text-text hover:text-white"
          >
            ログアウト
          </Button>
        </div>
      ) : (
        <Link to="/login">
          <Button color="blue">ログイン</Button>
        </Link>
      )}
    </div>
  );
};

const FAB = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <button
      onClick={() => navigate("/articles/new")}
      className="fixed z-50 bottom-8 right-8 bg-primary hover:bg-primary/90 text-white w-14 h-14 rounded-full shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-110 flex items-center justify-center group"
      aria-label="新規投稿を作成"
    >
      <PlusIcon className="w-6 h-6" />
      <span className="absolute right-full mr-3 bg-gray-800 text-white text-sm px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
        新規投稿を作成
      </span>
    </button>
  );
};

const RootLayout = () => {
  return (
    <>
      <Header />
      <div className="py-24">
        <Outlet />
      </div>
      <FAB />
    </>
  );
};

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!CLERK_PUBLISHABLE_KEY) {
  throw new Error("Missing Clerk Publishable Key");
}

const ApolloProviderWrapper = ({ children }: { children: React.ReactNode }) => {
  const { getToken } = useClerkAuth();

  // Memoize Apollo Client to prevent recreation on token updates
  const apolloClient = useMemo(() => {
    // Create HTTP link
    const httpLink = createHttpLink({
      uri: import.meta.env.VITE_GRAPHQL_ENDPOINT,
      credentials: "include",
    });

    // Create auth link to add JWT token to requests
    // IMPORTANT: This uses a closure to capture getToken, but doesn't recreate the client
    const authLink = setContext(async (_, { headers }) => {
      const token = await getToken();
      return {
        headers: {
          ...headers,
          authorization: token ? `Bearer ${token}` : "",
        },
      };
    });

    // Apollo Client with auth context
    return new ApolloClient({
      link: authLink.concat(httpLink),
      cache: new InMemoryCache(),
      defaultOptions: {
        watchQuery: {
          fetchPolicy: "cache-first",
        },
      },
    });
  }, []); // Empty dependency array - client created only once

  return (
    <ApolloProvider client={apolloClient}>
      <AuthProvider>
        <ToastProvider>{children}</ToastProvider>
      </AuthProvider>
    </ApolloProvider>
  );
};

const AppProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="bg-background min-h-screen text-text relative">
      <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
        <ApolloProviderWrapper>{children}</ApolloProviderWrapper>
      </ClerkProvider>
    </div>
  );
};

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <ArticleList />,
      },
      {
        path: "articles/:id",
        element: <ArticleDetail />,
      },
      {
        path: "login",
        element: <Login />,
      },
      {
        path: "signup",
        element: <Signup />,
      },
      {
        path: "signup-profile",
        element: <SignUpProfile />,
      },
      {
        path: "auth/callback",
        element: <EmailConfirmationHandler />,
      },
      {
        path: "image-cache-test",
        element: <ImageCacheTest />,
      },
      // Protected routes
      {
        element: <AuthGuard />,
        children: [
          {
            path: "articles/new",
            element: <CreateArticle />,
          },
        ],
      },
    ],
  },
]);

const App = () => {
  useEffect(() => {
    setupZodJapaneseErrorMap();
  }, []);

  return (
    <AppProvider>
      <RouterProvider router={router} />
    </AppProvider>
  );
};

export default App;
