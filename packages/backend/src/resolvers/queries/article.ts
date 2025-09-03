import { QueryResolvers } from "../../gqlTypes";

export const articles: QueryResolvers["articles"] = async (
  _parent,
  _args,
  { services }
) => {
  return services.article.getArticles();
};

export const article: QueryResolvers["article"] = async (
  _parent,
  { id },
  { services }
) => {
  return services.article.getArticle(id);
};
