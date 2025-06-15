import { QueryResolvers } from "../../gqlTypes";

export const categories: QueryResolvers["categories"] = async (
  _parent,
  _args,
  { prisma }
) => {
  return prisma.category.findMany();
};

export const category: QueryResolvers["category"] = async (
  _parent,
  { id },
  { prisma }
) => {
  return prisma.category.findUnique({
    where: {
      id,
    },
  });
};
