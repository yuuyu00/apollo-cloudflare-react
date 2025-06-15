import { QueryResolvers } from "../../gqlTypes";

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
