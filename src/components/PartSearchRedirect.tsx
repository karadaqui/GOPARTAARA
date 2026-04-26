import { Navigate, useLocation } from "react-router-dom";

/**
 * Catch-all redirect for slug-style URLs that look like part names.
 *
 * Blog posts (and external links) sometimes reference pages like
 * /brake-discs, /engine-sensors, /clutch-kit, /alternator etc. These
 * pages don't exist as standalone routes — instead of returning a 404,
 * we redirect to the search page using the slug as the query.
 *
 * Only redirects when the path looks like a single-segment, hyphenated
 * part name (letters/numbers/hyphens only). Anything else (paths with
 * slashes, dots, query-only oddities) falls through to the 404 page.
 */
const PartSearchRedirect = () => {
  const { pathname } = useLocation();

  // Strip leading slash, then validate shape
  const slug = pathname.replace(/^\/+/, "").replace(/\/+$/, "");

  // Must be a single segment (no slashes), no file extension,
  // and only contain letters, numbers, and hyphens.
  const looksLikePartSlug =
    slug.length > 0 &&
    slug.length <= 80 &&
    !slug.includes("/") &&
    !slug.includes(".") &&
    /^[a-zA-Z0-9-]+$/.test(slug);

  if (!looksLikePartSlug) {
    // Fall through to NotFound — render nothing here; the parent route
    // setup will continue to the 404 route via Navigate to /404-style.
    // We use Navigate to a sentinel path that the * route catches.
    return <Navigate to="/__not_found" replace />;
  }

  const term = slug.replace(/-/g, " ").trim();
  return <Navigate to={`/search?q=${encodeURIComponent(term)}`} replace />;
};

export default PartSearchRedirect;
