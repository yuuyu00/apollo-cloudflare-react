import { useQuery } from "@apollo/client";
import { Link } from "react-router";
import { GET_ARTICLES } from "../graphql/queries/articles";
import { useState } from "react";
import { getImageUrl } from "../utils/image";

export const ArticleList = () => {
  const { data, loading, error } = useQuery(GET_ARTICLES);
  const [imageLoadErrors, setImageLoadErrors] = useState<Set<string>>(
    new Set()
  );


  const handleImageError = (key: string) => {
    setImageLoadErrors((prev) => new Set(prev).add(key));
  };

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 className="text-5xl font-bold mb-20 text-title">
        The blog with Cloudflare
      </h1>

      {data?.articles.length === 0 ? (
        <p className="text-gray-600">記事がありません。</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data?.articles.map((article) => {
            const firstImage =
              article.images && article.images.length > 0
                ? article.images[0]
                : null;
            const hasValidImage =
              firstImage && !imageLoadErrors.has(firstImage.key);

            return (
              <Link
                key={article.id}
                to={`/articles/${article.id}`}
                className="group block"
              >
                <article className="relative bg-gray-800 rounded-2xl shadow-md hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 flex flex-col h-full transform hover:-translate-y-1 hover:bg-gray-750 border border-gray-700 hover:border-gray-600 overflow-hidden">
                  {/* Background image with overlay for articles with images */}
                  {firstImage && hasValidImage && (
                    <>
                      <div className="absolute inset-0 z-0">
                        <img
                          src={getImageUrl(firstImage.key, "thumb")}
                          alt=""
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={() => handleImageError(firstImage.key)}
                        />
                        <div className="absolute inset-0 bg-black/60 group-hover:bg-black/50 transition-colors duration-300" />
                      </div>
                    </>
                  )}

                  {/* Content with relative positioning to appear above background */}
                  <div
                    className={`relative z-10 p-6 flex flex-col h-full ${
                      firstImage && hasValidImage ? "text-white" : ""
                    }`}
                  >
                    <h2
                      className={`text-xl font-semibold mb-2 transition-colors duration-200 ${
                        firstImage && hasValidImage
                          ? "text-white group-hover:text-blue-300"
                          : "group-hover:text-blue-400"
                      }`}
                    >
                      {article.title}
                    </h2>

                    <div
                      className={`text-sm mb-3 ${
                        firstImage && hasValidImage
                          ? "text-gray-300"
                          : "text-gray-500"
                      }`}
                    >
                      {article.user.name}
                    </div>

                    <p
                      className={`mb-4 line-clamp-3 flex-grow ${
                        firstImage && hasValidImage
                          ? "text-gray-200"
                          : "text-gray-300"
                      }`}
                    >
                      {article.content}
                    </p>

                    <div className="flex flex-wrap gap-2 mt-auto">
                      {article.categories.map((category) => (
                        <span
                          key={category.id}
                          className={`px-2 py-1 text-xs rounded-full ${
                            firstImage && hasValidImage
                              ? "bg-white/20 text-white"
                              : "bg-blue-600/20 text-blue-400"
                          }`}
                        >
                          {category.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </article>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};
