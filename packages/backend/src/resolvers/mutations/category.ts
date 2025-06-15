import { MutationResolvers } from "../../gqlTypes";

export const createCategory: MutationResolvers["createCategory"] = async (
  _parent,
  { input },
  { prisma }
) => {
  const category = await prisma.category.create({
    data: input,
  });

  return category;
};

export const updateCategory: MutationResolvers["updateCategory"] = async (
  _parent,
  { input },
  { prisma }
) => {
  const category = await prisma.category.update({
    data: {
      name: input.name || undefined,
    },
    where: {
      id: input.id,
    },
  });

  return category;
};
