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
import { Calendar, ArrowRight, Loader2, Clock, Trash2, BookOpen, Send } from "lucide-react";
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

const Blog = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [subscribing, setSubscribing] = useState(false);
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
        description="Tips, guides and news for UK car owners and mechanics. How to find cheap car parts, DIY repair guides and more."
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
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen size={48} className="text-muted-foreground/30 mx-auto mb-4" />
            <h2 className="font-display text-xl font-bold mb-2">No posts yet</h2>
            <p className="text-muted-foreground text-sm">New articles are published daily. Check back soon!</p>
          </div>
        ) : (
          <div className="space-y-5">
            {posts.map((post) => (
              <div key={post.id} className="relative group">
                <Link
                  to={`/blog/${post.slug}`}
                  className="block glass rounded-2xl p-6 md:p-8 hover:border-primary/30 transition-all"
                >
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3 flex-wrap">
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
                  </div>
                  <h2 className="font-display text-xl md:text-2xl font-bold mb-3 group-hover:text-primary transition-colors">
                    {post.title}
                  </h2>
                  <p className="text-muted-foreground text-sm mb-4 line-clamp-2">{post.preview}</p>
                  <span className="text-primary text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                    Read More <ArrowRight size={14} />
                  </span>
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
