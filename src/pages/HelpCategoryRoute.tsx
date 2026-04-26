import { useParams, Navigate } from "react-router-dom";
import HelpCategoryPage from "./HelpCategory";
import { helpCategories } from "@/data/helpArticles";

const HelpCategoryRoute = () => {
  const { slug } = useParams<{ slug: string }>();
  const data = slug ? helpCategories[slug] : undefined;

  if (!data) {
    return <Navigate to="/help" replace />;
  }

  return (
    <HelpCategoryPage
      slug={data.slug}
      title={data.title}
      description={data.description}
      articles={data.articles}
    />
  );
};

export default HelpCategoryRoute;
