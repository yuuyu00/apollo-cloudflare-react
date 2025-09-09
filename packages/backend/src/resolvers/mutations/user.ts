import { MutationResolvers } from "../../gqlTypes";
import { requireAuth } from "../../auth";
import { createClerkClient } from "@clerk/backend";

export const signUp: MutationResolvers["signUp"] = async (
  _parent,
  { name },
  { services, user, env }
) => {
  const authUser = requireAuth(user);

  const newUser = await services.user.createUser({
    email: authUser.email || "",
    name,
    sub: authUser.sub,
  });

  try {
    const secretKey = await env.CLERK_SECRET_KEY.get();
    const clerkClient = createClerkClient({
      secretKey,
      publishableKey: env.CLERK_PUBLISHABLE_KEY,
    });

    const updatedUser = await clerkClient.users.updateUserMetadata(
      authUser.sub,
      {
        publicMetadata: {
          userId: newUser.id,
          email: newUser.email,
        },
      }
    );
    console.log("Updated Clerk user metadata:", updatedUser);
  } catch (error) {
    console.error("Failed to update Clerk publicMetadata:", error);
  }

  return newUser;
};
