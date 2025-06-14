import { useParams } from "react-router-dom";

export const ArticleDetail = () => {
  useParams<{ id: string }>();

  return <div>ArticleDetail</div>;
};
