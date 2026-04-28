import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Star, Store, ExternalLink, Bookmark, BookmarkCheck, Eye,
  ChevronLeft, Loader2, Send, Bell, User, Trash2, Flag, Shield, MessageCircle
} from "lucide-react";
import MakeOfferModal from "@/components/MakeOfferModal";
import PlanBadge from "@/components/badges/PlanBadge";
import VerifiedSellerBadge from "@/components/badges/VerifiedSellerBadge";
import SafeImage from "@/components/SafeImage";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
    created_at: string;
  };
}

interface Review {
  id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  dispute_status?: string;
  reviewer_name?: string | null;
  reviewer_plan?: string | null;
}

const conditionFromTags = (tags: string[]): string | null => {
  const lower = tags.map(t => t.toLowerCase());
  if (lower.includes("new")) return "NEW";
  if (lower.includes("used")) return "USED";
  if (lower.includes("for parts")) return "FOR PARTS";
  return null;
};

const conditionColor = (c: string) => {
  switch (c) {
    case "NEW": return "bg-green-500/20 text-green-400 border-green-500/30";
    case "USED": return "bg-amber-500/20 text-amber-400 border-amber-500/30";
    case "FOR PARTS": return "bg-red-500/20 text-red-400 border-red-500/30";
    default: return "bg-muted text-muted-foreground";
  }
};

const ListingDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { plan: userPlan } = useSubscription();
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

  const [alertOpen, setAlertOpen] = useState(false);
  const [alertPrice, setAlertPrice] = useState("");
  const [alertEmail, setAlertEmail] = useState("");
  const [alertSaving, setAlertSaving] = useState(false);

  const [deleteReviewId, setDeleteReviewId] = useState<string | null>(null);
  const [adminDeleteReviewId, setAdminDeleteReviewId] = useState<string | null>(null);
  const [adminDeleteReason, setAdminDeleteReason] = useState("");
  const [disputeReviewId, setDisputeReviewId] = useState<string | null>(null);
  const [disputeReason, setDisputeReason] = useState("");
  const [moderating, setModerating] = useState(false);
  const [offerOpen, setOfferOpen] = useState(false);
  const [buyingNow, setBuyingNow] = useState(false);
  const isAdmin = userPlan === "admin";
  const isSeller = listing?.seller_profiles?.user_id === user?.id;

  const handleBuyNow = async () => {
    if (!user) {
      navigate("/auth?redirect=" + window.location.pathname);
      return;
    }
    if (!listing) return;
    setBuyingNow(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-marketplace-checkout", {
        body: {
          listingId: listing.id,
          amount: listing.price,
          partTitle: listing.title,
          sellerId: listing.seller_profiles.user_id,
          buyerId: user.id,
          buyNow: true,
        },
      });
      if (error) throw error;
      if (!data?.url) throw new Error("No checkout URL returned");
      window.location.href = data.url;
    } catch (err) {
      console.error(err);
      toast({ title: "Could not start checkout", description: "Please try again.", variant: "destructive" });
      setBuyingNow(false);
    }
  };

  useEffect(() => {
    if (id) loadListing();
  }, [id, user]);

  // userPlan now comes from SubscriptionContext (no extra DB query)

  const loadListing = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("seller_listings")
        .select("*, seller_profiles!inner(id, user_id, business_name, description, logo_url, contact_email, seller_tier, website_url, created_at)")
        .eq("id", id!)
        .single();

      if (data) {
        setListing(data as unknown as ListingFull);
        try {
          await supabase.rpc("increment_listing_view", { p_listing_id: id!, p_viewer_id: user?.id || null });
        } catch {}

        const { data: revs } = await supabase
          .from("listing_reviews").select("*").eq("listing_id", id!).order("created_at", { ascending: false });

        const enrichedReviews: Review[] = [];
        if (revs) {
          const userIds = [...new Set(revs.map((r: any) => r.user_id))];
          const { data: profiles } = await supabase
            .from("profiles").select("user_id, display_name, subscription_plan").in("user_id", userIds);
          const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));
          for (const r of revs) {
            const prof = profileMap.get(r.user_id);
            enrichedReviews.push({ ...r, reviewer_name: prof?.display_name || null, reviewer_plan: prof?.subscription_plan || null });
          }
        }
        setReviews(enrichedReviews);

        if (user) {
          const existing = (revs as Review[])?.find(r => r.user_id === user.id);
          if (existing) setUserReview(existing);
          const { data: saveData } = await supabase
            .from("listing_saves").select("id").eq("listing_id", id!).eq("user_id", user.id).maybeSingle();
          setSaved(!!saveData);
        }
      }
    } catch (err) {
      console.error("Failed to load listing:", err);
    }
    setLoading(false);
  };

  const handleSave = useCallback(async () => {
    if (!user) { navigate("/auth"); return; }
    try {
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
        supabase.functions.invoke("notify-seller", { body: { listing_id: id!, action: "save" } }).catch(() => {});
      }
    } catch { toast({ title: "Something went wrong", variant: "destructive" }); }
  }, [user, saved, id, listing]);

  const handleSetAlert = async () => {
    if (!user) { navigate("/auth"); return; }
    const price = parseFloat(alertPrice);
    if (isNaN(price) || price <= 0) { toast({ title: "Enter a valid target price", variant: "destructive" }); return; }
    if (!alertEmail.includes("@")) { toast({ title: "Enter a valid email", variant: "destructive" }); return; }
    setAlertSaving(true);
    try {
      const { error } = await supabase.from("price_alerts").insert({
        user_id: user.id, part_name: listing?.title || "", supplier: listing?.seller_profiles?.business_name || "",
        target_price: price, email: alertEmail.trim(), url: listing?.external_link || null,
      });
      if (error) throw error;
      toast({ title: "Price alert set!" });
      setAlertOpen(false);
      supabase.functions.invoke("notify-seller", { body: { listing_id: id!, action: "price_alert", target_price: price.toString() } }).catch(() => {});
    } catch { toast({ title: "Something went wrong", variant: "destructive" }); }
    setAlertSaving(false);
  };

  const handleSubmitReview = async () => {
    if (!user) { navigate("/auth"); return; }
    if (userReview) { toast({ title: "Already reviewed", variant: "destructive" }); return; }
    setSubmittingReview(true);
    try {
      const { error } = await supabase.from("listing_reviews").insert({
        listing_id: id!, user_id: user.id, rating: reviewRating, comment: reviewComment || null,
      } as any);
      if (error) throw error;
      toast({ title: "Review submitted!" });
      setReviewComment("");
      supabase.functions.invoke("notify-seller", { body: { listing_id: id!, action: "review", rating: reviewRating, review_text: reviewComment || null } }).catch(() => {});
      await loadListing();
    } catch { toast({ title: "Something went wrong", variant: "destructive" }); }
    setSubmittingReview(false);
  };

  const handleDeleteOwnReview = async () => {
    if (!deleteReviewId) return;
    setModerating(true);
    try {
      await supabase.from("listing_reviews").delete().eq("id", deleteReviewId).eq("user_id", user!.id);
      setUserReview(null);
      setReviews(prev => prev.filter(r => r.id !== deleteReviewId));
      toast({ title: "Review deleted" });
    } catch { toast({ title: "Something went wrong", variant: "destructive" }); }
    setDeleteReviewId(null);
    setModerating(false);
  };

  const handleAdminDeleteReview = async () => {
    if (!adminDeleteReviewId || !adminDeleteReason.trim()) { toast({ title: "Please provide a reason", variant: "destructive" }); return; }
    setModerating(true);
    try {
      const review = reviews.find(r => r.id === adminDeleteReviewId);
      if (review) {
        await supabase.from("notifications").insert({
          user_id: review.user_id, type: "review_removed", title: "Your review was removed",
          message: `Your review on "${listing?.title}" was removed. Reason: ${adminDeleteReason.trim()}`, link: `/listing/${id}`,
        });
        const { data: reviewerProfile } = await supabase.from("profiles").select("email").eq("user_id", review.user_id).single();
        if (reviewerProfile?.email) {
          supabase.functions.invoke("send-transactional-email", {
            body: { templateName: "review-removed", recipientEmail: reviewerProfile.email, idempotencyKey: `review-removed-${adminDeleteReviewId}-${Date.now()}`, templateData: { listingTitle: listing?.title, reason: adminDeleteReason.trim() } },
          }).catch(() => {});
        }
      }
      await supabase.from("listing_reviews").delete().eq("id", adminDeleteReviewId);
      setReviews(prev => prev.filter(r => r.id !== adminDeleteReviewId));
      toast({ title: "Review removed" });
    } catch { toast({ title: "Something went wrong", variant: "destructive" }); }
    setAdminDeleteReviewId(null);
    setAdminDeleteReason("");
    setModerating(false);
  };

  const handleDisputeReview = async () => {
    if (!disputeReviewId || !disputeReason.trim()) { toast({ title: "Please explain your dispute", variant: "destructive" }); return; }
    setModerating(true);
    try {
      const review = reviews.find(r => r.id === disputeReviewId);
      await supabase.from("listing_reviews").update({ dispute_status: "pending", dispute_reason: disputeReason.trim(), dispute_date: new Date().toISOString() } as any).eq("id", disputeReviewId);
      await supabase.from("listing_disputes" as any).insert({
        listing_id: listing?.id, review_id: disputeReviewId, seller_id: user?.id,
        listing_title: listing?.title || "", review_text: review?.comment || "", seller_message: disputeReason.trim(), status: "pending",
      } as any);

      const ADMIN_UUID = "95e19b6b-32ec-4af8-8184-d02638ac2ded";
      await supabase.from("notifications").insert({
        user_id: ADMIN_UUID, type: "review_dispute", title: "Review dispute filed ⚠️",
        message: `${listing?.seller_profiles?.business_name} disputed a review on "${listing?.title}"`, link: "/admin",
      });

      supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "review-dispute", recipientEmail: "info@gopartara.com",
          idempotencyKey: `review-dispute-${disputeReviewId}-${Date.now()}`,
          templateData: { listingTitle: listing?.title, reviewerName: review?.reviewer_name || "Anonymous", reviewText: review?.comment || "", rating: review?.rating, disputeReason: disputeReason.trim(), sellerName: listing?.seller_profiles?.business_name },
        },
      }).catch(() => {});
      toast({ title: "Dispute submitted", description: "Our team will review this shortly." });
      await loadListing();
    } catch { toast({ title: "Something went wrong", variant: "destructive" }); }
    setDisputeReviewId(null);
    setDisputeReason("");
    setModerating(false);
  };

  const handleMessageSeller = useCallback(async () => {
    if (!user || !listing) { navigate("/auth"); return; }
    try {
      const sellerUserId = listing.seller_profiles.user_id;
      const { data: existing } = await supabase.from("conversations").select("id")
        .eq("listing_id", listing.id).eq("buyer_id", user.id).eq("seller_id", sellerUserId).maybeSingle();
      if (existing) { navigate(`/messages?conv=${existing.id}`); return; }
      const { data: newConv } = await supabase.from("conversations")
        .insert({ listing_id: listing.id, buyer_id: user.id, seller_id: sellerUserId }).select("id").single();
      if (newConv) navigate(`/messages?conv=${newConv.id}`);
    } catch { toast({ title: "Something went wrong", variant: "destructive" }); }
  }, [user, listing]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-24 flex justify-center"><Loader2 className="animate-spin text-primary" size={32} /></div>
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

  const condition = conditionFromTags(listing.tags);

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      <SEOHead
        title={`${listing.title} | GOPARTARA Marketplace`}
        description={listing.description.slice(0, 155)}
        path={`/listing/${listing.id}`}
      />
      <Navbar />

      <div className="container max-w-6xl py-20 px-4">
        <Button variant="ghost" onClick={() => navigate("/marketplace")} className="mb-6 gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft size={16} /> Back to Marketplace
        </Button>

        {/* Main 2-column layout */}
        <div className="grid lg:grid-cols-5 gap-8">
          {/* LEFT — Images (60%) */}
          <div className="lg:col-span-3">
            {listing.photos.length > 0 ? (
              <>
                <div className="rounded-2xl overflow-hidden border border-border bg-card group">
                  <SafeImage
                    src={listing.photos[selectedPhoto]}
                    alt={listing.title}
                    className="w-full h-72 sm:h-96 object-cover transition-transform duration-300 @media(hover:hover){group-hover:scale-[1.02]}"
                    loading="lazy"
                  />
                </div>
                {listing.photos.length > 1 && (
                  <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                    {listing.photos.slice(0, 5).map((url, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedPhoto(i)}
                        className={`w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 shrink-0 transition-colors ${
                          i === selectedPhoto ? "border-primary ring-1 ring-primary/30" : "border-border hover:border-muted-foreground"
                        }`}
                      >
                        <SafeImage src={url} alt="" className="w-full h-full object-cover" loading="lazy" />
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-72 sm:h-96 rounded-2xl bg-card flex items-center justify-center border border-border">
                <Store size={48} className="text-muted-foreground" />
              </div>
            )}
          </div>

          {/* RIGHT — Details (40%) */}
          <div className="lg:col-span-2 space-y-5">
            {/* Condition badge */}
            {condition && (
              <Badge className={`${conditionColor(condition)} border text-xs font-semibold px-3 py-1`}>
                {condition}
              </Badge>
            )}

            <h1 className="font-display text-2xl font-bold text-foreground">{listing.title}</h1>

            {listing.price && (
              <p className="text-4xl font-black text-foreground">
                £{listing.price.toFixed(2)}
              </p>
            )}

            {/* Rating */}
            {avgRating && (
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star key={s} size={16} className={s <= Math.round(parseFloat(avgRating)) ? "text-primary fill-primary" : "text-muted-foreground"} />
                  ))}
                </div>
                <span className="text-sm font-medium">{avgRating}</span>
                <span className="text-xs text-muted-foreground">({reviews.length})</span>
              </div>
            )}

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><Eye size={14} /> {listing.view_count}</span>
              <span className="flex items-center gap-1"><Bookmark size={14} /> {listing.save_count}</span>
            </div>

            <div className="border-t border-border" />

            {/* Primary actions */}
            <div className="space-y-2.5">
              {!isSeller && listing.price && (
                <>
                  <button
                    onClick={handleBuyNow}
                    disabled={buyingNow}
                    style={{
                      background: buyingNow ? '#666' : '#cc1111',
                      color: 'white',
                      padding: '16px',
                      borderRadius: '10px',
                      fontSize: '16px',
                      fontWeight: 700,
                      border: 'none',
                      cursor: buyingNow ? 'not-allowed' : 'pointer',
                      width: '100%',
                    }}
                  >
                    {buyingNow ? 'Redirecting to checkout...' : `Buy Now — £${listing.price.toFixed(2)}`}
                  </button>
                  <p style={{
                    fontSize: '12px',
                    color: '#52525b',
                    textAlign: 'center',
                    marginTop: '-4px',
                    marginBottom: '4px',
                  }}>
                    🔒 Instant purchase · Secured by Stripe
                  </p>
                </>
              )}
              {!isSeller && (
                <Button
                  onClick={() => { if (!user) { navigate("/auth"); return; } setOfferOpen(true); }}
                  variant="secondary"
                  className="w-full rounded-xl gap-2 h-12 text-base font-semibold"
                >
                  🤝 Make an Offer
                </Button>
              )}
              {!isSeller && (
                <Button variant="ghost" onClick={handleMessageSeller} className="w-full rounded-xl gap-2 h-11 border border-border">
                  <MessageCircle size={16} /> Message Seller
                </Button>
              )}
              {listing.external_link && (
                <Button asChild variant="outline" className="w-full rounded-xl gap-2 h-11">
                  <a href={listing.external_link} target="_blank" rel="noopener noreferrer">
                    <ExternalLink size={16} /> Buy Now (External)
                  </a>
                </Button>
              )}

              <div className="flex gap-2">
                <Button variant="outline" onClick={handleSave} className="flex-1 rounded-xl gap-2 h-10">
                  {saved ? <BookmarkCheck size={16} className="text-primary" /> : <Bookmark size={16} />}
                  {saved ? "Saved" : "Save"}
                </Button>
                <Button variant="outline" onClick={() => {
                  if (!user) { navigate("/auth"); return; }
                  setAlertEmail(user.email || "");
                  setAlertPrice(listing.price ? (listing.price * 0.9).toFixed(2) : "");
                  setAlertOpen(true);
                }} className="flex-1 rounded-xl gap-2 h-10">
                  <Bell size={16} /> Price Alert
                </Button>
              </div>
            </div>

            <div className="border-t border-border" />

            {/* Compatible vehicles */}
            {listing.compatible_vehicles.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-2 text-muted-foreground">Compatible with</h3>
                <div className="flex flex-wrap gap-1.5">
                  {listing.compatible_vehicles.map(v => <Badge key={v} variant="outline" className="text-xs">{v}</Badge>)}
                </div>
              </div>
            )}

            {listing.compatible_vehicles.length > 0 && <div className="border-t border-border" />}

            {/* Seller card */}
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-3">
                {listing.seller_profiles.logo_url ? (
                  <SafeImage src={listing.seller_profiles.logo_url} alt="" className="w-11 h-11 rounded-xl object-cover" />
                ) : (
                  <div className="w-11 h-11 rounded-xl bg-secondary flex items-center justify-center">
                    <Store size={18} className="text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <button
                    onClick={() => navigate(`/seller/${listing.seller_profiles.id}`)}
                    className="font-display font-bold text-sm hover:text-primary transition-colors flex items-center gap-1.5"
                  >
                    {listing.seller_profiles.business_name}
                    {listing.seller_profiles.seller_tier === "pro" && <VerifiedSellerBadge variant="pro_seller" size="sm" />}
                  </button>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <PlanBadge plan={listing.seller_profiles.seller_tier + "_seller"} size="sm" />
                    <span className="text-xs text-muted-foreground">
                      · {new Date(listing.seller_profiles.created_at).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => navigate(`/seller/${listing.seller_profiles.id}`)}
                className="text-xs text-primary hover:underline mt-3 block"
              >
                View Shop →
              </button>
            </div>

            {/* Safety notice */}
            <div className="rounded-xl bg-muted/50 p-3 flex items-start gap-2">
              <Shield size={14} className="text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                Always complete transactions safely. Agree price via messages before payment.
              </p>
            </div>

            {/* Report */}
            <button
              onClick={() => navigate("/contact", { state: { subject: "Report Listing", message: `I'd like to report listing: "${listing.title}" (ID: ${listing.id})` } })}
              className="text-xs text-muted-foreground hover:text-destructive transition-colors inline-flex items-center gap-1"
            >
              <Flag size={12} /> Report this listing
            </button>
          </div>
        </div>

        {/* Tabs below both columns */}
        <div className="mt-12">
          <Tabs defaultValue="description">
            <TabsList className="bg-card border border-border rounded-xl">
              <TabsTrigger value="description" className="rounded-lg">Description</TabsTrigger>
              {listing.compatible_vehicles.length > 0 && (
                <TabsTrigger value="vehicles" className="rounded-lg">Compatible Vehicles</TabsTrigger>
              )}
              <TabsTrigger value="reviews" className="rounded-lg">
                Reviews {reviews.length > 0 && `(${reviews.length})`}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="description" className="mt-6">
              <div className="glass rounded-xl p-6">
                <p className="text-secondary-foreground whitespace-pre-line leading-relaxed">{listing.description}</p>
                {listing.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {listing.tags.map(t => <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>)}
                  </div>
                )}
              </div>
            </TabsContent>

            {listing.compatible_vehicles.length > 0 && (
              <TabsContent value="vehicles" className="mt-6">
                <div className="glass rounded-xl p-6">
                  <div className="flex flex-wrap gap-2">
                    {listing.compatible_vehicles.map(v => (
                      <Badge key={v} variant="outline" className="px-3 py-1.5">{v}</Badge>
                    ))}
                  </div>
                </div>
              </TabsContent>
            )}

            <TabsContent value="reviews" className="mt-6">
              {/* Write review */}
              {user && !userReview && listing.seller_profiles.user_id !== user.id && (
                <div className="glass rounded-xl p-5 mb-6">
                  <h3 className="text-sm font-medium mb-3">Leave a Review</h3>
                  <div className="flex items-center gap-1 mb-3">
                    {[1, 2, 3, 4, 5].map(s => (
                      <button key={s} onClick={() => setReviewRating(s)} className="p-0.5">
                        <Star size={22} className={s <= reviewRating ? "text-primary fill-primary" : "text-muted-foreground"} />
                      </button>
                    ))}
                  </div>
                  <Textarea
                    value={reviewComment}
                    onChange={e => setReviewComment(e.target.value)}
                    placeholder="Share your experience..."
                    className="bg-secondary border-border rounded-xl mb-3 min-h-[60px] text-base"
                    maxLength={1000}
                  />
                  <Button size="sm" onClick={handleSubmitReview} disabled={submittingReview} className="rounded-xl gap-1.5 h-10">
                    {submittingReview ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    Submit Review
                  </Button>
                </div>
              )}

              {reviews.length === 0 ? (
                <p className="text-muted-foreground text-sm">No reviews yet. Be the first!</p>
              ) : (
                <div className="space-y-3">
                  {reviews.map(r => (
                    <div key={r.id} className="glass rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center shrink-0">
                          <User size={13} className="text-muted-foreground" />
                        </div>
                        <span className="text-sm font-medium">{r.reviewer_name || "Anonymous"}</span>
                        {r.reviewer_plan && r.reviewer_plan !== "free" && <PlanBadge plan={r.reviewer_plan} size="sm" />}
                        {r.dispute_status === "pending" && (
                          <Badge variant="outline" className="text-xs text-yellow-500 border-yellow-500/30">Disputed</Badge>
                        )}
                        <div className="flex ml-1">
                          {[1, 2, 3, 4, 5].map(s => (
                            <Star key={s} size={14} className={s <= r.rating ? "text-primary fill-primary" : "text-muted-foreground"} />
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground ml-auto">{new Date(r.created_at).toLocaleDateString()}</span>
                        <div className="flex items-center gap-1">
                          {user && r.user_id === user.id && (
                            <button onClick={() => setDeleteReviewId(r.id)} className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors" title="Delete your review">
                              <Trash2 size={14} />
                            </button>
                          )}
                          {isAdmin && r.user_id !== user?.id && (
                            <button onClick={() => setAdminDeleteReviewId(r.id)} className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors" title="Remove review (Admin)">
                              <Trash2 size={14} />
                            </button>
                          )}
                          {isSeller && r.user_id !== user?.id && r.dispute_status !== "pending" && r.dispute_status !== "kept" && (
                            <button onClick={() => setDisputeReviewId(r.id)} className="p-1 rounded hover:bg-yellow-500/10 text-muted-foreground hover:text-yellow-500 transition-colors" title="Dispute this review">
                              <Flag size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                      {r.comment && <p className="text-sm text-secondary-foreground">{r.comment}</p>}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Price Alert Dialog */}
      <Dialog open={alertOpen} onOpenChange={setAlertOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2"><Bell size={18} className="text-primary" /> Set Price Alert</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">Part</label>
              <Input value={listing?.title || ""} disabled className="bg-secondary/50 border-border rounded-xl opacity-70" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">Target Price (£)</label>
              <Input type="number" step="0.01" min="0.01" value={alertPrice} onChange={e => setAlertPrice(e.target.value)} placeholder="e.g. 25.00" className="bg-secondary border-border rounded-xl text-base" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">Email for notification</label>
              <Input type="email" value={alertEmail} onChange={e => setAlertEmail(e.target.value)} placeholder="your@email.com" className="bg-secondary border-border rounded-xl text-base" />
            </div>
            <Button onClick={handleSetAlert} disabled={alertSaving} className="w-full rounded-xl gap-2 h-11">
              {alertSaving ? <Loader2 size={16} className="animate-spin" /> : <Bell size={16} />} Set Alert
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete own review */}
      <AlertDialog open={!!deleteReviewId} onOpenChange={(o) => { if (!o) setDeleteReviewId(null); }}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your review?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteOwnReview} disabled={moderating} className="bg-destructive hover:bg-destructive/90">
              {moderating ? <Loader2 size={14} className="animate-spin mr-1" /> : null} Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Admin delete review */}
      <Dialog open={!!adminDeleteReviewId} onOpenChange={(o) => { if (!o) { setAdminDeleteReviewId(null); setAdminDeleteReason(""); } }}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2 text-destructive"><Trash2 size={18} /> Remove Review (Admin)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <p className="text-sm text-muted-foreground">The reviewer will be notified with your reason.</p>
            <Textarea value={adminDeleteReason} onChange={e => setAdminDeleteReason(e.target.value)} placeholder="Reason for removal..." className="bg-secondary border-border rounded-xl min-h-[80px] text-base" />
            <Button onClick={handleAdminDeleteReview} disabled={moderating || !adminDeleteReason.trim()} variant="destructive" className="w-full rounded-xl gap-2 h-11">
              {moderating ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />} Remove Review & Notify
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Seller dispute */}
      <Dialog open={!!disputeReviewId} onOpenChange={(o) => { if (!o) { setDisputeReviewId(null); setDisputeReason(""); } }}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2 text-yellow-500"><Flag size={18} /> Dispute Review</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <p className="text-sm text-muted-foreground">Explain why you think this review is unfair.</p>
            <Textarea value={disputeReason} onChange={e => setDisputeReason(e.target.value)} placeholder="Why is this review unfair?" className="bg-secondary border-border rounded-xl min-h-[80px] text-base" />
            <Button onClick={handleDisputeReview} disabled={moderating || !disputeReason.trim()} className="w-full rounded-xl gap-2 h-11 bg-yellow-500 hover:bg-yellow-600 text-black">
              {moderating ? <Loader2 size={16} className="animate-spin" /> : <Flag size={16} />} Submit Dispute
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {listing && (
        <MakeOfferModal open={offerOpen} onClose={() => setOfferOpen(false)} listingId={listing.id} listingTitle={listing.title} sellerId={listing.seller_profiles.user_id} currentPrice={listing.price} />
      )}

      <Footer />
    </div>
  );
};

export default ListingDetail;
