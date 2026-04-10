import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Sparkles, Loader2, ExternalLink, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const DAILY_LIMIT = 2;

const BlogGenerateSection = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [generating, setGenerating] = useState(false);
  const [lastTitle, setLastTitle] = useState<string | null>(null);
  const [todayCount, setTodayCount] = useState(0);
  const [loadingCount, setLoadingCount] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchCount = async () => {
      setLoadingCount(true);
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const { count } = await supabase
        .from("blog_generations")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", startOfDay.toISOString());

      setTodayCount(count || 0);
      setLoadingCount(false);
    };
    fetchCount();
  }, [user]);

  const limitReached = todayCount >= DAILY_LIMIT;

  const handleGenerate = async () => {
    if (!user) return;
    if (limitReached) return;

    setGenerating(true);
    setLastTitle(null);
    try {
      const { data, error } = await supabase.functions.invoke("generate-blog-post");
      if (error) throw error;

      if (data?.success) {
        // Record the generation
        await supabase.from("blog_generations").insert({ user_id: user.id });
        setTodayCount((prev) => prev + 1);

        const title = data.posts?.[0]?.title || data.post?.title || "New post";
        setLastTitle(title);
        toast({
          title: "Blog post published!",
          description: `"${title}" is now live.`,
        });
      } else {
        throw new Error(data?.error || "Failed to generate post");
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to generate blog post",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="glass rounded-2xl p-8">
      <h2 className="font-display text-lg font-semibold flex items-center gap-2 mb-3">
        <Sparkles size={18} className="text-primary" />
        Blog Generator
      </h2>
      <p className="text-sm text-muted-foreground mb-4">
        Generate a new blog post about car parts, maintenance tips, or price guides.
        <span className="text-muted-foreground/70 ml-1">
          ({todayCount}/{DAILY_LIMIT} used today)
        </span>
      </p>

      {limitReached && (
        <div className="mb-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <div className="flex items-start gap-2.5">
            <AlertCircle size={16} className="text-amber-400 mt-0.5 shrink-0" />
            <p className="text-sm text-amber-200/90 leading-relaxed">
              You've reached today's blog generation limit ({DAILY_LIMIT} per day).
              This keeps our content quality high and prevents spam.
              Come back tomorrow to create more posts!
            </p>
          </div>
        </div>
      )}

      {lastTitle && (
        <div className="mb-4 p-3 rounded-xl bg-primary/10 border border-primary/20">
          <p className="text-sm font-medium text-foreground">✅ Published: "{lastTitle}"</p>
        </div>
      )}

      <div className="flex gap-2">
        <Button
          onClick={handleGenerate}
          disabled={generating || limitReached || loadingCount}
          className="rounded-xl gap-2"
          size="sm"
        >
          {generating ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Sparkles size={14} />
          )}
          {generating ? "Generating..." : limitReached ? "Limit Reached" : "Generate Today's Post"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl gap-2"
          onClick={() => navigate("/blog")}
        >
          <ExternalLink size={14} />
          See Blog
        </Button>
      </div>
    </div>
  );
};

export default BlogGenerateSection;
