import { QueryResolvers } from "../../gqlTypes";

export const categories: QueryResolvers["categories"] = async (
  _parent,
  _args,
  { services }
) => {
  return services.category.getCategories();
};

export const category: QueryResolvers["category"] = async (
  _parent,
  { id },
  { services }
) => {
  return services.category.getCategory(id);
};
