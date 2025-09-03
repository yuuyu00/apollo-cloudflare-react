import { MutationResolvers } from "../../gqlTypes";

export const createCategory: MutationResolvers["createCategory"] = async (
  _parent,
  { input },
  { services }
) => {
  return services.category.createCategory(input);
};

export const updateCategory: MutationResolvers["updateCategory"] = async (
  _parent,
  { input },
  { services }
) => {
  return services.category.updateCategory(input.id, input);
};
