import { useParams, Link } from "react-router";
import { useQuery } from "@apollo/client";
import { GET_ARTICLE } from "../graphql/queries/articles";
import { useState } from "react";
import { getImageUrl } from "../utils/image";

export const ArticleDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { data, loading, error } = useQuery(GET_ARTICLE, {
    variables: { id: parseInt(id || "0") },
    skip: !id,
  });
  const [imageLoadErrors, setImageLoadErrors] = useState<Set<string>>(
    new Set()
  );

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

  if (!data?.article) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg text-gray-600">
          記事が見つかりませんでした。
        </div>
      </div>
    );
  }

  const { article } = data;

  const handleImageError = (key: string) => {
    setImageLoadErrors((prev) => new Set(prev).add(key));
  };

  return (
    <div className="max-w-4xl mx-auto py-8 pt-20">
      <Link
        to="/"
        className="inline-flex items-center text-gray-200 hover:text-gray-400 mb-6"
      >
        ← 記事一覧に戻る
      </Link>

      <article className="bg-gray-800 p-8 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold mb-4">{article.title}</h1>

        <div className="text-sm text-gray-500 mb-6">
          投稿者: {article.user.name}
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {article.categories.map((category) => (
            <span
              key={category.id}
              className="px-3 py-1 bg-blue-100 text-gray-700 text-sm rounded-full"
            >
              {category.name}
            </span>
          ))}
        </div>

        <div className="prose prose-lg max-w-none">
          <p className="whitespace-pre-wrap mb-8">{article.content}</p>

          {/* Display images if available */}
          {article.images && article.images.length > 0 && (
            <div className="mt-8 space-y-6">
              <h3 className="text-xl font-semibold text-gray-200 mb-4">画像</h3>
              <div className="grid grid-cols-1 gap-6">
                {article.images.map(
                  (image) =>
                    !imageLoadErrors.has(image.key) && (
                      <div key={image.id} className="relative group">
                        <img
                          src={getImageUrl(image.key, "content")}
                          alt={`${article.title} - 画像 ${image.id}`}
                          className="w-full h-auto rounded-lg shadow-lg"
                          loading="lazy"
                          onError={() => handleImageError(image.key)}
                        />
                      </div>
                    )
                )}
              </div>
            </div>
          )}
        </div>
      </article>
    </div>
  );
};
