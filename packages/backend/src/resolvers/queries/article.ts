import { QueryResolvers } from "../../gqlTypes";

export const articles: QueryResolvers["articles"] = async (
  _parent,
  _args,
  { prisma }
) => {
  return prisma.article.findMany();
};

export const article: QueryResolvers["article"] = async (
  _parent,
  { id },
  { prisma }
) => {
  return prisma.article.findUnique({
    where: {
      id,
    },
  });
};
