import { UserResolvers } from "../../gqlTypes";

export const User: UserResolvers = {
  articles: async (parent, {}, { services }) => {
    const articles = await services.article.getArticlesByAuthor(parent.id);
    return articles || [];
  },
};
