import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import BackToTop from "@/components/BackToTop";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Trash2, BookOpen, Send } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

const ADMIN_EMAIL = "info@gopartara.com";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  preview: string;
  meta_description: string;
  keywords: string[];
  category: string | null;
  read_time: string | null;
  author: string;
  published_at: string;
}

const CATS = ['All', 'Buying Guide', 'Maintenance', 'Tutorial', 'Education', 'Comparison'];

const Blog = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [subscribing, setSubscribing] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => { fetchPosts(); }, []);

  useEffect(() => {
    if (user) {
      const checkAdmin = async () => {
        if (user.email === ADMIN_EMAIL) { setIsAdmin(true); return; }
        const { data } = await supabase
          .from("profiles")
          .select("subscription_plan")
          .eq("user_id", user.id)
          .single();
        if (data?.subscription_plan === "admin") setIsAdmin(true);
      };
      checkAdmin();
    }
  }, [user]);

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from("blog_posts")
      .select("id, title, slug, preview, meta_description, keywords, category, read_time, author, published_at")
      .eq("published", true)
      .order("published_at", { ascending: false })
      .limit(50);

    if (!error && data) setPosts(data as BlogPost[]);
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("blog_posts").delete().eq("id", deleteId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setPosts((prev) => prev.filter((p) => p.id !== deleteId));
      toast({ title: "Blog post deleted" });
    }
    setDeleteId(null);
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setSubscribing(true);
    try {
      const { error } = await supabase.from("blog_subscribers" as any).insert({ email: newsletterEmail.trim().toLowerCase() } as any);
      if (error) {
        if (error.message?.includes("duplicate") || error.code === "23505") {
          toast({ title: "Already subscribed", description: "You're already on our mailing list!" });
        } else throw error;
      } else {
        toast({ title: "Subscribed!", description: "You'll receive our latest articles by email." });
        setNewsletterEmail("");
      }
    } catch {
      toast({ title: "Error", description: "Failed to subscribe. Try again.", variant: "destructive" });
    } finally {
      setSubscribing(false);
    }
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

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Car Parts Blog & Guides — GOPARTARA"
        description="Expert guides, buying tips, maintenance advice and industry insights for UK car owners and mechanics. Updated daily."
        path="/blog"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Blog",
          "name": "GOPARTARA Blog",
          "url": "https://gopartara.com/blog",
          "description": "Tips, guides and news for UK car owners and mechanics."
        }}
      />
      <Navbar />

      <div className="container max-w-6xl px-4 pb-20">
        {/* Editorial Header */}
        <div
          className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-6"
          style={{ padding: "60px 0 40px", borderBottom: "1px solid #1f1f1f" }}
        >
          <div>
            <div
              className="font-display text-white"
              style={{ fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1 }}
            >
              The GOPARTARA
            </div>
            <div
              className="font-display text-white"
              style={{
                fontSize: "clamp(56px, 7vw, 96px)",
                fontWeight: 900,
                letterSpacing: "-0.04em",
                lineHeight: 1,
                marginTop: "4px",
              }}
            >
              Blog
            </div>
          </div>
          <p style={{ fontSize: "16px", color: "#71717a", maxWidth: "280px", lineHeight: 1.5 }}>
            Expert guides, savings tips & industry insights for UK car owners.
          </p>
        </div>

        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide" style={{ paddingTop: "28px", paddingBottom: "16px" }}>
          {CATS.map((cat) => {
            const active = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className="flex-shrink-0 transition-colors"
                style={{
                  padding: "6px 16px",
                  borderRadius: "999px",
                  fontSize: "13px",
                  fontWeight: 500,
                  border: `1px solid ${active ? "#cc1111" : "#27272a"}`,
                  background: active ? "#cc1111" : "transparent",
                  color: active ? "white" : "#71717a",
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="mb-10 mt-2">
          <input
            type="text"
            placeholder={`Search ${posts.length} articles...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full outline-none focus:border-zinc-600 transition-colors"
            style={{
              background: "#111111",
              border: "1px solid #27272a",
              borderRadius: "12px",
              padding: "12px 16px",
              fontSize: "14px",
              color: "white",
            }}
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        ) : (() => {
          const filteredPosts = posts
            .filter((p) => activeCategory === 'All' || p.category === activeCategory)
            .filter(
              (p) =>
                !searchQuery ||
                p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.preview?.toLowerCase().includes(searchQuery.toLowerCase())
            );

          if (filteredPosts.length === 0) {
            return (
              <div className="text-center py-20">
                <BookOpen size={48} className="text-muted-foreground/30 mx-auto mb-4" />
                <h2 className="font-display text-xl font-bold mb-2">No posts found</h2>
                <p className="text-muted-foreground text-sm">
                  Try a different category or search term.
                </p>
              </div>
            );
          }

          const featured = filteredPosts[0];
          const rest = filteredPosts.slice(1);

          const formatDate = (d: string) =>
            new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

          const thumbFor = (cat: string | null): { emoji: string; gradient: string } => {
            switch (cat) {
              case "Buying Guide": return { emoji: "🛒", gradient: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)" };
              case "Maintenance": return { emoji: "🔧", gradient: "linear-gradient(135deg, #1a2a1a 0%, #1e3a1e 100%)" };
              case "Tutorial":    return { emoji: "📖", gradient: "linear-gradient(135deg, #2a1a1a 0%, #3a1e1e 100%)" };
              case "Education":   return { emoji: "🎓", gradient: "linear-gradient(135deg, #1a1a3a 0%, #1e1e4a 100%)" };
              case "Comparison":  return { emoji: "⚖️", gradient: "linear-gradient(135deg, #2a2a1a 0%, #3a3a1e 100%)" };
              default:            return { emoji: "🚗", gradient: "linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)" };
            }
          };

          return (
            <>
              {/* Featured post — hero card */}
              <div className="relative group mb-10">
                <Link
                  to={`/blog/${featured.slug}`}
                  className="block transition-colors"
                  style={{
                    background: "linear-gradient(135deg, #1a0000 0%, #111111 100%)",
                    border: "1px solid #1f1f1f",
                    borderRadius: "16px",
                    padding: "40px",
                  }}
                >
                  <div className="flex items-center gap-3 mb-4 flex-wrap">
                    {featured.category && (
                      <span
                        style={{
                          background: "#cc1111",
                          color: "white",
                          fontSize: "11px",
                          fontWeight: 600,
                          padding: "4px 10px",
                          borderRadius: "999px",
                          letterSpacing: "0.04em",
                          textTransform: "uppercase",
                        }}
                      >
                        {featured.category}
                      </span>
                    )}
                    <span style={{ color: "#71717a", fontSize: "13px" }}>
                      {formatDate(featured.published_at)}
                      {featured.read_time && <> · {featured.read_time}</>}
                      {" · By Fatma Karadayı"}
                    </span>
                  </div>
                  <h2
                    className="font-display text-white group-hover:text-primary transition-colors"
                    style={{
                      fontSize: "clamp(24px, 3.5vw, 32px)",
                      fontWeight: 800,
                      letterSpacing: "-0.02em",
                      lineHeight: 1.15,
                      marginBottom: "12px",
                    }}
                  >
                    {featured.title}
                  </h2>
                  <p
                    className="line-clamp-2 max-w-2xl"
                    style={{ color: "#71717a", fontSize: "15px", lineHeight: 1.6, marginBottom: "20px" }}
                  >
                    {featured.preview}
                  </p>
                  <span style={{ color: "#cc1111", fontSize: "14px", fontWeight: 600 }}>
                    Read article →
                  </span>
                </Link>
                {isAdmin && (
                  <button
                    onClick={(e) => { e.preventDefault(); setDeleteId(featured.id); }}
                    className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center text-destructive hover:bg-destructive/20 transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete post"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>

              {/* Grid of remaining posts — premium minimal */}
              {rest.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-0">
                  {rest.map((post) => (
                    <div key={post.id} className="relative group" style={{ borderBottom: "1px solid #1f1f1f" }}>
                      <Link
                        to={`/blog/${post.slug}`}
                        className="flex flex-col h-full"
                        style={{ padding: "24px 0" }}
                      >
                        <div className="flex items-center gap-2 mb-3">
                          {post.category && (
                            <span
                              style={{
                                background: "rgba(204,17,17,0.1)",
                                color: "#cc1111",
                                fontSize: "11px",
                                fontWeight: 600,
                                padding: "3px 10px",
                                borderRadius: "999px",
                                letterSpacing: "0.02em",
                              }}
                            >
                              {post.category}
                            </span>
                          )}
                        </div>
                        <h3
                          className="line-clamp-2 transition-colors group-hover:text-primary"
                          style={{
                            fontSize: "17px",
                            fontWeight: 700,
                            color: "white",
                            lineHeight: 1.3,
                            marginBottom: "8px",
                          }}
                        >
                          {post.title}
                        </h3>
                        <p
                          className="line-clamp-2 flex-1"
                          style={{ fontSize: "13px", color: "#71717a", lineHeight: 1.55, marginBottom: "12px" }}
                        >
                          {post.preview}
                        </p>
                        <div style={{ fontSize: "12px", color: "#52525b" }}>
                          {formatDate(post.published_at)}
                          {post.read_time && <> · {post.read_time}</>}
                          {" · By Fatma Karadayı"}
                        </div>
                      </Link>
                      {isAdmin && (
                        <button
                          onClick={(e) => { e.preventDefault(); setDeleteId(post.id); }}
                          className="absolute top-5 right-0 w-7 h-7 rounded-lg bg-destructive/10 flex items-center justify-center text-destructive hover:bg-destructive/20 transition-colors opacity-0 group-hover:opacity-100"
                          title="Delete post"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          );
        })()}

        {/* Newsletter */}
        <div className="mt-16 rounded-2xl border border-border bg-card/40 p-6 sm:p-8 text-center">
          <BookOpen size={24} className="text-primary mx-auto mb-3" />
          <h3 className="font-display text-lg font-bold mb-2">Subscribe to our newsletter</h3>
          <p className="text-sm text-muted-foreground mb-5 max-w-md mx-auto">
            Get the latest car parts guides, price tips, and GOPARTARA updates delivered to your inbox.
          </p>
          <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
            <Input
              type="email"
              placeholder="your@email.com"
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              className="bg-secondary border-border rounded-xl"
              required
            />
            <Button type="submit" disabled={subscribing} className="rounded-xl gap-1.5 shrink-0">
              <Send size={14} />
              {subscribing ? "Subscribing..." : "Subscribe"}
            </Button>
          </form>
        </div>
      </div>

      <Footer />
      <BackToTop />

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this blog post?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Blog;
