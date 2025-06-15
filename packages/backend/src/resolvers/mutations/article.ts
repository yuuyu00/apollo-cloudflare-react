import { MutationResolvers } from "../../gqlTypes";
import { requireAuth } from "../../auth";

export const createArticle: MutationResolvers["createArticle"] = async (
  _parent,
  { input },
  { prisma, user }
) => {
  // 認証必須
  const authenticatedUser = requireAuth(user);
  
  // 認証されたユーザーをsubで検索
  const dbUser = await prisma.user.findUnique({
    where: { sub: authenticatedUser.sub }
  });
  
  if (!dbUser) {
    throw new Error("User not found. Please sign up first.");
  }
  
  const article = await prisma.article.create({
    data: {
      title: input.title,
      content: input.content,
      user: {
        connect: { id: dbUser.id },
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
  const authenticatedUser = requireAuth(user);
  
  // 認証されたユーザーをsubで検索
  const dbUser = await prisma.user.findUnique({
    where: { sub: authenticatedUser.sub }
  });
  
  if (!dbUser) {
    throw new Error("User not found. Please sign up first.");
  }
  
  // 記事の所有者確認
  const existingArticle = await prisma.article.findUnique({
    where: { id: input.id },
    include: { user: true }
  });
  
  if (!existingArticle) {
    throw new Error("Article not found.");
  }
  
  if (existingArticle.userId !== dbUser.id) {
    throw new Error("You don't have permission to update this article.");
  }
  
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
  const authenticatedUser = requireAuth(user);
  
  // 認証されたユーザーをsubで検索
  const dbUser = await prisma.user.findUnique({
    where: { sub: authenticatedUser.sub }
  });
  
  if (!dbUser) {
    throw new Error("User not found. Please sign up first.");
  }
  
  // 記事の所有者確認
  const existingArticle = await prisma.article.findUnique({
    where: { id },
    include: { user: true }
  });
  
  if (!existingArticle) {
    throw new Error("Article not found.");
  }
  
  if (existingArticle.userId !== dbUser.id) {
    throw new Error("You don't have permission to delete this article.");
  }
  
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
