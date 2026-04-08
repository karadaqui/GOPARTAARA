import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, Send, Loader2, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Review {
  id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

interface Props {
  partQuery: string;
  supplier: string;
}

const StarRating = ({ rating, onRate, interactive = false }: { rating: number; onRate?: (r: number) => void; interactive?: boolean }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <button
        key={s}
        type="button"
        disabled={!interactive}
        onClick={() => onRate?.(s)}
        className={interactive ? "cursor-pointer hover:scale-110 transition-transform" : "cursor-default"}
      >
        <Star
          size={interactive ? 20 : 14}
          className={s <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}
        />
      </button>
    ))}
  </div>
);

const PartReviews = ({ partQuery, supplier }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [userReview, setUserReview] = useState<Review | null>(null);

  useEffect(() => {
    fetchReviews();
  }, [partQuery, supplier]);

  const fetchReviews = async () => {
    const { data } = await supabase
      .from("part_reviews")
      .select("*")
      .eq("part_query", partQuery)
      .eq("supplier", supplier)
      .order("created_at", { ascending: false })
      .limit(20);

    if (data) {
      setReviews(data);
      if (user) {
        const mine = data.find((r: Review) => r.user_id === user.id);
        setUserReview(mine || null);
      }
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!user || rating === 0) return;
    setSubmitting(true);

    const { error } = await supabase.from("part_reviews").insert({
      user_id: user.id,
      part_query: partQuery,
      supplier,
      rating,
      comment: comment.trim() || null,
    });

    if (error) {
      if (error.code === "23505") {
        toast({ title: "Already reviewed", description: "You've already reviewed this part from this supplier.", variant: "destructive" });
      } else {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
    } else {
      toast({ title: "Review submitted!", description: "Thanks for your feedback." });
      setShowForm(false);
      setRating(0);
      setComment("");
      fetchReviews();
    }
    setSubmitting(false);
  };

  const avgRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

  return (
    <div className="mt-2">
      {/* Average rating display */}
      {reviews.length > 0 && (
        <div className="flex items-center gap-2 mb-2">
          <StarRating rating={Math.round(avgRating)} />
          <span className="text-xs text-muted-foreground">
            {avgRating.toFixed(1)} ({reviews.length} review{reviews.length !== 1 ? "s" : ""})
          </span>
        </div>
      )}

      {/* Review form toggle */}
      {user && !userReview && !showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="text-xs text-primary hover:underline"
        >
          Write a review
        </button>
      )}

      {userReview && (
        <p className="text-xs text-muted-foreground">You rated this {userReview.rating}/5</p>
      )}

      {/* Review form */}
      {showForm && (
        <div className="mt-2 space-y-2 p-3 rounded-xl bg-secondary/50 border border-border">
          <StarRating rating={rating} onRate={setRating} interactive />
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Optional comment..."
            className="text-xs min-h-[60px] bg-background"
            maxLength={500}
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={rating === 0 || submitting}
              className="rounded-lg gap-1.5 text-xs h-7"
            >
              {submitting ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
              Submit
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => { setShowForm(false); setRating(0); setComment(""); }}
              className="rounded-lg text-xs h-7"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Reviews list */}
      {reviews.length > 0 && (
        <div className="mt-2 space-y-1.5 max-h-[120px] overflow-y-auto">
          {reviews.slice(0, 5).map((r) => (
            <div key={r.id} className="flex items-start gap-2 text-xs">
              <User size={10} className="text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <StarRating rating={r.rating} />
                {r.comment && <p className="text-muted-foreground mt-0.5">{r.comment}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PartReviews;
