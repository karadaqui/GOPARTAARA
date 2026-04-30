import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import DOMPurify from "dompurify";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import Breadcrumbs from "@/components/Breadcrumbs";
import { ArrowLeft, Loader2, ArrowRight, Link as LinkIcon, Check, ThumbsUp, ThumbsDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BlogPostData {
  id: string;
  title: string;
  slug: string;
  content: string;
  preview: string;
  meta_description: string;
  keywords: string[];
  category: string | null;
  read_time: string | null;
  author: string;
  published_at: string;
}

interface TocItem {
  id: string;
  text: string;
  level: number;
}

const slugify = (text: string) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 80);

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [post, setPost] = useState<BlogPostData | null>(null);
  const [related, setRelated] = useState<BlogPostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activeId, setActiveId] = useState<string>("");
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);
  const articleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (slug) fetchPost();
    window.scrollTo(0, 0);
    setFeedback(null);
  }, [slug]);

  const fetchPost = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("slug", slug)
      .eq("published", true)
      .single();

    if (!error && data) {
      const p = data as BlogPostData;
      setPost(p);
      if (p.category) {
        const { data: relatedData } = await supabase
          .from("blog_posts")
          .select("id, title, slug, preview, meta_description, keywords, category, read_time, author, published_at, content")
          .eq("published", true)
          .eq("category", p.category)
          .neq("id", p.id)
          .limit(3);
        if (relatedData) setRelated(relatedData as BlogPostData[]);
      }
    }
    setLoading(false);
  };

  // Process content: inject ids on h2/h3, build TOC
  const { processedHtml, toc } = useMemo(() => {
    if (!post) return { processedHtml: "", toc: [] as TocItem[] };
    const sanitized = DOMPurify.sanitize(post.content);
    if (typeof window === "undefined") return { processedHtml: sanitized, toc: [] };
    const doc = new DOMParser().parseFromString(sanitized, "text/html");
    const items: TocItem[] = [];
    const used = new Set<string>();
    doc.querySelectorAll("h2, h3").forEach((el) => {
      const text = el.textContent?.trim() || "";
      if (!text) return;
      let id = slugify(text);
      let i = 2;
      while (used.has(id)) { id = `${slugify(text)}-${i++}`; }
      used.add(id);
      el.setAttribute("id", id);
      items.push({ id, text, level: el.tagName === "H2" ? 2 : 3 });
    });
    return { processedHtml: doc.body.innerHTML, toc: items };
  }, [post]);

  // Track active TOC heading
  useEffect(() => {
    if (!articleRef.current || toc.length === 0) return;
    const headings = toc
      .map((t) => document.getElementById(t.id))
      .filter((el): el is HTMLElement => !!el);
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-96px 0px -70% 0px", threshold: 0 }
    );
    headings.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [toc]);

  const categoryColor = (_cat: string | null) =>
    "bg-[#cc1111] text-white";

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`https://gopartara.com/blog/${post?.slug}`);
      setCopied(true);
      toast({ title: "Link copied", description: "Article link copied to clipboard." });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Copy failed", description: "Please copy the URL manually.", variant: "destructive" });
    }
  };

  const handleFeedback = (value: "up" | "down") => {
    setFeedback(value);
    toast({
      title: value === "up" ? "Thanks for the feedback!" : "Sorry to hear that",
      description: value === "up" ? "Glad you found it useful." : "We'll work on making it better.",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="animate-spin text-[#cc1111]" size={32} />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container max-w-3xl py-20 px-4 text-center">
          <h1 className="text-3xl font-bold mb-4 text-white">Post Not Found</h1>
          <p className="text-zinc-500 mb-6">This blog post doesn't exist or has been removed.</p>
          <button onClick={() => navigate("/blog")} className="text-[#cc1111] font-medium hover:underline">
            ← Back to Blog
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  const formattedDate = new Date(post.published_at).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={`${post.title} | GOPARTARA Blog`}
        description={post.meta_description || post.preview}
        path={`/blog/${post.slug}`}
        type="article"
        image={(post as any).cover_image || (post as any).image_url || undefined}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": post.title,
          "description": post.meta_description || post.preview,
          "image": (post as any).cover_image || (post as any).image_url || "https://gopartara.com/og-image.png",
          "datePublished": post.published_at,
          "dateModified": (post as any).updated_at || post.published_at,
          "author": {
            "@type": "Organization",
            "name": "GOPARTARA",
          },
          "publisher": {
            "@type": "Organization",
            "name": "GOPARTARA",
            "logo": {
              "@type": "ImageObject",
              "url": "https://gopartara.com/favicon.png",
            },
          },
          "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": `https://gopartara.com/blog/${post.slug}`,
          },
        }}
      />
      <Navbar />

      <div className="pt-16 pb-24 px-4 sm:px-6">
        {/* xl: 3-col grid with sticky TOC sidebar */}
        <div className="mx-auto max-w-[1200px] xl:grid xl:grid-cols-[1fr_minmax(0,720px)_1fr] xl:gap-8">
          {/* Left spacer (desktop) */}
          <div className="hidden xl:block" />

          {/* Article column */}
          <article className="mx-auto w-full max-w-[720px]">
            <Breadcrumbs
              className="mb-6"
              items={[
                { label: "Home", href: "/" },
                { label: "Blog", href: "/blog" },
                { label: post.title },
              ]}
            />

            {/* Back button */}
            <button
              onClick={() => navigate("/blog")}
              className="inline-flex items-center gap-2 text-sm text-[#52525b] hover:text-white transition-colors mb-10"
            >
              <ArrowLeft size={14} />
              Back to Blog
            </button>

            {/* Header */}
            <header>
              {post.category && (
                <span className={`inline-block text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full ${categoryColor(post.category)}`}>
                  {post.category}
                </span>
              )}
              <h1
                className="mt-5 font-display font-extrabold text-white"
                style={{
                  fontSize: "clamp(32px, 4vw, 52px)",
                  letterSpacing: "-0.03em",
                  lineHeight: 1.1,
                }}
              >
                {post.title}
              </h1>
              <p className="mt-5 text-[13px] text-[#52525b]">
                {formattedDate}
                {post.read_time && <> · {post.read_time}</>}
                {" · By "}{(!post.author || /partara/i.test(post.author)) ? "GOPARTARA Team" : post.author}
              </p>
              <div className="mt-8 mb-10 border-b border-[#1f1f1f]" />
            </header>

            {/* Body */}
            <div
              ref={articleRef}
              className="article-prose"
              dangerouslySetInnerHTML={{ __html: processedHtml }}
            />

            {/* Amazon affiliate */}
            <div className="mt-12 p-5 bg-[#111111] border border-[#1f1f1f] rounded-2xl">
              <p className="text-sm font-semibold text-zinc-300 mb-2">
                🛒 Find related parts on Amazon UK
              </p>
              <a
                href={`https://www.amazon.co.uk/s?k=${encodeURIComponent(post.keywords?.join(" ") || post.category || "car parts")}&tag=gopartara-21`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#cc1111] text-sm hover:underline"
              >
                Search Amazon UK for {post.category || "car"} parts →
              </a>
            </div>

            {/* Contextual GOPARTARA CTA */}
            {(() => {
              const topic = (post.keywords && post.keywords[0]) || post.category || "car parts";
              const topicLabel = topic.toLowerCase();
              const searchHref = `/search?q=${encodeURIComponent(topicLabel)}`;
              return (
                <div
                  className="mt-8"
                  style={{
                    background: "rgba(204,17,17,0.05)",
                    border: "1px solid rgba(204,17,17,0.15)",
                    borderRadius: 12,
                    padding: "20px 24px",
                  }}
                >
                  <div className="flex items-start gap-3">
                    <span style={{ fontSize: 22, lineHeight: 1 }}>🔍</span>
                    <div className="flex-1">
                      <p className="text-sm text-zinc-300 mb-2">
                        Ready to find the best price? Compare {topicLabel} on GOPARTARA across 7 trusted suppliers.
                      </p>
                      <Link
                        to={searchHref}
                        style={{ color: "#cc1111", fontWeight: 600, fontSize: 15 }}
                        className="hover:underline"
                      >
                        Compare prices now →
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Was this helpful? */}
            <div className="mt-12 pt-8 border-t border-[#1f1f1f]">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-zinc-400">Was this helpful?</span>
                  <button
                    onClick={() => handleFeedback("up")}
                    aria-label="Helpful"
                    className={`inline-flex items-center justify-center w-9 h-9 rounded-lg border transition-colors ${
                      feedback === "up"
                        ? "border-[#cc1111] bg-[#cc1111]/10 text-[#cc1111]"
                        : "border-[#27272a] bg-[#111111] text-zinc-500 hover:text-white hover:border-[#3f3f46]"
                    }`}
                  >
                    <ThumbsUp size={15} />
                  </button>
                  <button
                    onClick={() => handleFeedback("down")}
                    aria-label="Not helpful"
                    className={`inline-flex items-center justify-center w-9 h-9 rounded-lg border transition-colors ${
                      feedback === "down"
                        ? "border-[#cc1111] bg-[#cc1111]/10 text-[#cc1111]"
                        : "border-[#27272a] bg-[#111111] text-zinc-500 hover:text-white hover:border-[#3f3f46]"
                    }`}
                  >
                    <ThumbsDown size={15} />
                  </button>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-zinc-400 mr-1">Share this article:</span>
                  <a
                    href={`https://x.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent("https://gopartara.com/blog/" + post.slug)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="share-pill"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                    Share on X
                  </a>
                  <button
                    onClick={copyLink}
                    className="share-pill"
                  >
                    {copied ? (
                      <>
                        <Check size={13} /> Copied!
                      </>
                    ) : (
                      <>
                        <LinkIcon size={13} /> Copy link
                      </>
                    )}
                  </button>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(post.title + " https://gopartara.com/blog/" + post.slug)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="share-pill"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                      <path d="M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 0 1 8.413 3.488 11.824 11.824 0 0 1 3.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 0 1-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 0 0 1.51 5.26l.46.722-1.034 3.776 3.553-.957zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z" />
                    </svg>
                    Share on WhatsApp
                  </a>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="mt-10 rounded-2xl border border-[#cc1111]/20 bg-gradient-to-br from-[#cc1111]/[0.08] to-transparent p-6 sm:p-8">
              <h3 className="text-xl font-bold text-white mb-2">Find car parts on GOPARTARA</h3>
              <p className="text-sm text-zinc-400 mb-5">
                Compare prices from multiple suppliers and find the best deals on car parts.
              </p>
              <button
                onClick={() => navigate("/search")}
                className="inline-flex items-center gap-2 bg-[#cc1111] hover:bg-[#b30e0e] text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors"
              >
                Search Parts <ArrowRight size={14} />
              </button>
            </div>

            {/* Related */}
            {related.length > 0 && (
              <div className="mt-16 pt-12 border-t border-[#1f1f1f]">
                <h2 className="text-2xl font-bold text-white mb-6 tracking-tight">
                  More from the GOPARTARA Blog
                </h2>
                <div className="grid sm:grid-cols-3 gap-5">
                  {related.map((r) => (
                    <Link
                      key={r.id}
                      to={`/blog/${r.slug}`}
                      className="group block rounded-xl border border-[#1f1f1f] bg-[#0f0f0f] hover:border-[#27272a] p-5 transition-colors"
                    >
                      {r.category && (
                        <span className="inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#cc1111] text-white">
                          {r.category}
                        </span>
                      )}
                      <h3 className="font-bold text-[15px] text-white mt-3 mb-2 line-clamp-2 leading-snug group-hover:text-[#cc1111] transition-colors">
                        {r.title}
                      </h3>
                      <p className="text-[13px] text-zinc-500 line-clamp-2 leading-relaxed">{r.preview}</p>
                      <div className="mt-3 text-[12px] text-[#52525b]">
                        {new Date(r.published_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        {r.read_time && <> · {r.read_time}</>}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </article>

          {/* Right TOC sidebar (xl+) */}
          <aside className="hidden xl:block">
            {toc.length > 0 && (
              <div className="sticky top-20">
                <div className="text-[11px] uppercase tracking-[0.08em] text-zinc-400 font-semibold mb-4">
                  In this article
                </div>
                <nav className="space-y-2 border-l border-[#1f1f1f]">
                  {toc.map((item) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        const el = document.getElementById(item.id);
                        if (el) {
                          window.scrollTo({ top: el.offsetTop - 80, behavior: "smooth" });
                          setActiveId(item.id);
                        }
                      }}
                      className={`block text-[13px] leading-snug pl-4 -ml-px border-l transition-colors ${
                        item.level === 3 ? "pl-7" : ""
                      } ${
                        activeId === item.id
                          ? "text-[#cc1111] border-[#cc1111]"
                          : "text-[#52525b] border-transparent hover:text-zinc-300"
                      }`}
                      style={{ paddingTop: 4, paddingBottom: 4 }}
                    >
                      {item.text}
                    </a>
                  ))}
                </nav>
              </div>
            )}
          </aside>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default BlogPost;
