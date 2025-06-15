import { MutationResolvers } from "../../gqlTypes";
import { requireAuth } from "../../auth";

export const createArticle: MutationResolvers["createArticle"] = async (
  _parent,
  { input },
  { prisma, user }
) => {
  // 認証必須
  const authenticatedUser = requireAuth(user);
  
  // 注意: 現在のスキーマではuserIdはInt型ですが、
  // Supabase AuthのユーザーIDはUUID(string)なので、
  // 実際の実装では変換が必要です
  const article = await prisma.article.create({
    data: {
      title: input.title,
      content: input.content,
      user: {
        connect: { id: input.userId },
      },
      categories: {
        connect: input.categoryIds
          ? input.categoryIds.map((id) => ({ id }))
          : undefined,
      },
    },
  });

  return article;
};

export const updateArticle: MutationResolvers["updateArticle"] = async (
  _parent,
  { input },
  { prisma, user }
) => {
  // 認証必須
  requireAuth(user);
  
  const article = await prisma.article.update({
    where: { id: input.id },
    data: {
      title: input.title || undefined,
      content: input.content || undefined,
      categories: {
        set: input.categoryIds
          ? input.categoryIds.map((id) => ({ id }))
          : undefined,
      },
    },
  });

  return article;
};

export const deleteArticle: MutationResolvers["deleteArticle"] = async (
  _parent,
  { id },
  { prisma, user }
) => {
  // 認証必須
  requireAuth(user);
  
  try {
    await prisma.article.delete({
      where: { id },
    });
    return true;
  } catch (error) {
    console.error('Failed to delete article:', error);
    return false;
  }
};
