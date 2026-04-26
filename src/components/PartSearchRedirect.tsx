import { Navigate, useLocation } from "react-router-dom";
import NotFound from "@/pages/NotFound";

/**
 * Catch-all redirect for slug-style URLs that look like part names.
 *
 * Blog posts and external links sometimes reference pages like
 * /brake-discs, /engine-sensors, /clutch-kit, /alternator etc. These
 * pages don't exist as standalone routes — instead of returning a 404,
 * we redirect to the search page using the slug as the query.
 *
 * Only redirects when the path looks like a single-segment, hyphenated
 * part name (letters/numbers/hyphens only). Anything else falls through
 * to the standard 404 page.
 */
const PartSearchRedirect = () => {
  const { pathname } = useLocation();

  const slug = pathname.replace(/^\/+/, "").replace(/\/+$/, "");

  const looksLikePartSlug =
    slug.length > 0 &&
    slug.length <= 80 &&
    !slug.includes("/") &&
    !slug.includes(".") &&
    /^[a-zA-Z0-9-]+$/.test(slug);

  if (!looksLikePartSlug) {
    return <NotFound />;
  }

  const term = slug.replace(/-/g, " ").trim();
  return <Navigate to={`/search?q=${encodeURIComponent(term)}`} replace />;
};

export default PartSearchRedirect;
