import { MutationResolvers } from "../../gqlTypes";
import { requireAuth } from "../../auth";

export const signUp: MutationResolvers["signUp"] = async (
  _parent,
  { name },
  { prisma, user }
) => {
  const authUser = requireAuth(user);

  // Check if user already exists with this sub
  const existingUser = await prisma.user.findUnique({
    where: { sub: authUser.sub },
  });

  if (existingUser) {
    // Update existing user's name if it changed
    return await prisma.user.update({
      where: { sub: authUser.sub },
      data: { name },
      include: { articles: { include: { categories: true } } },
    });
  }

  // Create new user
  return await prisma.user.create({
    data: {
      sub: authUser.sub,
      email: authUser.email || "",
      name,
    },
    include: { articles: { include: { categories: true } } },
  });
};
