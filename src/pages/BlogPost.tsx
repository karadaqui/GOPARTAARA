import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import DOMPurify from "dompurify";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { ArrowLeft, Calendar, Clock, Loader2, ArrowRight, Link as LinkIcon, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
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

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [post, setPost] = useState<BlogPostData | null>(null);
  const [related, setRelated] = useState<BlogPostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (slug) fetchPost();
  }, [slug]);

  const fetchPost = async () => {
    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("slug", slug)
      .eq("published", true)
      .single();

    if (!error && data) {
      const p = data as BlogPostData;
      setPost(p);
      // Fetch related posts (same category, exclude current)
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

  const categoryColor = (cat: string | null) => {
    switch (cat) {
      case "Buying Guide": return "bg-emerald-500/15 text-emerald-400";
      case "Maintenance": return "bg-amber-500/15 text-amber-400";
      case "Education": return "bg-blue-500/15 text-blue-400";
      case "Comparison": return "bg-purple-500/15 text-purple-400";
      case "Tutorial": return "bg-cyan-500/15 text-cyan-400";
      case "News": return "bg-rose-500/15 text-rose-400";
      default: return "bg-primary/15 text-primary";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container max-w-3xl py-20 px-4 text-center">
          <h1 className="font-display text-3xl font-bold mb-4">Post Not Found</h1>
          <p className="text-muted-foreground mb-6">This blog post doesn't exist or has been removed.</p>
          <button onClick={() => navigate("/blog")} className="text-primary font-medium hover:underline">
            ← Back to Blog
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={`${post.title} | GOPARTARA Blog`}
        description={post.meta_description || post.preview}
        path={`/blog/${post.slug}`}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          "headline": post.title,
          "description": post.meta_description,
          "author": { "@type": "Organization", "name": post.author },
          "datePublished": post.published_at,
          "publisher": { "@type": "Organization", "name": "PARTARA" },
        }}
      />
      <Navbar />

      <article className="container max-w-3xl py-20 px-4">
        <button
          onClick={() => navigate("/blog")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft size={16} />
          Back to Blog
        </button>

        <header className="mb-10">
          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4 flex-wrap">
            {post.category && (
              <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${categoryColor(post.category)}`}>
                {post.category}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Calendar size={12} />
              {new Date(post.published_at).toLocaleDateString("en-GB", {
                day: "numeric", month: "long", year: "numeric",
              })}
            </span>
            {post.read_time && (
              <>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Clock size={12} />
                  {post.read_time}
                </span>
              </>
            )}
            <span>·</span>
            <span>{post.author}</span>
          </div>

          <h1 className="font-display text-3xl md:text-4xl font-bold mb-4">
            {post.title}
          </h1>
        </header>

        <div
          className="prose prose-invert prose-sm md:prose-base max-w-none prose-headings:font-display prose-headings:text-foreground prose-p:text-muted-foreground prose-a:text-primary prose-strong:text-foreground prose-li:text-muted-foreground"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }}
        />

        {/* Amazon Affiliate Section */}
        <div className="mt-8 p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl">
          <p className="text-sm font-semibold text-zinc-300 mb-2">
            🛒 Find related parts on Amazon UK
          </p>
          <a
            href={`https://www.amazon.co.uk/s?k=${encodeURIComponent(post.keywords?.join(' ') || post.category || 'car parts')}&tag=gopartara-21`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-red-400 text-sm hover:underline"
          >
            Search Amazon UK for {post.category || 'car'} parts →
          </a>
        </div>

        {/* CTA */}
        <div className="mt-12 rounded-2xl border border-primary/20 bg-primary/5 p-6 sm:p-8 text-center">
          <h3 className="font-display text-xl font-bold mb-2">Find car parts on PARTARA</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Compare prices from multiple suppliers and find the best deals on car parts.
          </p>
          <Button onClick={() => navigate("/search")} className="rounded-xl gap-2">
            Search Parts <ArrowRight size={14} />
          </Button>
        </div>

        {/* Related posts */}
        {related.length > 0 && (
          <div className="mt-16">
            <h2 className="font-display text-2xl font-bold mb-6">Related Articles</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {related.map((r) => (
                <Link
                  key={r.id}
                  to={`/blog/${r.slug}`}
                  className="glass rounded-xl p-5 hover:border-primary/30 transition-colors group"
                >
                  {r.category && (
                    <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${categoryColor(r.category)}`}>
                      {r.category}
                    </span>
                  )}
                  <h3 className="font-display font-bold text-sm mt-2 mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                    {r.title}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">{r.preview}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </article>

      <Footer />
    </div>
  );
};

export default BlogPost;
