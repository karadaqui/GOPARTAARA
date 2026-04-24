import { Link } from "react-router-dom";
import { Fragment } from "react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

/**
 * Minimal text breadcrumbs.
 * Style: 12px, color #52525b for ancestors and separators, white for current.
 * Also injects BreadcrumbList JSON-LD for SEO.
 */
const Breadcrumbs = ({ items, className }: BreadcrumbsProps) => {
  if (!items || items.length === 0) return null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.label,
      ...(item.href
        ? { item: `https://gopartara.com${item.href}` }
        : {}),
    })),
  };

  return (
    <nav
      aria-label="Breadcrumb"
      className={className}
      style={{ fontSize: "12px", color: "#52525b" }}
    >
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <Fragment key={`${item.label}-${idx}`}>
              <li className="min-w-0">
                {item.href && !isLast ? (
                  <Link
                    to={item.href}
                    className="transition-colors hover:text-white"
                    style={{ color: "#52525b" }}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span
                    aria-current={isLast ? "page" : undefined}
                    className="truncate inline-block max-w-[60vw] align-bottom"
                    style={{ color: isLast ? "#ffffff" : "#52525b" }}
                  >
                    {item.label}
                  </span>
                )}
              </li>
              {!isLast && (
                <li aria-hidden="true" style={{ color: "#3f3f46" }}>
                  ›
                </li>
              )}
            </Fragment>
          );
        })}
      </ol>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </nav>
  );
};

export default Breadcrumbs;
