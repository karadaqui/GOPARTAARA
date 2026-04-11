import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import BackToTop from "@/components/BackToTop";
import { Calendar, ArrowRight, Loader2, Tag, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
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

const Blog = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    document.title = "Blog - PARTARA | Car Parts News & Tips";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Expert car parts advice, maintenance tips, and price comparison guides from PARTARA.");

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

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Blog | PARTARA"
        description="Expert advice on car parts, maintenance tips, and industry insights from the PARTARA team. Stay informed about the UK automotive parts market."
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
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg">No posts yet. Check back soon!</p>
          </div>
        ) : (
          <div className="space-y-6">
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
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                    <span>·</span>
                    <span>By {post.author}</span>
                  </div>

                  <h2 className="font-display text-xl md:text-2xl font-bold mb-3 group-hover:text-primary transition-colors">
                    {post.title}
                  </h2>

                  <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                    {post.preview}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-2">
                      {post.keywords.slice(0, 3).map((kw) => (
                        <span
                          key={kw}
                          className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary"
                        >
                          <Tag size={8} />
                          {kw}
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
      </div>

      <Footer />
      <BackToTop />

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this blog post?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. The post will be permanently removed.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Blog;
