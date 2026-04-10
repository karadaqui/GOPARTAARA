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
  Loader2, Package, Store, X, Save, Upload, Pause, Play
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
}

const CATEGORIES = [
  "Engine Parts", "Body Parts", "Brakes", "Suspension", "Electrical",
  "Filters", "Exhaust", "Interior", "Cooling", "Transmission",
  "Body Panels", "Lighting", "Wheels & Tyres", "Other"
];

const SELLER_PLANS = ["basic_seller", "featured_seller", "pro_seller", "admin"];

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
  const [showSellerGate, setShowSellerGate] = useState(false);

  const [profileForm, setProfileForm] = useState({
    business_name: "", description: "", contact_email: "", contact_phone: "", website_url: ""
  });

  const [listingForm, setListingForm] = useState({
    title: "", description: "", price: "", category: "",
    compatible_vehicles: [] as string[], compatible_vehicles_text: "",
    tags: [] as string[], external_link: "", photos: [] as string[]
  });

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    // Check if user has a seller plan
    supabase
      .from("profiles")
      .select("subscription_plan")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (!data || !SELLER_PLANS.includes(data.subscription_plan)) {
          setShowSellerGate(true);
          setLoading(false);
        } else {
          loadData();
        }
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
      setProfileForm({
        business_name: sp.business_name,
        description: sp.description || "",
        contact_email: sp.contact_email || "",
        contact_phone: sp.contact_phone || "",
        website_url: sp.website_url || "",
      });

      const { data: ls } = await supabase
        .from("seller_listings")
        .select("*")
        .eq("seller_id", sp.id)
        .order("created_at", { ascending: false });
      setListings((ls as Listing[]) || []);
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
    } as any);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
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
            <p className="text-xs text-muted-foreground mt-4">
              Want a premium listing? <button onClick={() => navigate("/list-your-parts")} className="text-primary hover:underline">View seller plans</button>
            </p>
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
                <Badge variant={profile.approved ? "default" : "secondary"}>
                  {profile.approved ? "Approved" : "Pending Approval"}
                </Badge>
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

        {/* Add listing */}
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
                  <img src={listing.photos[0]} alt={listing.title} className="w-full h-40 object-cover" />
                ) : (
                  <div className="w-full h-40 bg-secondary flex items-center justify-center">
                    <ImagePlus size={32} className="text-muted-foreground" />
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
