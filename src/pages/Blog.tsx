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
import { Calendar, ArrowRight, Loader2, Tag, Trash2, Wrench, BookOpen, Send } from "lucide-react";
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
  author: string;
  published_at: string;
}

const placeholderPosts = [
  {
    id: "placeholder-1",
    title: "How to Find BMW E46 Parts Cheap in the UK — 2026 Guide",
    category: "Buying Guide",
    date: "April 10, 2026",
    readTime: "5 min read",
    excerpt: "Finding affordable BMW E46 parts doesn't have to be a nightmare. We compared prices across 10+ suppliers so you don't have to.",
  },
  {
    id: "placeholder-2",
    title: "OEM vs Aftermarket Car Parts — Which Should You Buy?",
    category: "Education",
    date: "April 8, 2026",
    readTime: "7 min read",
    excerpt: "The age-old question every DIY mechanic faces. We break down the pros, cons, and when each option makes sense for your wallet.",
  },
  {
    id: "placeholder-3",
    title: "Best Sites to Buy Car Parts Online in the UK (2026)",
    category: "Comparison",
    date: "April 5, 2026",
    readTime: "8 min read",
    excerpt: "We tested 12 different car parts websites so you don't have to. Here's our honest verdict on price, delivery, and quality.",
  },
  {
    id: "placeholder-4",
    title: "How to Use a Photo to Find Any Car Part — PARTARA Guide",
    category: "Tutorial",
    date: "April 3, 2026",
    readTime: "3 min read",
    excerpt: "Don't know what a part is called? No problem. PARTARA's photo search identifies any car part from a single photo. Here's how.",
  },
];

const Blog = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [subscribing, setSubscribing] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

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
      .select("id, title, slug, preview, meta_description, keywords, author, published_at")
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
        } else {
          throw error;
        }
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

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Blog | PARTARA"
        description="Expert advice on car parts, maintenance tips, and industry insights from the PARTARA team."
        path="/blog"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Blog",
          "name": "PARTARA Blog",
          "url": "https://gopartara.com/blog",
          "description": "Expert advice on car parts, maintenance tips, and industry insights."
        }}
      />
      <Navbar />

      <div className="container max-w-4xl py-20 px-4">
        <div className="text-center mb-12">
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
            <span className="text-primary">PART</span>ARA Blog
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Expert advice on car parts, maintenance tips, and industry insights — by our expert automotive team.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        ) : (
          <>
            {/* Real blog posts from DB */}
            {posts.length > 0 && (
              <div className="space-y-6 mb-12">
                {posts.map((post) => (
                  <div key={post.id} className="relative group">
                    <Link
                      to={`/blog/${post.slug}`}
                      className="block glass rounded-2xl p-6 md:p-8 hover:border-primary/30 transition-all"
                    >
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                        <span className="flex items-center gap-1.5">
                          <Calendar size={12} />
                          {new Date(post.published_at).toLocaleDateString("en-GB", {
                            day: "numeric", month: "long", year: "numeric",
                          })}
                        </span>
                        <span>·</span>
                        <span>By {post.author}</span>
                      </div>
                      <h2 className="font-display text-xl md:text-2xl font-bold mb-3 group-hover:text-primary transition-colors">
                        {post.title}
                      </h2>
                      <p className="text-muted-foreground text-sm mb-4 line-clamp-2">{post.preview}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap gap-2">
                          {post.keywords.slice(0, 3).map((kw) => (
                            <span key={kw} className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                              <Tag size={8} /> {kw}
                            </span>
                          ))}
                        </div>
                        <span className="text-primary text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                          Read more <ArrowRight size={14} />
                        </span>
                      </div>
                    </Link>
                    {isAdmin && (
                      <button
                        onClick={(e) => { e.preventDefault(); setDeleteId(post.id); }}
                        className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center text-destructive hover:bg-destructive/20 transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete post"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Placeholder blog cards */}
            <div className="space-y-6">
              {posts.length > 0 && (
                <h2 className="font-display text-2xl font-bold">Editor's Picks</h2>
              )}
              <div className="grid sm:grid-cols-2 gap-5">
                {placeholderPosts.map((post) => (
                  <div key={post.id} className="rounded-2xl border border-border bg-card/50 overflow-hidden hover:border-primary/30 transition-all group">
                    <div className="h-36 bg-secondary/50 flex items-center justify-center">
                      <Wrench size={32} className="text-muted-foreground/20" />
                    </div>
                    <div className="p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/15 text-primary">{post.category}</span>
                        <span className="text-[10px] text-muted-foreground">{post.date}</span>
                        <span className="text-[10px] text-muted-foreground">· {post.readTime}</span>
                      </div>
                      <h3 className="font-display font-bold text-sm mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                        {post.title}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-3 mb-4">{post.excerpt}</p>
                      <span className="text-primary text-xs font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                        Read More <ArrowRight size={12} />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Newsletter */}
            <div className="mt-16 rounded-2xl border border-border bg-card/40 p-6 sm:p-8 text-center">
              <BookOpen size={24} className="text-primary mx-auto mb-3" />
              <h3 className="font-display text-lg font-bold mb-2">Subscribe to our newsletter</h3>
              <p className="text-sm text-muted-foreground mb-5 max-w-md mx-auto">
                Get the latest car parts guides, price tips, and PARTARA updates delivered to your inbox.
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
          </>
        )}
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
