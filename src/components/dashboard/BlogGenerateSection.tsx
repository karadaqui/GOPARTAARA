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

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-blog-post");

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Blog post published!",
          description: `"${data.post?.title}" is now live.`,
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
      </p>
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
          View Blog
        </Button>
      </div>
    </div>
  );
};

export default BlogGenerateSection;
