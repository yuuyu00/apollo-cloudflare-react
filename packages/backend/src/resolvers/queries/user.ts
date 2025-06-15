import { QueryResolvers } from "../../gqlTypes";
import { requireAuth } from "../../auth";

export const users: QueryResolvers["users"] = async (_parent, _args, { prisma }) => {
  return prisma.user.findMany();
};

export const user: QueryResolvers["user"] = async (_parent, { id }, { prisma }) => {
  return prisma.user.findUnique({
    where: {
      id,
    },
  });
};

export const me: QueryResolvers["me"] = async (_parent, _args, context) => {
  const authUser = requireAuth(context.user);
  
  return context.prisma.user.findUnique({
    where: {
      sub: authUser.sub,
    },
  });
};
