import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import BackToTop from "@/components/BackToTop";
import { Calendar, ArrowRight, Loader2, Tag } from "lucide-react";

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

  useEffect(() => {
    document.title = "Blog - PARTARA | Car Parts News & Tips";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Expert car parts advice, maintenance tips, and price comparison guides from PARTARA.");

    fetchPosts();
  }, []);

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
          "url": "https://car-part-search.lovable.app/blog",
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
              <Link
                key={post.id}
                to={`/blog/${post.slug}`}
                className="block glass rounded-2xl p-6 md:p-8 hover:border-primary/30 transition-all group"
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
            ))}
          </div>
        )}
      </div>

      <Footer />
      <BackToTop />
    </div>
  );
};

export default Blog;
