import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Plus, Pencil, Trash2, ImagePlus, Eye, Bookmark,
  Loader2, Package, Store, X, Save, Upload, Pause, Play, Flag, Star, MessageSquare, ExternalLink, Zap, Check, XCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import VehicleSelector from "@/components/VehicleSelector";
import CategoryTagSelector from "@/components/CategoryTagSelector";

interface SellerProfile {
  id: string;
  business_name: string;
  description: string | null;
  logo_url: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  website_url: string | null;
  seller_tier: string;
  approved: boolean;
}

interface Listing {
  id: string;
  title: string;
  description: string;
  price: number | null;
  category: string | null;
  compatible_vehicles: string[];
  tags: string[];
  photos: string[];
  external_link: string | null;
  active: boolean;
  approval_status: string;
  view_count: number;
  save_count: number;
  created_at: string;
  featured?: boolean;
  featured_until?: string | null;
  boost_package?: string | null;
}

const BOOST_PACKAGES = [
  { name: "Quick Boost", duration: 3, price: "£1.99", priceId: "price_1TLlEPAc5QcTT3aLBYi756Nc", description: "Get seen by more buyers for 3 days" },
  { name: "Weekly Feature ⭐", duration: 7, price: "£4.99", priceId: "price_1TLlEQAc5QcTT3aLOd2ZsBFf", description: "Top placement for a full week", popular: true },
  { name: "Power Boost", duration: 7, price: "£11.99", priceId: "price_1TLlERAc5QcTT3aL8KbbVNwA", description: "Feature 3 listings simultaneously for 7 days" },
  { name: "Monthly Spotlight", duration: 30, price: "£14.99", priceId: "price_1TLlESAc5QcTT3aLrDNMavJy", description: "Maximum visibility for a full month" },
  { name: "Homepage Spotlight 🏠", duration: 7, price: "£9.99", priceId: "price_1TLlEUAc5QcTT3aLDbH7FKy0", description: "Your listing featured on the PARTARA homepage" },
];

interface DisputedReview {
  id: string;
  listing_id: string;
  rating: number;
  comment: string | null;
  dispute_status: string;
  dispute_reason: string | null;
  dispute_admin_note: string | null;
  listing_title: string;
  reviewer_name: string;
}

interface Offer {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  amount: number;
  message: string | null;
  status: string;
  created_at: string;
  listing_title?: string;
  buyer_name?: string;
}

const CATEGORIES = [
  "Engine Parts", "Body Parts", "Brakes", "Suspension", "Electrical",
  "Filters", "Exhaust", "Interior", "Cooling", "Transmission",
  "Body Panels", "Lighting", "Wheels & Tyres", "Other"
];

// All logged-in users can list parts - no seller plan required

const MyMarket = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProfile, setEditingProfile] = useState(false);
  const [listingDialog, setListingDialog] = useState(false);
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [undoListing, setUndoListing] = useState<Listing | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [userPlan, setUserPlan] = useState<string>("free");
  const [disputedReviews, setDisputedReviews] = useState<DisputedReview[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [boostModalOpen, setBoostModalOpen] = useState(false);
  const [boostListingId, setBoostListingId] = useState<string | null>(null);
  const [boostingPriceId, setBoostingPriceId] = useState<string | null>(null);
  const [showBoostSuccess, setShowBoostSuccess] = useState(false);

  // Check for ?boosted=true in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("boosted") === "true") {
      setShowBoostSuccess(true);
      window.history.replaceState({}, "", "/my-market");
      setTimeout(() => setShowBoostSuccess(false), 8000);
    }
  }, []);

  const handleBoost = async (pkg: typeof BOOST_PACKAGES[0]) => {
    if (!boostListingId) return;
    setBoostingPriceId(pkg.name);
    try {
      const { data, error } = await supabase.functions.invoke("boost-listing", {
        body: { listingId: boostListingId, packageName: pkg.name, durationDays: pkg.duration, priceId: pkg.priceId },
      });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to start checkout", variant: "destructive" });
    } finally {
      setBoostingPriceId(null);
    }
  };

  const [profileForm, setProfileForm] = useState({
    business_name: "", description: "", contact_email: "", contact_phone: "", website_url: "",
    bank_account_name: "", bank_sort_code: "", bank_account_number: "", bank_paypal_email: "",
  });

  const [listingForm, setListingForm] = useState({
    title: "", description: "", price: "", category: "",
    compatible_vehicles: [] as string[], compatible_vehicles_text: "",
    tags: [] as string[], external_link: "", photos: [] as string[]
  });

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    // Load user plan for listing limits, then load data
    supabase
      .from("profiles")
      .select("subscription_plan")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data) setUserPlan(data.subscription_plan);
        loadData();
      });
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    const { data: sp } = await supabase
      .from("seller_profiles")
      .select("*")
      .eq("user_id", user!.id)
      .maybeSingle();

    if (sp) {
      setProfile(sp as SellerProfile);
      // Load bank details from profiles table
      const { data: profileData } = await supabase
        .from("profiles")
        .select("seller_bank_details")
        .eq("user_id", user!.id)
        .single();
      const bankDetails = (profileData?.seller_bank_details as any) || {};
      setProfileForm({
        business_name: sp.business_name,
        description: sp.description || "",
        contact_email: sp.contact_email || "",
        contact_phone: sp.contact_phone || "",
        website_url: sp.website_url || "",
        bank_account_name: bankDetails.account_name || "",
        bank_sort_code: bankDetails.sort_code || "",
        bank_account_number: bankDetails.account_number || "",
        bank_paypal_email: bankDetails.paypal_email || "",
      });

      const { data: ls } = await supabase
        .from("seller_listings")
        .select("*")
        .eq("seller_id", sp.id)
        .order("created_at", { ascending: false });
      setListings((ls as Listing[]) || []);

      // Load disputed reviews for this seller's listings
      const listingIds = (ls || []).map((l: any) => l.id);
      if (listingIds.length > 0) {
        const { data: reviews } = await supabase
          .from("listing_reviews")
          .select("id, listing_id, rating, comment, dispute_status, dispute_reason, dispute_admin_note, user_id")
          .in("listing_id", listingIds)
          .neq("dispute_status", "none");

        if (reviews && reviews.length > 0) {
          const reviewerIds = [...new Set(reviews.map((r: any) => r.user_id))];
          const { data: reviewerProfiles } = await supabase
            .from("profiles")
            .select("user_id, display_name")
            .in("user_id", reviewerIds);
          const profileMap = new Map((reviewerProfiles || []).map((p: any) => [p.user_id, p.display_name]));
          const listingMap = new Map((ls || []).map((l: any) => [l.id, l.title]));

          setDisputedReviews(reviews.map((r: any) => ({
            id: r.id,
            listing_id: r.listing_id,
            rating: r.rating,
            comment: r.comment,
            dispute_status: r.dispute_status,
            dispute_reason: r.dispute_reason,
            dispute_admin_note: r.dispute_admin_note,
            listing_title: listingMap.get(r.listing_id) || "Unknown",
            reviewer_name: profileMap.get(r.user_id) || "Anonymous",
          })));
        } else {
          setDisputedReviews([]);
        }
      }

      // Load offers
      const { data: offersData } = await supabase
        .from("offers")
        .select("*")
        .eq("seller_id", user!.id)
        .order("created_at", { ascending: false });

      if (offersData && offersData.length > 0) {
        const buyerIds = [...new Set(offersData.map((o: any) => o.buyer_id))];
        const offerListingIds = [...new Set(offersData.map((o: any) => o.listing_id))];
        const [buyerProfiles, offerListings] = await Promise.all([
          supabase.from("profiles").select("user_id, display_name").in("user_id", buyerIds),
          supabase.from("seller_listings").select("id, title").in("id", offerListingIds),
        ]);
        const buyerMap = new Map((buyerProfiles.data || []).map(p => [p.user_id, p.display_name]));
        const offerListingMap = new Map((offerListings.data || []).map(l => [l.id, l.title]));

        setOffers(offersData.map((o: any) => ({
          ...o,
          buyer_name: buyerMap.get(o.buyer_id) || "Anonymous",
          listing_title: offerListingMap.get(o.listing_id) || "Unknown",
        })));
      } else {
        setOffers([]);
      }
    }
    setLoading(false);
  };

  const handleCreateProfile = async () => {
    if (!profileForm.business_name.trim()) {
      toast({ title: "Business name required", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("seller_profiles").insert({
      user_id: user!.id,
      business_name: profileForm.business_name,
      description: profileForm.description || null,
      contact_email: profileForm.contact_email || null,
      contact_phone: profileForm.contact_phone || null,
      website_url: profileForm.website_url || null,
      approved: true,
    } as any);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      // Save bank details to profiles table
      const bankDetails = {
        account_name: profileForm.bank_account_name || null,
        sort_code: profileForm.bank_sort_code || null,
        account_number: profileForm.bank_account_number || null,
        paypal_email: profileForm.bank_paypal_email || null,
      };
      const hasBankDetails = Object.values(bankDetails).some(v => v);
      if (hasBankDetails) {
        await supabase.from("profiles").update({ seller_bank_details: bankDetails } as any).eq("user_id", user!.id);
      }
      toast({ title: "Profile created!" });
      setEditingProfile(false);
      await loadData();
    }
    setSaving(false);
  };

  const handleUpdateProfile = async () => {
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase.from("seller_profiles")
      .update({
        business_name: profileForm.business_name,
        description: profileForm.description || null,
        contact_email: profileForm.contact_email || null,
        contact_phone: profileForm.contact_phone || null,
        website_url: profileForm.website_url || null,
      } as any)
      .eq("id", profile.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      // Save bank details to profiles table
      const bankDetails = {
        account_name: profileForm.bank_account_name || null,
        sort_code: profileForm.bank_sort_code || null,
        account_number: profileForm.bank_account_number || null,
        paypal_email: profileForm.bank_paypal_email || null,
      };
      await supabase.from("profiles").update({ seller_bank_details: bankDetails } as any).eq("user_id", user!.id);
      toast({ title: "Profile updated!" });
      setEditingProfile(false);
      await loadData();
    }
    setSaving(false);
  };

  const handleUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !profile) return;
    setUploadingLogo(true);
    const file = e.target.files[0];
    const path = `${user!.id}/logo-${Date.now()}.${file.name.split('.').pop()}`;
    const { error } = await supabase.storage.from("seller-logos").upload(path, file);
    if (error) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } else {
      const { data: urlData } = supabase.storage.from("seller-logos").getPublicUrl(path);
      await supabase.from("seller_profiles")
        .update({ logo_url: urlData.publicUrl } as any)
        .eq("id", profile.id);
      await loadData();
      toast({ title: "Logo uploaded!" });
    }
    setUploadingLogo(false);
  };

  const openListingForm = (listing?: Listing) => {
    if (listing) {
      setEditingListing(listing);
      setListingForm({
        title: listing.title,
        description: listing.description,
        price: listing.price?.toString() || "",
        category: listing.category || "",
        compatible_vehicles: listing.compatible_vehicles,
        compatible_vehicles_text: "",
        tags: listing.tags,
        external_link: listing.external_link || "",
        photos: listing.photos,
      });
    } else {
      // Check listing limit based on user subscription plan
      const activeCount = listings.filter(l => l.active).length;
      const isPaidPlan = ["pro", "elite", "admin", "basic_seller", "featured_seller", "pro_seller"].includes(userPlan);
      const limit = isPaidPlan ? Infinity : 5;
      if (activeCount >= limit) {
        toast({ title: "Listing limit reached", description: `Free members can list up to 5 parts. Upgrade to Pro or Elite for unlimited listings.`, variant: "destructive" });
        return;
      }
      setEditingListing(null);
      setListingForm({ title: "", description: "", price: "", category: "", compatible_vehicles: [], compatible_vehicles_text: "", tags: [], external_link: "", photos: [] });
    }
    setListingDialog(true);
  };

  const handleUploadPhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setUploadingPhotos(true);
    const urls: string[] = [];
    for (const file of Array.from(e.target.files)) {
      const path = `${user!.id}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from("listing-photos").upload(path, file);
      if (!error) {
        const { data: urlData } = supabase.storage.from("listing-photos").getPublicUrl(path);
        urls.push(urlData.publicUrl);
      }
    }
    setListingForm(f => ({ ...f, photos: [...f.photos, ...urls] }));
    setUploadingPhotos(false);
  };

  const removePhoto = (idx: number) => {
    setListingForm(f => ({ ...f, photos: f.photos.filter((_, i) => i !== idx) }));
  };

  const handleSaveListing = async () => {
    if (!profile || !listingForm.title.trim()) {
      toast({ title: "Title required", variant: "destructive" });
      return;
    }
    setSaving(true);
    const extraVehicles = listingForm.compatible_vehicles_text
      .split(",").map(s => s.trim()).filter(Boolean);
    const allVehicles = [...listingForm.compatible_vehicles, ...extraVehicles];
    const payload = {
      seller_id: profile.id,
      title: listingForm.title,
      description: listingForm.description,
      price: listingForm.price ? parseFloat(listingForm.price) : null,
      category: listingForm.category || null,
      compatible_vehicles: allVehicles,
      tags: listingForm.tags,
      photos: listingForm.photos,
      external_link: listingForm.external_link || null,
    };

    let error;
    const newPrice = listingForm.price ? parseFloat(listingForm.price) : null;
    const oldPrice = editingListing?.price ?? null;
    
    if (editingListing) {
      // Check if content fields changed (requiring re-moderation) vs price-only change
      const contentChanged =
        payload.title !== editingListing.title ||
        payload.description !== editingListing.description ||
        payload.category !== editingListing.category ||
        JSON.stringify(payload.photos) !== JSON.stringify(editingListing.photos);

      const updatePayload = contentChanged
        ? { ...payload, approval_status: "pending" }
        : { ...payload, approval_status: editingListing.approval_status };

      ({ error } = await supabase.from("seller_listings").update(updatePayload as any).eq("id", editingListing.id));
      
      // If price was reduced, trigger price drop notifications
      if (!error && oldPrice !== null && newPrice !== null && newPrice < oldPrice) {
        supabase.functions.invoke("notify-seller", {
          body: { listing_id: editingListing.id, action: "price_drop", target_price: newPrice.toString() },
        }).catch(() => {});
      }

      // Run moderation only if content changed
      if (!error && contentChanged) {
        try {
          const { data: modResult } = await supabase.functions.invoke("moderate-listing", {
            body: { listing_id: editingListing.id },
          });
          if (modResult?.status === "approved") {
            toast({ title: "✅ Listing updated & approved!", description: "Your changes are now live." });
          } else {
            toast({
              title: "🔍 Listing under review",
              description: modResult?.reason || "Our team will review your changes shortly.",
            });
          }
        } catch {
          toast({ title: "Listing updated", description: "Pending re-approval." });
        }
      } else if (!error) {
        toast({ title: "Listing updated!" });
      }
    } else {
      ({ error } = await supabase.from("seller_listings").insert({ ...payload, approval_status: "pending" } as any).select().single());

      if (!error) {
        const { data: newListings } = await supabase
          .from("seller_listings")
          .select("id")
          .eq("seller_id", profile.id)
          .order("created_at", { ascending: false })
          .limit(1);

        const newId = newListings?.[0]?.id;
        if (newId) {
          toast({ title: "Listing created! Running review..." });
          try {
            const { data: modResult } = await supabase.functions.invoke("moderate-listing", {
              body: { listing_id: newId },
            });
            if (modResult?.status === "approved") {
              toast({ title: "✅ Listing approved!", description: "Your listing is now live on the marketplace." });
            } else {
              toast({
                title: "🔍 Listing under review",
                description: modResult?.reason || "Our team will review your listing shortly.",
              });
            }
          } catch {
            toast({ title: "Listing submitted", description: "Pending manual approval." });
          }
        }
      }

      await loadData();
    }
    setSaving(false);
  };

  const handleDeleteListing = async (id: string) => {
    const listingToDelete = listings.find(l => l.id === id);
    const { error } = await supabase.from("seller_listings").delete().eq("id", id);
    if (!error) {
      setListings(l => l.filter(x => x.id !== id));
      setDeleteConfirmId(null);

      // Show undo toast
      if (listingToDelete) {
        setUndoListing(listingToDelete);
        if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
        undoTimerRef.current = setTimeout(() => setUndoListing(null), 5000);
      }
    }
  };

  const handleUndoDelete = async () => {
    if (!undoListing || !profile) return;
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    const { id: _id, ...rest } = undoListing;
    const { error } = await supabase.from("seller_listings").insert({
      ...rest,
      seller_id: profile.id,
    } as any);
    if (!error) {
      toast({ title: "Listing restored!" });
      await loadData();
    }
    setUndoListing(null);
  };

  const handleToggleActive = async (listing: Listing) => {
    await supabase.from("seller_listings")
      .update({ active: !listing.active } as any)
      .eq("id", listing.id);
    await loadData();
  };

  if (!user) return null;

  // Seller gate removed - all logged-in users can list parts

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

  // No seller profile yet
  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container max-w-lg py-24 px-4">
          <div className="glass rounded-2xl p-8 text-center">
            <Store size={48} className="text-primary mx-auto mb-4" />
            <h1 className="font-display text-2xl font-bold mb-2">Set Up Your Seller Profile</h1>
            <p className="text-muted-foreground mb-6">Create your seller profile to start listing parts on PARTARA.</p>
            <div className="space-y-4 text-left">
              <div>
                <label className="text-sm text-muted-foreground block mb-1">Business Name *</label>
                <Input value={profileForm.business_name} onChange={e => setProfileForm(f => ({ ...f, business_name: e.target.value }))} className="bg-secondary border-border rounded-xl" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground block mb-1">Description</label>
                <Textarea value={profileForm.description} onChange={e => setProfileForm(f => ({ ...f, description: e.target.value }))} className="bg-secondary border-border rounded-xl" placeholder="Tell customers about your business..." />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground block mb-1">Email</label>
                  <Input value={profileForm.contact_email} onChange={e => setProfileForm(f => ({ ...f, contact_email: e.target.value }))} className="bg-secondary border-border rounded-xl" />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground block mb-1">Phone</label>
                  <Input value={profileForm.contact_phone} onChange={e => setProfileForm(f => ({ ...f, contact_phone: e.target.value }))} className="bg-secondary border-border rounded-xl" />
                </div>
              </div>
              <div>
                <label className="text-sm text-muted-foreground block mb-1">Website</label>
                <Input value={profileForm.website_url} onChange={e => setProfileForm(f => ({ ...f, website_url: e.target.value }))} className="bg-secondary border-border rounded-xl" placeholder="https://..." />
              </div>
              <Button onClick={handleCreateProfile} disabled={saving} className="w-full rounded-xl gap-2">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Store size={16} />}
                Create Seller Profile
              </Button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const totalViews = listings.reduce((s, l) => s + l.view_count, 0);
  const totalSaves = listings.reduce((s, l) => s + l.save_count, 0);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-5xl py-20 px-4">
        {/* Boost success banner */}
        {showBoostSuccess && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
            <p className="text-sm font-medium text-emerald-400">🎉 Your listing is now featured! It will appear at the top of marketplace.</p>
          </div>
        )}

        {/* Header with analytics */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="flex items-center gap-4">
            {profile.logo_url ? (
              <img src={profile.logo_url} alt={profile.business_name} className="w-14 h-14 rounded-xl object-cover border border-border" />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-secondary flex items-center justify-center">
                <Store size={24} className="text-muted-foreground" />
              </div>
            )}
            <div>
              <h1 className="font-display text-2xl font-bold">{profile.business_name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="default">Active</Badge>
                <Badge variant="outline" className="capitalize">{profile.seller_tier} seller</Badge>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setEditingProfile(true)} className="rounded-xl gap-1.5">
              <Pencil size={14} /> Edit Profile
            </Button>
            <label className="cursor-pointer">
              <Button size="sm" variant="outline" className="rounded-xl gap-1.5" asChild>
                <span>{uploadingLogo ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />} Logo</span>
              </Button>
              <input type="file" accept="image/*" className="hidden" onChange={handleUploadLogo} />
            </label>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="glass rounded-xl p-4 text-center">
            <Package size={20} className="text-primary mx-auto mb-1" />
            <p className="font-display text-2xl font-bold">{listings.length}</p>
            <p className="text-xs text-muted-foreground">Listings</p>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <Eye size={20} className="text-primary mx-auto mb-1" />
            <p className="font-display text-2xl font-bold">{totalViews}</p>
            <p className="text-xs text-muted-foreground">Total Views</p>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <Bookmark size={20} className="text-primary mx-auto mb-1" />
            <p className="font-display text-2xl font-bold">{totalSaves}</p>
            <p className="text-xs text-muted-foreground">Total Saves</p>
          </div>
        </div>

        {/* Disputed Reviews Section */}
        {disputedReviews.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Flag size={18} className="text-primary" />
              <h2 className="font-display text-xl font-bold">Disputed Reviews</h2>
              <Badge variant="secondary" className="text-xs">{disputedReviews.length}</Badge>
            </div>
            <div className="space-y-3">
              {disputedReviews.map(review => (
                <div key={review.id} className="glass rounded-xl p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <h4 className="font-display font-bold text-sm line-clamp-1">{review.listing_title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">{review.reviewer_name}</span>
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map(s => (
                            <Star key={s} size={10} className={s <= review.rating ? "text-primary fill-primary" : "text-muted-foreground"} />
                          ))}
                        </div>
                      </div>
                    </div>
                    <Badge
                      variant={
                        review.dispute_status === "pending" ? "secondary" :
                        review.dispute_status === "kept" ? "default" : "destructive"
                      }
                      className="capitalize shrink-0 text-xs"
                    >
                      {review.dispute_status === "kept" ? "Review kept" :
                       review.dispute_status === "removed" ? "Review removed" : "Pending"}
                    </Badge>
                  </div>

                  {review.comment && (
                    <p className="text-sm text-muted-foreground mb-2">"{review.comment}"</p>
                  )}

                  {review.dispute_reason && (
                    <div className="bg-secondary/50 rounded-lg p-2 mb-2">
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">Your reason:</span> {review.dispute_reason}
                      </p>
                    </div>
                  )}

                  {/* Show admin decision details */}
                  {(review.dispute_status === "kept" || review.dispute_status === "removed") && (
                    <div className={`rounded-lg p-3 mt-2 ${
                      review.dispute_status === "removed"
                        ? "bg-green-500/5 border border-green-500/20"
                        : "bg-yellow-500/5 border border-yellow-500/20"
                    }`}>
                      <p className="text-xs font-medium mb-1">
                        {review.dispute_status === "removed" ? "✅ Review was removed" : "⚠️ Review was kept"}
                      </p>
                      {review.dispute_admin_note && (
                        <p className="text-xs text-muted-foreground mb-2">
                          <span className="font-medium text-foreground">Admin note:</span> {review.dispute_admin_note}
                        </p>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => navigate("/contact")}
                        className="h-6 text-xs text-primary gap-1 px-0 hover:underline"
                      >
                        <ExternalLink size={10} /> If you believe this decision is incorrect, contact us
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Offers Section */}
        {offers.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare size={18} className="text-primary" />
              <h2 className="font-display text-xl font-bold">Offers Received</h2>
              <Badge variant="secondary" className="text-xs">{offers.filter(o => o.status === "pending").length} pending</Badge>
            </div>
            <div className="space-y-3">
              {offers.map(offer => (
                <div key={offer.id} className="glass rounded-xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-display font-bold text-lg text-primary">£{Number(offer.amount).toFixed(2)}</span>
                        <Badge
                          variant={offer.status === "pending" ? "secondary" : offer.status === "accepted" ? "default" : "destructive"}
                          className="capitalize text-xs"
                        >
                          {offer.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        from <span className="font-medium text-foreground">{offer.buyer_name}</span> on <span className="font-medium text-foreground">{offer.listing_title}</span>
                      </p>
                      {offer.message && (
                        <p className="text-sm text-muted-foreground mt-1 italic">"{offer.message}"</p>
                      )}
                      <p className="text-[11px] text-muted-foreground mt-1">
                        {new Date(offer.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                    {offer.status === "pending" && (
                      <div className="flex gap-2 shrink-0">
                        <Button size="sm" onClick={async () => {
                          await supabase.from("offers").update({ status: "accepted" }).eq("id", offer.id);
                          // Notify buyer
                          await supabase.from("notifications").insert({
                            user_id: offer.buyer_id,
                            type: "offer_accepted",
                            title: "Offer accepted! 🎉",
                            message: `Your offer of £${Number(offer.amount).toFixed(2)} on "${offer.listing_title}" was accepted!`,
                            link: `/listing/${offer.listing_id}`,
                          });
                          // Create conversation
                          const { data: existingConv } = await supabase
                            .from("conversations")
                            .select("id")
                            .eq("listing_id", offer.listing_id)
                            .eq("buyer_id", offer.buyer_id)
                            .eq("seller_id", user!.id)
                            .maybeSingle();
                          if (!existingConv) {
                            await supabase.from("conversations").insert({
                              listing_id: offer.listing_id,
                              buyer_id: offer.buyer_id,
                              seller_id: user!.id,
                            });
                          }
                          toast({ title: "Offer accepted!" });
                          await loadData();
                        }} className="rounded-xl gap-1 text-xs h-8">
                          <Check size={14} /> Accept
                        </Button>
                        <Button size="sm" variant="outline" onClick={async () => {
                          await supabase.from("offers").update({ status: "declined" }).eq("id", offer.id);
                          await supabase.from("notifications").insert({
                            user_id: offer.buyer_id,
                            type: "offer_declined",
                            title: "Offer declined",
                            message: `Your offer of £${Number(offer.amount).toFixed(2)} on "${offer.listing_title}" was declined.`,
                            link: `/listing/${offer.listing_id}`,
                          });
                          toast({ title: "Offer declined" });
                          await loadData();
                        }} className="rounded-xl gap-1 text-xs h-8">
                          <XCircle size={14} /> Decline
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-between items-center mb-6">
          <h2 className="font-display text-xl font-bold">My Listings</h2>
          <Button onClick={() => openListingForm()} className="rounded-xl gap-1.5">
            <Plus size={16} /> Add Listing
          </Button>
        </div>

        {/* Listings grid */}
        {listings.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <Package size={48} className="text-muted-foreground mx-auto mb-4" />
            <h3 className="font-display text-lg font-bold mb-2">No listings yet</h3>
            <p className="text-muted-foreground mb-4">Add your first part listing to start selling.</p>
            <Button onClick={() => openListingForm()} className="rounded-xl gap-1.5">
              <Plus size={16} /> Add Your First Listing
            </Button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {listings.map(listing => (
              <div key={listing.id} className={`glass rounded-xl overflow-hidden ${!listing.active ? 'opacity-60' : ''}`}>
                {listing.photos[0] ? (
                  <div className="relative">
                    <img src={listing.photos[0]} alt={listing.title} className="w-full h-40 object-cover" />
                    {listing.featured && listing.featured_until && new Date(listing.featured_until) > new Date() && (
                      <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-500/90 text-black flex items-center gap-1">
                        ⭐ Featured until {new Date(listing.featured_until).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="relative w-full h-40 bg-secondary flex items-center justify-center">
                    <ImagePlus size={32} className="text-muted-foreground" />
                    {listing.featured && listing.featured_until && new Date(listing.featured_until) > new Date() && (
                      <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-500/90 text-black flex items-center gap-1">
                        ⭐ Featured until {new Date(listing.featured_until).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                      </span>
                    )}
                  </div>
                )}
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-display font-bold text-sm line-clamp-1">{listing.title}</h3>
                    {listing.price && <span className="text-primary font-bold text-sm">£{listing.price.toFixed(2)}</span>}
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    {listing.category && <Badge variant="outline" className="text-xs">{listing.category}</Badge>}
                    <Badge
                      variant={
                        listing.approval_status === "approved" ? "default" :
                        listing.approval_status === "rejected" ? "destructive" : "secondary"
                      }
                      className="text-xs capitalize"
                    >
                      {listing.approval_status}
                    </Badge>
                    {!listing.active && <Badge variant="secondary" className="text-xs">Paused</Badge>}
                  </div>
                  {listing.approval_status === "rejected" && (
                    <div className="bg-destructive/10 border border-destructive/30 rounded-md p-3 mb-3">
                      <p className="text-xs text-destructive font-medium mb-1">This listing was flagged by our review system.</p>
                      <p className="text-xs text-muted-foreground mb-2">Edit the listing to address the issue and resubmit, or contact support if you believe this was a mistake.</p>
                      <Button size="sm" variant="outline" onClick={() => navigate("/contact")} className="text-xs h-7 rounded-md gap-1">
                        Contact Support
                      </Button>
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                    <span className="flex items-center gap-1"><Eye size={12} /> {listing.view_count} views</span>
                    <span className="flex items-center gap-1"><Bookmark size={12} /> {listing.save_count} saves</span>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button size="sm" variant="outline" onClick={() => navigate(`/listing/${listing.id}`)} className="rounded-lg gap-1 text-xs">
                      <Eye size={12} /> View
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => openListingForm(listing)} className="rounded-lg gap-1 text-xs">
                      <Pencil size={12} /> Edit
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleToggleActive(listing)} className="rounded-lg gap-1 text-xs">
                      {listing.active ? <><Pause size={12} /> Pause</> : <><Play size={12} /> Activate</>}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setDeleteConfirmId(listing.id)} className="rounded-lg text-xs text-destructive hover:text-destructive">
                      <Trash2 size={12} />
                    </Button>
                  </div>
                  {listing.featured && listing.featured_until && new Date(listing.featured_until) > new Date() ? (
                    <div className="mt-2 text-center text-[10px] text-yellow-400 font-medium">
                      ⭐ Boosted with {listing.boost_package}
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => { setBoostListingId(listing.id); setBoostModalOpen(true); }}
                      className="w-full mt-2 rounded-lg gap-1.5 text-xs border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10 hover:text-yellow-300"
                    >
                      <Zap size={12} /> Boost Listing
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit profile dialog */}
      <Dialog open={editingProfile} onOpenChange={setEditingProfile}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display">Edit Seller Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground block mb-1">Business Name</label>
              <Input value={profileForm.business_name} onChange={e => setProfileForm(f => ({ ...f, business_name: e.target.value }))} className="bg-secondary border-border rounded-xl" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground block mb-1">Description</label>
              <Textarea value={profileForm.description} onChange={e => setProfileForm(f => ({ ...f, description: e.target.value }))} className="bg-secondary border-border rounded-xl" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground block mb-1">Email</label>
                <Input value={profileForm.contact_email} onChange={e => setProfileForm(f => ({ ...f, contact_email: e.target.value }))} className="bg-secondary border-border rounded-xl" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground block mb-1">Phone</label>
                <Input value={profileForm.contact_phone} onChange={e => setProfileForm(f => ({ ...f, contact_phone: e.target.value }))} className="bg-secondary border-border rounded-xl" />
              </div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground block mb-1">Website</label>
              <Input value={profileForm.website_url} onChange={e => setProfileForm(f => ({ ...f, website_url: e.target.value }))} className="bg-secondary border-border rounded-xl" />
            </div>
            <Button onClick={handleUpdateProfile} disabled={saving} className="w-full rounded-xl gap-2">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Listing form dialog */}
      <Dialog open={listingDialog} onOpenChange={setListingDialog}>
        <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">{editingListing ? "Edit Listing" : "New Listing"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground block mb-1">Title *</label>
              <Input value={listingForm.title} onChange={e => setListingForm(f => ({ ...f, title: e.target.value }))} className="bg-secondary border-border rounded-xl" placeholder="e.g. Brake Pads for BMW 3 Series" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground block mb-1">Description</label>
              <Textarea value={listingForm.description} onChange={e => setListingForm(f => ({ ...f, description: e.target.value }))} className="bg-secondary border-border rounded-xl min-h-[80px]" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground block mb-1">Price (£)</label>
                <Input type="number" step="0.01" value={listingForm.price} onChange={e => setListingForm(f => ({ ...f, price: e.target.value }))} className="bg-secondary border-border rounded-xl" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground block mb-1">Category</label>
                <select
                  value={listingForm.category}
                  onChange={e => setListingForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full h-10 px-3 rounded-xl bg-secondary border border-border text-foreground text-sm"
                >
                  <option value="">Select...</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <VehicleSelector
              vehicles={listingForm.compatible_vehicles}
              onChange={v => setListingForm(f => ({ ...f, compatible_vehicles: v }))}
            />
            <div>
              <label className="text-sm text-muted-foreground block mb-1">Additional Compatible Vehicles (comma-separated)</label>
              <Input value={listingForm.compatible_vehicles_text} onChange={e => setListingForm(f => ({ ...f, compatible_vehicles_text: e.target.value }))} className="bg-secondary border-border rounded-xl" placeholder="BMW 3 Series 2015-2020, BMW 4 Series" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground block mb-1">External Link</label>
              <Input value={listingForm.external_link} onChange={e => setListingForm(f => ({ ...f, external_link: e.target.value }))} className="bg-secondary border-border rounded-xl" placeholder="https://yourshop.com/part" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground block mb-1">Photos</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {listingForm.photos.map((url, i) => (
                  <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button onClick={() => removePhoto(i)} className="absolute top-0.5 right-0.5 bg-background/80 rounded-full p-0.5">
                      <X size={12} />
                    </button>
                  </div>
                ))}
                <label className="w-20 h-20 rounded-lg border border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary transition-colors">
                  {uploadingPhotos ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={20} className="text-muted-foreground" />}
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handleUploadPhotos} />
                </label>
              </div>
            </div>
            <Button onClick={handleSaveListing} disabled={saving} className="w-full rounded-xl gap-2">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {editingListing ? "Update Listing" : "Create Listing"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">Delete Listing</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this listing? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmId && handleDeleteListing(deleteConfirmId)}
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Boost Listing Modal */}
      <Dialog open={boostModalOpen} onOpenChange={setBoostModalOpen}>
        <DialogContent className="bg-card border-border sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <Zap size={18} className="text-yellow-400" /> Boost Your Listing
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            {BOOST_PACKAGES.map((pkg) => (
              <button
                key={pkg.name}
                onClick={() => handleBoost(pkg)}
                disabled={boostingPriceId === pkg.name}
                className={`w-full text-left p-4 rounded-xl border transition-all hover:border-yellow-500/40 hover:bg-yellow-500/5 ${
                  (pkg as any).popular ? "border-yellow-500/30 bg-yellow-500/5" : "border-border"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-display font-bold text-sm">{pkg.name}</span>
                      {(pkg as any).popular && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400">Most Popular</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{pkg.description}</p>
                    <p className="text-[10px] text-muted-foreground/70 mt-0.5">{pkg.duration} days</p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <span className="font-display font-bold text-primary">{pkg.price}</span>
                    {boostingPriceId === pkg.name && (
                      <Loader2 size={14} className="animate-spin text-primary mt-1 ml-auto" />
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground text-center mt-2">
            One-time payment. Your listing will be featured immediately after checkout.
          </p>
        </DialogContent>
      </Dialog>

      {/* Undo delete banner */}
      {undoListing && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 glass rounded-xl px-6 py-3 flex items-center gap-4 shadow-lg border border-border">
          <span className="text-sm">Listing deleted</span>
          <Button size="sm" variant="default" onClick={handleUndoDelete} className="rounded-xl">
            Undo
          </Button>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default MyMarket;
