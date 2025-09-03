import { MutationResolvers } from "../../gqlTypes";
import { requireAuth } from "../../auth";

export const createArticle: MutationResolvers["createArticle"] = async (
  _parent,
  { input },
  { services, user }
) => {
  const authenticatedUser = requireAuth(user);

  return services.article.createArticle(input, authenticatedUser.userId);
};

export const updateArticle: MutationResolvers["updateArticle"] = async (
  _parent,
  { input },
  { services, user }
) => {
  const authenticatedUser = requireAuth(user);

  return services.article.updateArticle(
    input.id,
    input,
    authenticatedUser.userId
  );
};

export const deleteArticle: MutationResolvers["deleteArticle"] = async (
  _parent,
  { id },
  { services, user }
) => {
  const authenticatedUser = requireAuth(user);

  try {
    await services.article.deleteArticle(id, authenticatedUser.userId);
    return true;
  } catch (error) {
    console.error("Failed to delete article:", error);
    throw error;
  }
};
