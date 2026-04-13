import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle, XCircle, Loader2, Shield, Package, Eye, Store, Flag, Star,
  MessageSquare, Users, BookOpen, Mail, Trash2, ToggleLeft, ToggleRight,
  AlertTriangle
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";

const ADMIN_EMAIL = "info@gopartara.com";
const ADMIN_UUID = "95e19b6b-32ec-4af8-8184-d02638ac2ded";

/* ─── Types ─── */
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

interface DisputeRow {
  id: string;
  listing_id: string;
  review_id: string | null;
  seller_id: string;
  seller_message: string;
  status: string;
  admin_response: string | null;
  created_at: string;
  resolved_at: string | null;
  // enriched
  listing_title?: string;
  review_rating?: number;
  review_comment?: string;
  reviewer_name?: string;
  seller_name?: string;
}

interface UserRow {
  user_id: string;
  display_name: string | null;
  email: string | null;
  subscription_plan: string;
  created_at: string;
}

interface BlogRow {
  id: string;
  title: string;
  slug: string;
  published: boolean;
  author: string;
  category: string | null;
  created_at: string;
}

interface ContactRow {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  created_at: string;
  resolved: boolean;
}

interface ReviewRow {
  id: string;
  listing_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  dispute_status: string;
  listing_title?: string;
  reviewer_name?: string;
}

const Admin = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState("listings");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  // Data
  const [listings, setListings] = useState<PendingListing[]>([]);
  const [disputes, setDisputes] = useState<DisputeRow[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [blogs, setBlogs] = useState<BlogRow[]>([]);
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);

  // Filters
  const [listingFilter, setListingFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");

  // Dispute resolution
  const [resolveId, setResolveId] = useState<string | null>(null);
  const [resolveAction, setResolveAction] = useState<"approve" | "reject" | null>(null);
  const [resolveNote, setResolveNote] = useState("");
  const [resolving, setResolving] = useState(false);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; id: string; label: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user) { navigate("/auth?redirect=/admin"); return; }
    const checkAccess = async () => {
      const { data: adminProfile } = await supabase
        .from("profiles")
        .select("subscription_plan")
        .eq("user_id", user.id)
        .single();
      const ok = user.id === ADMIN_UUID || user.email === ADMIN_EMAIL || adminProfile?.subscription_plan === "admin";
      if (!ok) {
        toast({ title: "Access denied", variant: "destructive" });
        navigate("/");
        return;
      }
      setIsAdmin(true);
      loadAll();
    };
    checkAccess();
  }, [user]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      loadListings(),
      loadDisputes(),
      loadUsers(),
      loadBlogs(),
      loadContacts(),
      loadReviews(),
    ]);
    setLoading(false);
  }, []);

  /* ─── Loaders ─── */
  const loadListings = async () => {
    const { data } = await supabase
      .from("seller_listings")
      .select("*, seller_profiles(id, business_name, contact_email, seller_tier)")
      .order("created_at", { ascending: false });
    setListings((data as unknown as PendingListing[]) || []);
  };

  const loadDisputes = async () => {
    const { data } = await supabase
      .from("listing_disputes" as any)
      .select("*")
      .order("created_at", { ascending: false });
    if (!data || data.length === 0) { setDisputes([]); return; }

    const rows = data as any[];
    const listingIds = [...new Set(rows.map(r => r.listing_id).filter(Boolean))];
    const reviewIds = [...new Set(rows.map(r => r.review_id).filter(Boolean))];
    const sellerIds = [...new Set(rows.map(r => r.seller_id).filter(Boolean))];

    const [{ data: listingsData }, { data: reviewsData }, { data: sellerProfiles }] = await Promise.all([
      listingIds.length > 0 ? supabase.from("seller_listings").select("id, title").in("id", listingIds) : { data: [] },
      reviewIds.length > 0 ? supabase.from("listing_reviews").select("id, rating, comment, user_id").in("id", reviewIds) : { data: [] },
      sellerIds.length > 0 ? supabase.from("profiles").select("user_id, display_name").in("user_id", sellerIds) : { data: [] },
    ]);

    // Get reviewer names
    const reviewerIds = [...new Set((reviewsData || []).map((r: any) => r.user_id))];
    const { data: reviewerProfiles } = reviewerIds.length > 0
      ? await supabase.from("profiles").select("user_id, display_name").in("user_id", reviewerIds)
      : { data: [] };

    const listingMap = new Map((listingsData || []).map((l: any) => [l.id, l]));
    const reviewMap = new Map((reviewsData || []).map((r: any) => [r.id, r]));
    const sellerMap = new Map((sellerProfiles || []).map((p: any) => [p.user_id, p]));
    const reviewerMap = new Map((reviewerProfiles || []).map((p: any) => [p.user_id, p]));

    const enriched: DisputeRow[] = rows.map(r => {
      const listing = listingMap.get(r.listing_id);
      const review = reviewMap.get(r.review_id);
      const seller = sellerMap.get(r.seller_id);
      const reviewer = review ? reviewerMap.get(review.user_id) : null;
      return {
        ...r,
        listing_title: r.listing_title || listing?.title || "Unknown listing",
        review_rating: review?.rating,
        review_comment: r.review_text || review?.comment,
        reviewer_name: reviewer?.display_name || "Anonymous",
        seller_name: seller?.display_name || "Unknown seller",
      };
    });
    setDisputes(enriched);
  };

  const loadUsers = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("user_id, display_name, email, subscription_plan, created_at")
      .order("created_at", { ascending: false });
    setUsers((data as UserRow[]) || []);
  };

  const loadBlogs = async () => {
    const { data } = await supabase
      .from("blog_posts")
      .select("id, title, slug, published, author, category, created_at")
      .order("created_at", { ascending: false });
    setBlogs((data as BlogRow[]) || []);
  };

  const loadContacts = async () => {
    const { data } = await supabase
      .from("contact_messages")
      .select("*")
      .order("created_at", { ascending: false });
    setContacts((data as ContactRow[]) || []);
  };

  const loadReviews = async () => {
    const { data: revs } = await supabase
      .from("listing_reviews")
      .select("*")
      .order("created_at", { ascending: false });
    if (!revs || revs.length === 0) { setReviews([]); return; }

    const listingIds = [...new Set(revs.map((r: any) => r.listing_id))];
    const userIds = [...new Set(revs.map((r: any) => r.user_id))];

    const [{ data: listingsData }, { data: profiles }] = await Promise.all([
      supabase.from("seller_listings").select("id, title").in("id", listingIds),
      supabase.from("profiles").select("user_id, display_name").in("user_id", userIds),
    ]);

    const listingMap = new Map((listingsData || []).map((l: any) => [l.id, l]));
    const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));

    setReviews(revs.map((r: any) => ({
      ...r,
      listing_title: listingMap.get(r.listing_id)?.title || "Unknown",
      reviewer_name: profileMap.get(r.user_id)?.display_name || "Anonymous",
    })));
  };

  /* ─── Actions ─── */
  const handleApproveListing = async (id: string) => {
    setProcessing(id);
    const listing = listings.find(l => l.id === id);
    const { error } = await supabase.from("seller_listings").update({ approval_status: "approved" } as any).eq("id", id);
    if (!error && listing?.seller_profiles?.id) {
      await supabase.from("seller_profiles").update({ approved: true } as any).eq("id", listing.seller_profiles.id);
    }
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Listing approved!" }); await loadListings(); }
    setProcessing(null);
  };

  const handleRejectListing = async (id: string) => {
    setProcessing(id);
    const { error } = await supabase.from("seller_listings").update({ approval_status: "rejected" } as any).eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Listing rejected" }); await loadListings(); }
    setProcessing(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { type, id } = deleteTarget;
    let error: any;

    if (type === "listing") {
      ({ error } = await supabase.from("seller_listings").delete().eq("id", id));
      if (!error) { setListings(prev => prev.filter(l => l.id !== id)); }
    } else if (type === "blog") {
      ({ error } = await supabase.from("blog_posts").delete().eq("id", id));
      if (!error) { setBlogs(prev => prev.filter(b => b.id !== id)); }
    } else if (type === "review") {
      ({ error } = await supabase.from("listing_reviews").delete().eq("id", id));
      if (!error) { setReviews(prev => prev.filter(r => r.id !== id)); }
    } else if (type === "contact") {
      ({ error } = await supabase.from("contact_messages").delete().eq("id", id));
      if (!error) { setContacts(prev => prev.filter(c => c.id !== id)); }
    }

    if (error) toast({ title: "Error deleting", description: error.message, variant: "destructive" });
    else toast({ title: "Deleted successfully" });
    setDeleteTarget(null);
    setDeleting(false);
  };

  const handleToggleBlogPublish = async (id: string, currentPublished: boolean) => {
    setProcessing(id);
    const { error } = await supabase.from("blog_posts").update({ published: !currentPublished } as any).eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      setBlogs(prev => prev.map(b => b.id === id ? { ...b, published: !currentPublished } : b));
      toast({ title: currentPublished ? "Blog unpublished" : "Blog published" });
    }
    setProcessing(null);
  };

  const handleToggleContactResolved = async (id: string, currentResolved: boolean) => {
    const { error } = await supabase.from("contact_messages").update({ resolved: !currentResolved } as any).eq("id", id);
    if (!error) {
      setContacts(prev => prev.map(c => c.id === id ? { ...c, resolved: !currentResolved } : c));
    }
  };

  const handleResolveDispute = async () => {
    if (!resolveId || !resolveAction) return;
    setResolving(true);
    const dispute = disputes.find(d => d.id === resolveId);
    if (!dispute) { setResolving(false); return; }

    const adminNote = resolveNote.trim() || null;
    const newStatus = resolveAction === "approve" ? "approved" : "rejected";

    // Update dispute record
    await supabase.from("listing_disputes" as any).update({
      status: newStatus,
      admin_response: adminNote,
      resolved_at: new Date().toISOString(),
    } as any).eq("id", resolveId);

    if (resolveAction === "approve" && dispute.review_id) {
      // Delete the disputed review
      await supabase.from("listing_reviews").delete().eq("id", dispute.review_id);
      // Also remove from local reviews state
      setReviews(prev => prev.filter(r => r.id !== dispute.review_id));
    }

    // Notify seller
    await supabase.from("notifications").insert({
      user_id: dispute.seller_id,
      type: "dispute_resolved",
      title: resolveAction === "approve" ? "Dispute approved" : "Dispute rejected",
      message: resolveAction === "approve"
        ? `Your dispute for "${dispute.listing_title}" was approved. The review has been removed.`
        : `Your dispute for "${dispute.listing_title}" was reviewed. Decision: Rejected.${adminNote ? ` Reason: ${adminNote}` : ""}`,
      link: "/my-market",
    });

    // Send branded email
    const { data: sellerProfile } = await supabase
      .from("profiles")
      .select("email, display_name")
      .eq("user_id", dispute.seller_id)
      .single();

    if (sellerProfile?.email) {
      await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "dispute-decision",
          recipientEmail: sellerProfile.email,
          idempotencyKey: `dispute-decision-${resolveId}-${resolveAction}`,
          templateData: {
            listingTitle: dispute.listing_title,
            decision: resolveAction === "approve" ? "Approved" : "Rejected",
            adminNote: adminNote || undefined,
            sellerName: sellerProfile.display_name || dispute.seller_name,
          },
        },
      });
    }

    toast({ title: `Dispute ${newStatus}` });
    setResolveId(null);
    setResolveAction(null);
    setResolveNote("");
    setResolving(false);

    // Update local state
    setDisputes(prev => prev.map(d => d.id === resolveId ? { ...d, status: newStatus, admin_response: adminNote, resolved_at: new Date().toISOString() } : d));
  };

  const filteredListings = listings.filter(l => listingFilter === "all" || l.approval_status === listingFilter);
  const pendingDisputeCount = disputes.filter(d => d.status === "pending").length;
  const unresolvedContactCount = contacts.filter(c => !c.resolved).length;

  if (!user || !isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-6xl py-20 px-4">
        <div className="flex items-center gap-3 mb-8">
          <Shield size={28} className="text-primary" />
          <h1 className="font-display text-3xl font-bold">Admin Panel</h1>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6 flex-wrap h-auto gap-1">
            <TabsTrigger value="listings" className="gap-1.5">
              <Package size={14} /> Listings
            </TabsTrigger>
            <TabsTrigger value="disputes" className="gap-1.5">
              <Flag size={14} /> Disputes
              {pendingDisputeCount > 0 && (
                <Badge variant="destructive" className="ml-1 text-[10px] px-1.5 py-0">{pendingDisputeCount}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-1.5">
              <Users size={14} /> Users
            </TabsTrigger>
            <TabsTrigger value="blog" className="gap-1.5">
              <BookOpen size={14} /> Blog
            </TabsTrigger>
            <TabsTrigger value="reviews" className="gap-1.5">
              <Star size={14} /> Reviews
            </TabsTrigger>
            <TabsTrigger value="contacts" className="gap-1.5">
              <Mail size={14} /> Messages
              {unresolvedContactCount > 0 && (
                <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">{unresolvedContactCount}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* ═══ LISTINGS TAB ═══ */}
          <TabsContent value="listings">
            <div className="flex gap-2 mb-6 flex-wrap">
              {(["pending", "approved", "rejected", "all"] as const).map(f => (
                <Button key={f} size="sm" variant={listingFilter === f ? "default" : "outline"}
                  onClick={() => setListingFilter(f)} className="rounded-full capitalize">
                  {f}
                  {f !== "all" && <span className="ml-1.5 text-xs">({listings.filter(l => l.approval_status === f).length})</span>}
                </Button>
              ))}
            </div>
            {loading ? <LoadingSpinner /> : filteredListings.length === 0 ? (
              <EmptyState icon={Package} text={`No ${listingFilter} listings`} />
            ) : (
              <div className="space-y-4">
                {filteredListings.map(listing => (
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
                        <Badge variant={listing.approval_status === "approved" ? "default" : listing.approval_status === "rejected" ? "destructive" : "secondary"} className="capitalize shrink-0">
                          {listing.approval_status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{listing.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        {listing.price && <span className="text-primary font-bold text-sm">£{listing.price.toFixed(2)}</span>}
                        {listing.category && <Badge variant="outline" className="text-xs">{listing.category}</Badge>}
                        <span className="text-xs text-muted-foreground ml-auto">{new Date(listing.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex gap-2 mt-3 flex-wrap">
                        {listing.approval_status === "pending" && (
                          <>
                            <Button size="sm" onClick={() => handleApproveListing(listing.id)} disabled={processing === listing.id} className="rounded-xl gap-1.5">
                              {processing === listing.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />} Approve
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleRejectListing(listing.id)} disabled={processing === listing.id} className="rounded-xl gap-1.5">
                              <XCircle size={14} /> Reject
                            </Button>
                          </>
                        )}
                        <Button size="sm" variant="outline" onClick={() => navigate(`/listing/${listing.id}`)} className="rounded-xl gap-1.5">
                          <Eye size={14} /> Preview
                        </Button>
                        <Button size="sm" variant="ghost" className="rounded-xl gap-1.5 text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget({ type: "listing", id: listing.id, label: listing.title })}>
                          <Trash2 size={14} /> Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ═══ DISPUTES TAB ═══ */}
          <TabsContent value="disputes">
            {disputes.length === 0 ? (
              <EmptyState icon={Flag} text="No disputes" sub="All clear! No sellers have disputed any reviews." />
            ) : (
              <div className="space-y-4">
                {disputes.map(d => (
                  <div key={d.id} className="glass rounded-xl p-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="min-w-0">
                        <h3 className="font-display font-bold text-sm line-clamp-1">{d.listing_title}</h3>
                        <p className="text-xs text-muted-foreground">
                          by <span className="font-medium text-foreground">{d.seller_name}</span> · {new Date(d.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={d.status === "pending" ? "secondary" : d.status === "approved" ? "default" : "destructive"} className="capitalize shrink-0">
                        {d.status}
                      </Badge>
                    </div>

                    {/* Disputed review */}
                    {d.review_rating != null && (
                      <div className="bg-secondary/50 rounded-lg p-3 mb-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium">{d.reviewer_name}</span>
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map(s => (
                              <Star key={s} size={12} className={s <= (d.review_rating || 0) ? "text-primary fill-primary" : "text-muted-foreground"} />
                            ))}
                          </div>
                        </div>
                        {d.review_comment && <p className="text-sm text-muted-foreground">{d.review_comment}</p>}
                      </div>
                    )}

                    {/* Seller's dispute message */}
                    <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3 mb-3">
                      <p className="text-xs font-medium text-amber-400 mb-1 flex items-center gap-1">
                        <MessageSquare size={12} /> Seller's Dispute Reason
                      </p>
                      <p className="text-sm text-muted-foreground">{d.seller_message}</p>
                    </div>

                    {/* Admin response (if resolved) */}
                    {d.admin_response && d.status !== "pending" && (
                      <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 mb-3">
                        <p className="text-xs font-medium text-primary mb-1">Admin Response</p>
                        <p className="text-sm text-muted-foreground">{d.admin_response}</p>
                      </div>
                    )}

                    {/* Actions (pending only) */}
                    {d.status === "pending" && (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => { setResolveId(d.id); setResolveAction("approve"); }} className="rounded-xl gap-1.5 bg-green-600 hover:bg-green-700">
                          <CheckCircle size={14} /> ✅ Approve
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => { setResolveId(d.id); setResolveAction("reject"); }} className="rounded-xl gap-1.5">
                          <XCircle size={14} /> ❌ Reject
                        </Button>
                        {d.listing_id && (
                          <Button size="sm" variant="ghost" onClick={() => navigate(`/listing/${d.listing_id}`)} className="rounded-xl gap-1.5">
                            <Eye size={14} /> View
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ═══ USERS TAB ═══ */}
          <TabsContent value="users">
            {loading ? <LoadingSpinner /> : users.length === 0 ? (
              <EmptyState icon={Users} text="No users found" />
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-[1fr_1fr_auto_auto] gap-4 px-4 py-2 text-xs font-medium text-muted-foreground">
                  <span>Name</span><span>Email</span><span>Plan</span><span>Joined</span>
                </div>
                {users.map(u => (
                  <div key={u.user_id} className="glass rounded-xl px-4 py-3 grid grid-cols-[1fr_1fr_auto_auto] gap-4 items-center">
                    <span className="font-medium text-sm truncate">{u.display_name || "—"}</span>
                    <span className="text-sm text-muted-foreground truncate">{u.email || "—"}</span>
                    <Badge variant={u.subscription_plan === "admin" ? "destructive" : u.subscription_plan === "free" ? "secondary" : "default"} className="capitalize text-xs">
                      {u.subscription_plan}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ═══ BLOG TAB ═══ */}
          <TabsContent value="blog">
            {loading ? <LoadingSpinner /> : blogs.length === 0 ? (
              <EmptyState icon={BookOpen} text="No blog posts" />
            ) : (
              <div className="space-y-3">
                {blogs.map(b => (
                  <div key={b.id} className="glass rounded-xl p-4 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display font-bold text-sm line-clamp-1">{b.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">{b.author}</span>
                        {b.category && <Badge variant="outline" className="text-xs">{b.category}</Badge>}
                        <Badge variant={b.published ? "default" : "secondary"} className="text-xs">
                          {b.published ? "Published" : "Draft"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{new Date(b.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <Button size="sm" variant="outline" className="rounded-xl gap-1.5" onClick={() => navigate(`/blog/${b.slug}`)}>
                        <Eye size={14} />
                      </Button>
                      <Button size="sm" variant="outline" className="rounded-xl gap-1.5"
                        disabled={processing === b.id}
                        onClick={() => handleToggleBlogPublish(b.id, b.published)}>
                        {b.published ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                      </Button>
                      <Button size="sm" variant="ghost" className="rounded-xl text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget({ type: "blog", id: b.id, label: b.title })}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ═══ REVIEWS TAB ═══ */}
          <TabsContent value="reviews">
            {loading ? <LoadingSpinner /> : reviews.length === 0 ? (
              <EmptyState icon={Star} text="No reviews" />
            ) : (
              <div className="space-y-3">
                {reviews.map(r => (
                  <div key={r.id} className="glass rounded-xl p-4 flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">{r.reviewer_name}</span>
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map(s => (
                            <Star key={s} size={12} className={s <= r.rating ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30"} />
                          ))}
                        </div>
                        {r.dispute_status !== "none" && (
                          <Badge variant="secondary" className="text-xs capitalize">{r.dispute_status}</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">on "{r.listing_title}"</p>
                      {r.comment && <p className="text-sm text-muted-foreground">{r.comment}</p>}
                      <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
                    </div>
                    <Button size="sm" variant="ghost" className="shrink-0 rounded-xl text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget({ type: "review", id: r.id, label: `Review by ${r.reviewer_name}` })}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ═══ CONTACT MESSAGES TAB ═══ */}
          <TabsContent value="contacts">
            {loading ? <LoadingSpinner /> : contacts.length === 0 ? (
              <EmptyState icon={Mail} text="No contact messages" />
            ) : (
              <div className="space-y-3">
                {contacts.map(c => (
                  <div key={c.id} className={`glass rounded-xl p-4 ${c.resolved ? "opacity-60" : ""}`}>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="min-w-0">
                        <h3 className="font-display font-bold text-sm">{c.subject}</h3>
                        <p className="text-xs text-muted-foreground">
                          {c.name} · <a href={`mailto:${c.email}`} className="text-primary hover:underline">{c.email}</a> · {new Date(c.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <Button size="sm" variant={c.resolved ? "default" : "outline"} className="rounded-xl gap-1.5 text-xs"
                          onClick={() => handleToggleContactResolved(c.id, c.resolved)}>
                          {c.resolved ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
                          {c.resolved ? "Resolved" : "Open"}
                        </Button>
                        <Button size="sm" variant="ghost" className="rounded-xl text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget({ type: "contact", id: c.id, label: c.subject })}>
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{c.message}</p>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* ═══ DELETE CONFIRMATION DIALOG ═══ */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2 text-destructive">
              <Trash2 size={18} /> Confirm Delete
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to permanently delete <strong>"{deleteTarget?.label}"</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <Button variant="destructive" className="flex-1 rounded-xl gap-2" onClick={handleDeleteConfirm} disabled={deleting}>
                {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                Delete Permanently
              </Button>
              <Button variant="outline" className="rounded-xl" onClick={() => setDeleteTarget(null)} disabled={deleting}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══ DISPUTE RESOLUTION DIALOG ═══ */}
      <Dialog open={!!resolveId} onOpenChange={(o) => { if (!o) { setResolveId(null); setResolveAction(null); setResolveNote(""); } }}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              {resolveAction === "approve" ? <CheckCircle size={18} className="text-green-500" /> : <XCircle size={18} className="text-destructive" />}
              {resolveAction === "approve" ? "Approve Dispute — Remove Review" : "Reject Dispute — Keep Review"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <p className="text-sm text-muted-foreground">
              {resolveAction === "approve"
                ? "The review will be permanently deleted and the seller will be notified that their dispute was approved."
                : "The review will remain and the seller will be notified that their dispute was rejected. Please provide a reason."}
            </p>
            <Textarea
              value={resolveNote}
              onChange={e => setResolveNote(e.target.value)}
              placeholder={resolveAction === "reject" ? "Reason for rejection (required)..." : "Optional note to include in the notification..."}
              className="bg-secondary border-border rounded-xl min-h-[60px]"
            />
            <Button
              onClick={handleResolveDispute}
              disabled={resolving || (resolveAction === "reject" && !resolveNote.trim())}
              variant={resolveAction === "approve" ? "default" : "destructive"}
              className="w-full rounded-xl gap-2"
            >
              {resolving ? <Loader2 size={16} className="animate-spin" /> : null}
              {resolveAction === "approve" ? "✅ Approve & Remove Review" : "❌ Reject Dispute"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

/* ─── Helper Components ─── */
const LoadingSpinner = () => (
  <div className="flex justify-center py-12">
    <Loader2 className="animate-spin text-primary" size={32} />
  </div>
);

const EmptyState = ({ icon: Icon, text, sub }: { icon: any; text: string; sub?: string }) => (
  <div className="glass rounded-2xl p-12 text-center">
    <Icon size={48} className="text-muted-foreground mx-auto mb-4" />
    <h3 className="font-display text-lg font-bold mb-2">{text}</h3>
    {sub && <p className="text-sm text-muted-foreground">{sub}</p>}
  </div>
);

export default Admin;
