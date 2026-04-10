import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle, XCircle, Loader2, Shield, Package, Eye, Store, Flag, Star, MessageSquare
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";

const ADMIN_EMAIL = "info@gopartara.com";

interface PendingListing {
  id: string;
  title: string;
  description: string;
  price: number | null;
  category: string | null;
  photos: string[];
  created_at: string;
  approval_status: string;
  seller_profiles: {
    id: string;
    business_name: string;
    contact_email: string | null;
    seller_tier: string;
  };
}

interface DisputedReview {
  id: string;
  listing_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  dispute_status: string;
  dispute_reason: string;
  dispute_date: string;
  listing_title?: string;
  seller_name?: string;
  seller_user_id?: string;
  reviewer_name?: string;
}

const Admin = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [listings, setListings] = useState<PendingListing[]>([]);
  const [disputes, setDisputes] = useState<DisputedReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [activeTab, setActiveTab] = useState("listings");

  // Dispute resolution state
  const [resolveId, setResolveId] = useState<string | null>(null);
  const [resolveAction, setResolveAction] = useState<"keep" | "remove" | null>(null);
  const [resolveNote, setResolveNote] = useState("");
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    if (!user) { navigate("/auth?redirect=/admin"); return; }
    const checkAccess = async () => {
      const { data: adminProfile } = await supabase
        .from("profiles")
        .select("subscription_plan")
        .eq("user_id", user.id)
        .single();
      const isAdmin = user.email === ADMIN_EMAIL || adminProfile?.subscription_plan === "admin";
      if (!isAdmin) {
        toast({ title: "Access denied", variant: "destructive" });
        navigate("/");
        return;
      }
      loadListings();
      loadDisputes();
    };
    checkAccess();
  }, [user]);

  const loadListings = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("seller_listings")
      .select("*, seller_profiles(id, business_name, contact_email, seller_tier)")
      .order("created_at", { ascending: false });
    setListings((data as unknown as PendingListing[]) || []);
    setLoading(false);
  };

  const loadDisputes = async () => {
    const { data: revs } = await supabase
      .from("listing_reviews")
      .select("*")
      .neq("dispute_status", "none")
      .order("dispute_date", { ascending: false });

    if (!revs || revs.length === 0) { setDisputes([]); return; }

    // Enrich with listing + seller + reviewer info
    const listingIds = [...new Set(revs.map((r: any) => r.listing_id))];
    const userIds = [...new Set(revs.map((r: any) => r.user_id))];

    const [{ data: listingsData }, { data: profiles }] = await Promise.all([
      supabase.from("seller_listings").select("id, title, seller_id, seller_profiles(user_id, business_name)").in("id", listingIds),
      supabase.from("profiles").select("user_id, display_name").in("user_id", userIds),
    ]);

    const listingMap = new Map((listingsData || []).map((l: any) => [l.id, l]));
    const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));

    const enriched: DisputedReview[] = revs.map((r: any) => {
      const l = listingMap.get(r.listing_id);
      const p = profileMap.get(r.user_id);
      return {
        ...r,
        listing_title: l?.title || "Unknown",
        seller_name: l?.seller_profiles?.business_name || "Unknown",
        seller_user_id: l?.seller_profiles?.user_id || null,
        reviewer_name: p?.display_name || "Anonymous",
      };
    });
    setDisputes(enriched);
  };

  const handleApprove = async (id: string) => {
    setProcessing(id);
    const listing = listings.find(l => l.id === id);
    const { error } = await supabase.from("seller_listings").update({ approval_status: "approved" } as any).eq("id", id);
    if (!error && listing?.seller_profiles?.id) {
      await supabase.from("seller_profiles").update({ approved: true } as any).eq("id", listing.seller_profiles.id);
    }
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Listing & seller approved!" });
      await loadListings();
    }
    setProcessing(null);
  };

  const handleReject = async (id: string) => {
    setProcessing(id);
    const { error } = await supabase.from("seller_listings").update({ approval_status: "rejected" } as any).eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Listing rejected" });
      await loadListings();
    }
    setProcessing(null);
  };

  const handleResolveDispute = async () => {
    if (!resolveId || !resolveAction) return;
    setResolving(true);
    const dispute = disputes.find(d => d.id === resolveId);
    if (!dispute) { setResolving(false); return; }

    const decision = resolveAction === "keep" ? "Keep" : "Remove";
    const noteText = resolveNote.trim() ? ` ${resolveNote.trim()}` : "";

    if (resolveAction === "remove") {
      // Delete the review
      await supabase.from("listing_reviews").delete().eq("id", resolveId);

      // Notify reviewer
      await supabase.from("notifications").insert({
        user_id: dispute.user_id,
        type: "review_removed",
        title: "Your review was removed",
        message: `Your review on "${dispute.listing_title}" was removed after a dispute review. Reason: ${dispute.dispute_reason}${noteText ? `. Note: ${noteText}` : ""}`,
        link: `/listing/${dispute.listing_id}`,
      });
    } else {
      // Keep - update status
      await supabase.from("listing_reviews").update({ dispute_status: "kept" } as any).eq("id", resolveId);
    }

    // Notify seller about the decision
    if (dispute.seller_user_id) {
      await supabase.from("notifications").insert({
        user_id: dispute.seller_user_id,
        type: "dispute_resolved",
        title: `Dispute decision: ${decision}`,
        message: `Your dispute for "${dispute.listing_title}" has been reviewed. Decision: ${decision}.${noteText}`,
        link: `/listing/${dispute.listing_id}`,
      });
    }

    toast({ title: `Dispute resolved: ${decision}` });
    setResolveId(null);
    setResolveAction(null);
    setResolveNote("");
    setResolving(false);
    await loadDisputes();
  };

  const filtered = listings.filter(l => filter === "all" || l.approval_status === filter);
  const pendingDisputes = disputes.filter(d => d.dispute_status === "pending");

  if (!user || user.email !== ADMIN_EMAIL) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-5xl py-20 px-4">
        <div className="flex items-center gap-3 mb-8">
          <Shield size={28} className="text-primary" />
          <h1 className="font-display text-3xl font-bold">Admin Panel</h1>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="listings" className="gap-1.5">
              <Package size={14} /> Listings
            </TabsTrigger>
            <TabsTrigger value="disputes" className="gap-1.5">
              <Flag size={14} /> Disputed Reviews
              {pendingDisputes.length > 0 && (
                <Badge variant="destructive" className="ml-1 text-[10px] px-1.5 py-0">{pendingDisputes.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="listings">
            <div className="flex gap-2 mb-6">
              {(["pending", "approved", "rejected", "all"] as const).map(f => (
                <Button
                  key={f}
                  size="sm"
                  variant={filter === f ? "default" : "outline"}
                  onClick={() => setFilter(f)}
                  className="rounded-full capitalize"
                >
                  {f}
                  {f !== "all" && (
                    <span className="ml-1.5 text-xs">
                      ({listings.filter(l => l.approval_status === f).length})
                    </span>
                  )}
                </Button>
              ))}
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="animate-spin text-primary" size={32} />
              </div>
            ) : filtered.length === 0 ? (
              <div className="glass rounded-2xl p-12 text-center">
                <Package size={48} className="text-muted-foreground mx-auto mb-4" />
                <h3 className="font-display text-lg font-bold mb-2">No {filter} listings</h3>
              </div>
            ) : (
              <div className="space-y-4">
                {filtered.map(listing => (
                  <div key={listing.id} className="glass rounded-xl p-4 flex gap-4">
                    {listing.photos[0] ? (
                      <img src={listing.photos[0]} alt="" className="w-24 h-24 rounded-lg object-cover shrink-0" />
                    ) : (
                      <div className="w-24 h-24 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                        <Package size={24} className="text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-display font-bold line-clamp-1">{listing.title}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Store size={12} className="text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {listing.seller_profiles?.business_name} · {listing.seller_profiles?.seller_tier}
                            </span>
                          </div>
                        </div>
                        <Badge
                          variant={
                            listing.approval_status === "approved" ? "default" :
                            listing.approval_status === "rejected" ? "destructive" : "secondary"
                          }
                          className="capitalize shrink-0"
                        >
                          {listing.approval_status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{listing.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        {listing.price && <span className="text-primary font-bold text-sm">£{listing.price.toFixed(2)}</span>}
                        {listing.category && <Badge variant="outline" className="text-xs">{listing.category}</Badge>}
                        <span className="text-xs text-muted-foreground ml-auto">
                          {new Date(listing.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {listing.approval_status === "pending" && (
                        <div className="flex gap-2 mt-3">
                          <Button size="sm" onClick={() => handleApprove(listing.id)} disabled={processing === listing.id} className="rounded-xl gap-1.5">
                            {processing === listing.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                            Approve
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleReject(listing.id)} disabled={processing === listing.id} className="rounded-xl gap-1.5">
                            <XCircle size={14} /> Reject
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => navigate(`/listing/${listing.id}`)} className="rounded-xl gap-1.5">
                            <Eye size={14} /> Preview
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="disputes">
            {disputes.length === 0 ? (
              <div className="glass rounded-2xl p-12 text-center">
                <Flag size={48} className="text-muted-foreground mx-auto mb-4" />
                <h3 className="font-display text-lg font-bold mb-2">No disputed reviews</h3>
                <p className="text-sm text-muted-foreground">All clear! No sellers have disputed any reviews.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {disputes.map(d => (
                  <div key={d.id} className="glass rounded-xl p-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="min-w-0">
                        <h3 className="font-display font-bold text-sm line-clamp-1">{d.listing_title}</h3>
                        <p className="text-xs text-muted-foreground">
                          by <span className="font-medium text-foreground">{d.seller_name}</span> · {new Date(d.dispute_date).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge
                        variant={d.dispute_status === "pending" ? "secondary" : d.dispute_status === "kept" ? "default" : "destructive"}
                        className="capitalize shrink-0"
                      >
                        {d.dispute_status}
                      </Badge>
                    </div>

                    {/* Review details */}
                    <div className="bg-secondary/50 rounded-lg p-3 mb-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium">{d.reviewer_name}</span>
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map(s => (
                            <Star key={s} size={12} className={s <= d.rating ? "text-primary fill-primary" : "text-muted-foreground"} />
                          ))}
                        </div>
                      </div>
                      {d.comment && <p className="text-sm text-muted-foreground">{d.comment}</p>}
                    </div>

                    {/* Dispute reason */}
                    <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-3 mb-3">
                      <p className="text-xs font-medium text-yellow-500 mb-1 flex items-center gap-1">
                        <MessageSquare size={12} /> Seller's Dispute Reason
                      </p>
                      <p className="text-sm text-muted-foreground">{d.dispute_reason}</p>
                    </div>

                    {/* Actions (only for pending) */}
                    {d.dispute_status === "pending" && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => { setResolveId(d.id); setResolveAction("keep"); }}
                          className="rounded-xl gap-1.5"
                        >
                          <CheckCircle size={14} /> Keep Review
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => { setResolveId(d.id); setResolveAction("remove"); }}
                          className="rounded-xl gap-1.5"
                        >
                          <XCircle size={14} /> Remove Review
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => navigate(`/listing/${d.listing_id}`)}
                          className="rounded-xl gap-1.5"
                        >
                          <Eye size={14} /> View
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Resolve dispute dialog */}
      <Dialog open={!!resolveId} onOpenChange={(o) => { if (!o) { setResolveId(null); setResolveAction(null); setResolveNote(""); } }}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              {resolveAction === "remove" ? <XCircle size={18} className="text-destructive" /> : <CheckCircle size={18} className="text-green-500" />}
              {resolveAction === "remove" ? "Remove Review" : "Keep Review"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <p className="text-sm text-muted-foreground">
              {resolveAction === "remove"
                ? "The review will be deleted and the reviewer will be notified."
                : "The review will remain and the seller will be notified of your decision."}
            </p>
            <Textarea
              value={resolveNote}
              onChange={e => setResolveNote(e.target.value)}
              placeholder="Optional note to include in the notification..."
              className="bg-secondary border-border rounded-xl min-h-[60px]"
            />
            <Button
              onClick={handleResolveDispute}
              disabled={resolving}
              variant={resolveAction === "remove" ? "destructive" : "default"}
              className="w-full rounded-xl gap-2"
            >
              {resolving ? <Loader2 size={16} className="animate-spin" /> : null}
              Confirm: {resolveAction === "remove" ? "Remove Review" : "Keep Review"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default Admin;
