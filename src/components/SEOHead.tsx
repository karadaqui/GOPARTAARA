import { useEffect } from "react";

interface SEOHeadProps {
  title: string;
  description: string;
  path?: string;
  type?: string;
  image?: string;
  jsonLd?: Record<string, any>;
  /** Additional JSON-LD blocks (e.g. FAQ schema) rendered as separate <script> tags */
  additionalJsonLd?: Record<string, any>[];
  /** When true, set robots noindex,nofollow (private pages) */
  noindex?: boolean;
  /** Optional comma-separated meta keywords for SEO */
  keywords?: string;
}

const BASE_URL = "https://gopartara.com";
const DEFAULT_IMAGE = `${BASE_URL}/og-image.png`;

const SEOHead = ({
  title,
  description,
  path = "",
  type = "website",
  image,
  jsonLd,
  additionalJsonLd,
  noindex = false,
}: SEOHeadProps) => {
  const fullTitle = /GOPARTARA/i.test(title) ? title : `${title} | GOPARTARA`;
  const url = `${BASE_URL}${path}`;
  const ogImage = image || DEFAULT_IMAGE;

  useEffect(() => {
    document.title = fullTitle;

    const setMeta = (attr: string, key: string, content: string) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    setMeta("name", "description", description);
    setMeta("name", "robots", noindex ? "noindex, nofollow" : "index, follow");
    setMeta("property", "og:title", fullTitle);
    setMeta("property", "og:description", description);
    setMeta("property", "og:url", url);
    setMeta("property", "og:type", type);
    setMeta("property", "og:image", ogImage);
    setMeta("property", "og:site_name", "GOPARTARA");
    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:title", fullTitle);
    setMeta("name", "twitter:description", description);
    setMeta("name", "twitter:image", ogImage);

    // Canonical
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", url);

    // JSON-LD — clear all previously injected blocks
    document.querySelectorAll('script[data-seo-jsonld]').forEach((n) => n.remove());

    const injectLd = (data: Record<string, any>) => {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.setAttribute("data-seo-jsonld", "true");
      script.textContent = JSON.stringify(data);
      document.head.appendChild(script);
    };

    if (jsonLd) injectLd(jsonLd);
    if (additionalJsonLd && Array.isArray(additionalJsonLd)) {
      additionalJsonLd.forEach((data) => data && injectLd(data));
    }

    return () => {
      document.querySelectorAll('script[data-seo-jsonld]').forEach((n) => n.remove());
    };
  }, [fullTitle, description, url, type, ogImage, jsonLd, additionalJsonLd, noindex]);

  return null;
};

export default SEOHead;
