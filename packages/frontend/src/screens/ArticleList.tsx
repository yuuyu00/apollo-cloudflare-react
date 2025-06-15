import { useQuery } from "@apollo/client";
import { Link } from "react-router-dom";
import { GET_ARTICLES } from "../graphql/queries/articles";

export const ArticleList = () => {
  const { data, loading, error } = useQuery(GET_ARTICLES);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg text-gray-600">読み込み中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg text-red-600">
          エラーが発生しました: {error.message}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">記事一覧</h1>

      {data?.articles.length === 0 ? (
        <p className="text-gray-600">記事がありません。</p>
      ) : (
        <div className="space-y-6">
          {data?.articles.map((article) => (
            <article
              key={article.id}
              className="bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
            >
              <h2 className="text-2xl font-semibold mb-2">
                <Link to={`/articles/${article.id}`}>{article.title}</Link>
              </h2>

              <div className="text-sm text-gray-600 mb-3">
                投稿者: {article.user.name} ({article.user.email})
              </div>

              <p className="mb-4 line-clamp-3">{article.content}</p>

              <div className="flex flex-wrap gap-2">
                {article.categories.map((category) => (
                  <span
                    key={category.id}
                    className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                  >
                    {category.name}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
