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
        description="Expert guides on buying car parts, maintenance tips, cost-saving advice and automotive industry insights. Updated regularly."
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

      <div className="container max-w-5xl px-4 pb-20">
        {/* Header */}
        <div className="text-center py-16 px-4 max-w-2xl mx-auto">
          <h1 className="font-display text-4xl font-black text-foreground mb-3">
            <span style={{ color: '#cc1111' }}>GO</span>PARTARA Blog
          </h1>
          <p className="text-muted-foreground text-sm">
            Expert guides, maintenance tips & industry insights
          </p>
        </div>

        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-4 max-w-5xl mx-auto">
          {CATS.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                activeCategory === cat
                  ? 'bg-primary border-primary text-primary-foreground'
                  : 'bg-card border-border text-muted-foreground hover:border-muted-foreground/50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="mb-8 mt-2">
          <input
            type="text"
            placeholder="Search articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-muted-foreground/50 transition-colors"
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

          return (
            <>
              {/* Featured post */}
              <div className="relative group mb-8">
                <Link
                  to={`/blog/${featured.slug}`}
                  className="block p-6 bg-card border border-border rounded-2xl hover:border-muted-foreground/40 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    {featured.category && (
                      <span className={`text-xs rounded-full px-2 py-0.5 font-semibold ${categoryColor(featured.category)}`}>
                        {featured.category}
                      </span>
                    )}
                    <span className="text-muted-foreground text-xs">
                      {formatDate(featured.published_at)}
                      {featured.read_time && <> · {featured.read_time}</>}
                    </span>
                  </div>
                  <h2 className="font-display text-2xl font-black text-foreground mb-2 group-hover:text-primary transition-colors">
                    {featured.title}
                  </h2>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-4 max-w-2xl">
                    {featured.preview}
                  </p>
                  <span className="text-primary text-sm font-semibold">Read article →</span>
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

              {/* Grid of remaining posts */}
              {rest.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {rest.map((post) => (
                    <div key={post.id} className="relative group">
                      <Link
                        to={`/blog/${post.slug}`}
                        className="flex flex-col h-full p-5 bg-card border border-border rounded-2xl hover:border-muted-foreground/40 hover:-translate-y-0.5 transition-[colors,transform]"
                      >
                        <div className="flex items-center gap-2 mb-3">
                          {post.category && (
                            <span className="text-[10px] bg-secondary border border-border text-muted-foreground rounded-full px-2 py-0.5">
                              {post.category}
                            </span>
                          )}
                          {post.read_time && (
                            <span className="text-muted-foreground text-[10px] ml-auto">{post.read_time}</span>
                          )}
                        </div>
                        <h3 className="text-foreground font-bold text-sm mb-2 leading-snug group-hover:text-primary transition-colors line-clamp-2">
                          {post.title}
                        </h3>
                        <p className="text-muted-foreground text-xs leading-relaxed flex-1 line-clamp-3 mb-3">
                          {post.preview}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground text-[10px]">{formatDate(post.published_at)}</span>
                          <span className="text-muted-foreground group-hover:text-primary text-xs transition-colors">→</span>
                        </div>
                      </Link>
                      {isAdmin && (
                        <button
                          onClick={(e) => { e.preventDefault(); setDeleteId(post.id); }}
                          className="absolute top-3 right-3 w-7 h-7 rounded-lg bg-destructive/10 flex items-center justify-center text-destructive hover:bg-destructive/20 transition-colors opacity-0 group-hover:opacity-100"
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
