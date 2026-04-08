import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Loader2, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";

const BlogGenerateSection = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [generating, setGenerating] = useState(false);
  const [lastTitle, setLastTitle] = useState<string | null>(null);

  const handleGenerate = async () => {
    setGenerating(true);
    setLastTitle(null);
    try {
      const { data, error } = await supabase.functions.invoke("generate-blog-post");

      if (error) throw error;

      if (data?.success) {
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
        Generate a new blog post about car parts, maintenance tips, or price guides. Max 2 per day.
      </p>

      {lastTitle && (
        <div className="mb-4 p-3 rounded-xl bg-primary/10 border border-primary/20">
          <p className="text-sm font-medium text-foreground">✅ Published: "{lastTitle}"</p>
        </div>
      )}

      <div className="flex gap-2">
        <Button
          onClick={handleGenerate}
          disabled={generating}
          className="rounded-xl gap-2"
          size="sm"
        >
          {generating ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Sparkles size={14} />
          )}
          {generating ? "Generating..." : "Generate Today's Post"}
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
