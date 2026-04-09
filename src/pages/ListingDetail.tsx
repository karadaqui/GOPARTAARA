import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Star, Store, ExternalLink, Bookmark, BookmarkCheck, Eye, Crown,
  ChevronLeft, Loader2, Send, Bell
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";

interface ListingFull {
  id: string;
  title: string;
  description: string;
  price: number | null;
  category: string | null;
  compatible_vehicles: string[];
  tags: string[];
  photos: string[];
  external_link: string | null;
  view_count: number;
  save_count: number;
  created_at: string;
  seller_profiles: {
    id: string;
    user_id: string;
    business_name: string;
    description: string | null;
    logo_url: string | null;
    contact_email: string | null;
    seller_tier: string;
    website_url: string | null;
  };
}

interface Review {
  id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

const ListingDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [listing, setListing] = useState<ListingFull | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(0);

  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [userReview, setUserReview] = useState<Review | null>(null);

  // Price alert state
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertPrice, setAlertPrice] = useState("");
  const [alertEmail, setAlertEmail] = useState("");
  const [alertSaving, setAlertSaving] = useState(false);

  useEffect(() => {
    if (id) loadListing();
  }, [id]);

  const loadListing = async () => {
    setLoading(true);

    const { data } = await supabase
      .from("seller_listings")
      .select("*, seller_profiles!inner(id, user_id, business_name, description, logo_url, contact_email, seller_tier, website_url)")
      .eq("id", id!)
      .single();

    if (data) {
      setListing(data as unknown as ListingFull);

      await supabase.rpc("increment_listing_view", {
        p_listing_id: id!,
        p_viewer_id: user?.id || null,
      });

      const { data: revs } = await supabase
        .from("listing_reviews")
        .select("*")
        .eq("listing_id", id!)
        .order("created_at", { ascending: false });
      setReviews((revs as Review[]) || []);

      if (user) {
        const existing = (revs as Review[])?.find(r => r.user_id === user.id);
        if (existing) setUserReview(existing);

        const { data: saveData } = await supabase
          .from("listing_saves")
          .select("id")
          .eq("listing_id", id!)
          .eq("user_id", user.id)
          .maybeSingle();
        setSaved(!!saveData);
      }
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!user) { navigate("/auth"); return; }
    if (saved) {
      await supabase.from("listing_saves").delete().eq("listing_id", id!).eq("user_id", user.id);
      await supabase.from("seller_listings").update({ save_count: Math.max(0, (listing?.save_count || 1) - 1) } as any).eq("id", id!);
      setSaved(false);
      toast({ title: "Removed from saved" });
    } else {
      await supabase.from("listing_saves").insert({ listing_id: id!, user_id: user.id } as any);
      await supabase.from("seller_listings").update({ save_count: (listing?.save_count || 0) + 1 } as any).eq("id", id!);
      setSaved(true);
      toast({ title: "Part saved!" });
    }
  };

  const handleSetAlert = async () => {
    if (!user) { navigate("/auth"); return; }
    const price = parseFloat(alertPrice);
    if (isNaN(price) || price <= 0) {
      toast({ title: "Enter a valid target price", variant: "destructive" });
      return;
    }
    if (!alertEmail.includes("@")) {
      toast({ title: "Enter a valid email", variant: "destructive" });
      return;
    }
    setAlertSaving(true);
    const { error } = await supabase.from("price_alerts").insert({
      user_id: user.id,
      part_name: listing?.title || "",
      supplier: listing?.seller_profiles?.business_name || "",
      target_price: price,
      email: alertEmail.trim(),
      url: listing?.external_link || null,
    });
    setAlertSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Price alert set!" });
      setAlertOpen(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!user) { navigate("/auth"); return; }
    if (userReview) {
      toast({ title: "Already reviewed", description: "You can only leave one review per listing.", variant: "destructive" });
      return;
    }
    setSubmittingReview(true);
    const { error } = await supabase.from("listing_reviews").insert({
      listing_id: id!,
      user_id: user.id,
      rating: reviewRating,
      comment: reviewComment || null,
    } as any);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Review submitted!" });
      setReviewComment("");
      await loadListing();
    }
    setSubmittingReview(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-24 flex justify-center">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-24 text-center">
          <h1 className="font-display text-2xl font-bold mb-4">Listing not found</h1>
          <Button onClick={() => navigate("/marketplace")} className="rounded-xl">Back to Marketplace</Button>
        </div>
        <Footer />
      </div>
    );
  }

  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-5xl py-20 px-4">
        <Button variant="ghost" onClick={() => navigate("/marketplace")} className="mb-4 gap-1.5 text-muted-foreground">
          <ChevronLeft size={16} /> Back to Marketplace
        </Button>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Photos */}
          <div>
            {listing.photos.length > 0 ? (
              <>
                <div className="rounded-2xl overflow-hidden border border-border mb-3">
                  <img src={listing.photos[selectedPhoto]} alt={listing.title} className="w-full h-80 object-cover" />
                </div>
                {listing.photos.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto">
                    {listing.photos.map((url, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedPhoto(i)}
                        className={`w-16 h-16 rounded-lg overflow-hidden border-2 shrink-0 ${
                          i === selectedPhoto ? "border-primary" : "border-border"
                        }`}
                      >
                        <img src={url} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-80 rounded-2xl bg-secondary flex items-center justify-center border border-border">
                <Store size={48} className="text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Details */}
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold mb-3">{listing.title}</h1>

            {listing.price && (
              <p className="text-3xl font-bold text-primary mb-4">£{listing.price.toFixed(2)}</p>
            )}

            <div className="flex flex-wrap items-center gap-2 mb-4">
              {listing.category && <Badge variant="outline">{listing.category}</Badge>}
              {listing.tags.map(t => <Badge key={t} variant="secondary">{t}</Badge>)}
            </div>

            {avgRating && (
              <div className="flex items-center gap-2 mb-4">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star key={s} size={16} className={s <= Math.round(parseFloat(avgRating)) ? "text-primary fill-primary" : "text-muted-foreground"} />
                  ))}
                </div>
                <span className="text-sm font-medium">{avgRating}</span>
                <span className="text-xs text-muted-foreground">({reviews.length} reviews)</span>
              </div>
            )}

            <div className="flex items-center gap-3 mb-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><Eye size={14} /> {listing.view_count} views</span>
              <span className="flex items-center gap-1"><Bookmark size={14} /> {listing.save_count} saves</span>
            </div>

            <p className="text-secondary-foreground mb-6 whitespace-pre-line">{listing.description}</p>

            {listing.compatible_vehicles.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium mb-2">Compatible Vehicles</h3>
                <div className="flex flex-wrap gap-1.5">
                  {listing.compatible_vehicles.map(v => <Badge key={v} variant="outline" className="text-xs">{v}</Badge>)}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3 mb-6">
              {listing.external_link && (
                <Button asChild className="rounded-xl gap-2 flex-1">
                  <a href={listing.external_link} target="_blank" rel="noopener noreferrer">
                    <ExternalLink size={16} /> Buy Now
                  </a>
                </Button>
              )}
              <Button variant="outline" onClick={handleSave} className="rounded-xl gap-2">
                {saved ? <BookmarkCheck size={16} className="text-primary" /> : <Bookmark size={16} />}
                {saved ? "Saved" : "Save Part"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  if (!user) { navigate("/auth"); return; }
                  setAlertEmail(user.email || "");
                  setAlertPrice(listing.price ? (listing.price * 0.9).toFixed(2) : "");
                  setAlertOpen(true);
                }}
                className="rounded-xl gap-2"
              >
                <Bell size={16} /> Set Price Alert
              </Button>
            </div>

            {/* Seller info */}
            <div className="glass rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                {listing.seller_profiles.logo_url ? (
                  <img src={listing.seller_profiles.logo_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center"><Store size={18} className="text-muted-foreground" /></div>
                )}
                <div>
                  <button
                    onClick={() => navigate(`/seller/${listing.seller_profiles.id}`)}
                    className="font-display font-bold text-sm hover:text-primary transition-colors flex items-center gap-1.5"
                  >
                    {listing.seller_profiles.business_name}
                    {listing.seller_profiles.seller_tier === "pro" && <Crown size={14} className="text-primary" />}
                    {listing.seller_profiles.seller_tier === "featured" && <Star size={14} className="text-primary" />}
                  </button>
                  <p className="text-xs text-muted-foreground capitalize">{listing.seller_profiles.seller_tier} Seller</p>
                </div>
              </div>
              {listing.seller_profiles.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">{listing.seller_profiles.description}</p>
              )}
            </div>
          </div>
        </div>

        {/* Reviews section */}
        <div className="mt-12">
          <h2 className="font-display text-xl font-bold mb-6">Reviews</h2>

          {user && !userReview && listing.seller_profiles.user_id !== user.id && (
            <div className="glass rounded-xl p-4 mb-6">
              <h3 className="text-sm font-medium mb-3">Leave a Review</h3>
              <div className="flex items-center gap-1 mb-3">
                {[1, 2, 3, 4, 5].map(s => (
                  <button key={s} onClick={() => setReviewRating(s)}>
                    <Star size={20} className={s <= reviewRating ? "text-primary fill-primary" : "text-muted-foreground"} />
                  </button>
                ))}
              </div>
              <Textarea
                value={reviewComment}
                onChange={e => setReviewComment(e.target.value)}
                placeholder="Share your experience..."
                className="bg-secondary border-border rounded-xl mb-3 min-h-[60px]"
              />
              <Button size="sm" onClick={handleSubmitReview} disabled={submittingReview} className="rounded-xl gap-1.5">
                {submittingReview ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                Submit Review
              </Button>
            </div>
          )}

          {reviews.length === 0 ? (
            <p className="text-muted-foreground text-sm">No reviews yet. Be the first!</p>
          ) : (
            <div className="space-y-4">
              {reviews.map(r => (
                <div key={r.id} className="glass rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} size={14} className={s <= r.rating ? "text-primary fill-primary" : "text-muted-foreground"} />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {r.comment && <p className="text-sm text-secondary-foreground">{r.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Price Alert Dialog */}
      <Dialog open={alertOpen} onOpenChange={setAlertOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <Bell size={18} className="text-primary" />
              Set Price Alert
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">Part</label>
              <Input value={listing?.title || ""} disabled className="bg-secondary/50 border-border rounded-xl opacity-70" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">Target Price (£)</label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={alertPrice}
                onChange={e => setAlertPrice(e.target.value)}
                placeholder="e.g. 25.00"
                className="bg-secondary border-border rounded-xl"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">Email for notification</label>
              <Input
                type="email"
                value={alertEmail}
                onChange={e => setAlertEmail(e.target.value)}
                placeholder="your@email.com"
                className="bg-secondary border-border rounded-xl"
              />
            </div>
            <Button onClick={handleSetAlert} disabled={alertSaving} className="w-full rounded-xl gap-2">
              {alertSaving ? <Loader2 size={16} className="animate-spin" /> : <Bell size={16} />}
              Set Alert
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default ListingDetail;
