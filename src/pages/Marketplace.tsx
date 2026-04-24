import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import BackToTop from "@/components/BackToTop";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Store, Eye, Package, Scale, Star, Wrench, Bookmark, Tag, Users, Zap } from "lucide-react";
import VerifiedSellerBadge from "@/components/badges/VerifiedSellerBadge";
import SafeImage from "@/components/SafeImage";
import { CompareBar, CompareModal, type CompareItem } from "@/components/PartsComparison";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AuthGateModal from "@/components/AuthGateModal";
import ScrollReveal from "@/components/ScrollReveal";

interface ListingWithSeller {
  id: string;
  title: string;
  description: string;
  price: number | null;
  category: string | null;
  compatible_vehicles: string[];
  tags: string[];
  photos: string[];
  view_count: number;
  save_count: number;
  created_at: string;
  seller_profiles: {
    id: string;
    business_name: string;
    logo_url: string | null;
    seller_tier: string;
  };
}

const CATEGORIES = [
  "All", "Engine Parts", "Body Parts", "Brakes", "Suspension", "Electrical",
  "Filters", "Exhaust", "Interior", "Cooling", "Transmission", "Body Panels",
  "Lighting", "Wheels & Tyres", "Other"
];

const conditionFromTags = (tags: string[]): string | null => {
  const lower = tags.map(t => t.toLowerCase());
  if (lower.includes("new")) return "NEW";
  if (lower.includes("used")) return "USED";
  if (lower.includes("for parts")) return "FOR PARTS";
  return null;
};

const conditionColor = (c: string) => {
  switch (c) {
    case "NEW": return "bg-green-500/20 text-green-400";
    case "USED": return "bg-amber-500/20 text-amber-400";
    case "FOR PARTS": return "bg-red-500/20 text-red-400";
    default: return "";
  }
};

const Marketplace = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const [listings, setListings] = useState<ListingWithSeller[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [category, setCategory] = useState("All");
  const [vehicleFilter, setVehicleFilter] = useState("");
  const [authGateOpen, setAuthGateOpen] = useState(false);
  const [compareParts, setCompareParts] = useState<CompareItem[]>([]);
  const [showCompare, setShowCompare] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setAuthGateOpen(true); setLoading(false); return; }
    loadListings();
  }, [user, authLoading]);

  const loadListings = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("seller_listings")
        .select("*, seller_profiles(id, business_name, logo_url, seller_tier, approved)")
        .eq("active", true).eq("approval_status", "approved")
        .order("created_at", { ascending: false });
      const filtered = ((data as any[]) || []).filter((l: any) => l.seller_profiles?.approved);
      setListings(filtered as unknown as ListingWithSeller[]);
    } catch {}
    setLoading(false);
  };

  const filtered = useMemo(() => listings.filter(l => {
    if (category !== "All" && l.category !== category) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!l.title.toLowerCase().includes(q) && !l.description.toLowerCase().includes(q) && !l.tags.some(t => t.toLowerCase().includes(q))) return false;
    }
    if (vehicleFilter) {
      const v = vehicleFilter.toLowerCase();
      if (!l.compatible_vehicles.some(cv => cv.toLowerCase().includes(v))) return false;
    }
    return true;
  }), [listings, category, search, vehicleFilter]);

  const featured = useMemo(() => filtered.filter(l => l.seller_profiles.seller_tier === "featured" || l.seller_profiles.seller_tier === "pro"), [filtered]);
  const regular = useMemo(() => filtered.filter(l => l.seller_profiles.seller_tier !== "featured" && l.seller_profiles.seller_tier !== "pro"), [filtered]);

  const toggleCompare = (listing: ListingWithSeller) => {
    const isSelected = compareParts.some((p) => p.id === listing.id);
    if (isSelected) {
      setCompareParts((prev) => prev.filter((p) => p.id !== listing.id));
    } else if (compareParts.length < 3) {
      setCompareParts((prev) => [...prev, {
        id: listing.id, title: listing.title, price: listing.price,
        sellerName: listing.seller_profiles.business_name, sellerTier: listing.seller_profiles.seller_tier,
        category: listing.category || undefined, compatibleVehicles: listing.compatible_vehicles,
        imageUrl: listing.photos[0] || undefined, source: "marketplace" as const,
      }]);
    }
  };

  const renderCard = (listing: ListingWithSeller, isFeatured: boolean, index: number) => {
    const isComparing = compareParts.some((p) => p.id === listing.id);
    const condition = conditionFromTags(listing.tags);

    return (
      <ScrollReveal key={listing.id} delay={index * 50}>
        <div className={`group relative rounded-2xl overflow-hidden border transition-[colors,transform] bg-card ${
          isFeatured ? "border-yellow-500/30 ring-1 ring-yellow-500/20" : "border-border"
        } ${isComparing ? "ring-2 ring-primary/50" : ""} hover:border-muted-foreground/30 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20`}>

          {/* Image */}
          <button onClick={() => navigate(`/listing/${listing.id}`)} className="w-full text-left block">
            <div className="relative aspect-[4/3] overflow-hidden">
              {listing.photos[0] ? (
                <SafeImage src={listing.photos[0]} alt={listing.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
              ) : (
                <div className="w-full h-full bg-secondary flex items-center justify-center">
                  <Package size={32} className="text-muted-foreground" />
                </div>
              )}

              {/* Condition badge — top left */}
              {condition && (
                <span className={`absolute top-2.5 left-2.5 text-[10px] font-bold px-2.5 py-1 rounded-full ${conditionColor(condition)}`}>
                  {condition}
                </span>
              )}

              {/* Featured badge — top right */}
              {isFeatured && (
                <span className="absolute top-2.5 right-2.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 text-[10px] font-semibold backdrop-blur-sm">
                  <Star size={10} fill="currentColor" /> Featured
                </span>
              )}
            </div>

            {/* Card body */}
            <div className="p-4">
              <h3 className="font-display font-bold text-sm line-clamp-2 mb-2 text-foreground group-hover:text-primary transition-colors">
                {listing.title}
              </h3>
              <div className="flex items-center justify-between mb-3">
                {listing.price ? (
                  <span className="text-lg font-black text-foreground">£{listing.price.toFixed(2)}</span>
                ) : (
                  <span className="text-sm text-muted-foreground">Price on request</span>
                )}
                {listing.category && (
                  <Badge variant="outline" className="text-[10px] shrink-0">{listing.category}</Badge>
                )}
              </div>

              {/* Seller + stats */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  {listing.seller_profiles.logo_url ? (
                    <SafeImage src={listing.seller_profiles.logo_url} alt="" className="w-5 h-5 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center shrink-0 text-[10px] font-bold text-muted-foreground">
                      {listing.seller_profiles.business_name?.[0] || 'S'}
                    </div>
                  )}
                  <span className="text-xs text-muted-foreground truncate">{listing.seller_profiles.business_name}</span>
                  {listing.seller_profiles.seller_tier === "pro" && <VerifiedSellerBadge variant="pro_seller" size="sm" />}
                </div>
                <div className="flex items-center gap-2.5 text-xs text-muted-foreground shrink-0">
                  <span className="flex items-center gap-0.5"><Eye size={11} /> {listing.view_count || 0}</span>
                  <span className="flex items-center gap-0.5"><Bookmark size={11} /> {listing.save_count || 0}</span>
                </div>
              </div>
            </div>
          </button>

          {/* Compare button */}
          <button
            onClick={(e) => { e.stopPropagation(); toggleCompare(listing); }}
            disabled={!isComparing && compareParts.length >= 3}
            className={`absolute top-2 right-2 h-8 w-8 rounded-lg flex items-center justify-center transition-colors z-10 ${
              isComparing ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                : "bg-background/80 backdrop-blur-sm text-muted-foreground hover:text-foreground border border-border/50"
            } ${!isComparing && compareParts.length >= 3 ? "opacity-40 cursor-not-allowed" : ""} ${isFeatured ? "!right-auto left-2 !top-auto bottom-2" : ""}`}
            title={isComparing ? "Remove from compare" : "Add to compare"}
          >
            <Scale size={14} />
          </button>
        </div>
      </ScrollReveal>
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead
        title="Car Parts Marketplace UK — Buy & Sell | GOPARTARA"
        description="Buy and sell used car parts in the UK. Verified sellers, secure listings, free to browse. List your parts for free."
        path="/marketplace"
        jsonLd={{ "@context": "https://schema.org", "@type": "CollectionPage", "name": "GOPARTARA Parts Marketplace", "url": "https://gopartara.com/marketplace", "description": "Browse and buy car parts from verified UK sellers." }}
      />
      <Navbar />

      <AuthGateModal
        open={authGateOpen}
        onOpenChange={(open) => { setAuthGateOpen(open); if (!open && !user) navigate("/"); }}
        title="Sign in to browse the marketplace"
        description="Create a free account to browse parts from verified UK sellers."
      />

      <div className="container max-w-7xl pt-24 pb-20 px-4 flex-1">
        <div className="text-center mb-10">
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-3">
            <span className="text-primary">Parts</span> Marketplace
          </h1>
          <p className="text-muted-foreground text-lg">Browse parts from verified sellers across the UK</p>
        </div>

        {/* Sell CTA */}
        <div className="bg-card border border-border rounded-xl px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
          <p className="text-sm text-foreground">
            <Wrench size={14} className="inline mr-1.5 -mt-0.5 text-primary" />
            Have parts to sell? List for free — reach thousands of UK car owners
          </p>
          <Button size="sm" className="rounded-xl gap-1.5 shrink-0 h-10 min-w-[120px]" onClick={() => navigate("/my-market")}>
            List Your Parts →
          </Button>
        </div>

        {/* Info banners */}
        <div className="space-y-2 mb-8">
          <div className="bg-green-900/30 border border-green-500/30 rounded-xl px-4 py-2.5 text-sm text-green-400">
            🎉 Free to list — All GOPARTARA members can list up to 5 parts for free. Upgrade to Pro for unlimited listings.
          </div>
        </div>

        {!user ? (
          <div className="glass rounded-2xl p-12 text-center">
            <Store size={48} className="text-muted-foreground mx-auto mb-4" />
            <h3 className="font-display text-lg font-bold mb-2">Sign in to browse the marketplace</h3>
            <p className="text-muted-foreground mb-4">Create a free account to view listings from verified sellers.</p>
            <Button onClick={() => navigate("/auth")} className="rounded-xl h-11">Get Started</Button>
          </div>
        ) : (
          <>
            {/* Filters */}
            <div className="glass rounded-2xl p-4 mb-8">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search parts..." className="pl-9 bg-secondary border-border rounded-xl text-base" />
                </div>
                <Input value={vehicleFilter} onChange={e => setVehicleFilter(e.target.value)} placeholder="Filter by vehicle (e.g. BMW 3 Series)" className="bg-secondary border-border rounded-xl md:w-64 text-base" />
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {CATEGORIES.map(c => (
                  <Button key={c} size="sm" variant={category === c ? "default" : "outline"} onClick={() => setCategory(c)} className="rounded-full text-xs h-8 min-h-[32px]">
                    {c}
                  </Button>
                ))}
              </div>
            </div>

            {/* Results */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="rounded-2xl border border-border bg-card overflow-hidden">
                    <Skeleton className="w-full aspect-[4/3]" />
                    <div className="p-4 space-y-3">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-6 w-1/3" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="glass rounded-2xl p-12 text-center">
                <Package size={48} className="text-muted-foreground mx-auto mb-4" />
                <h3 className="font-display text-lg font-bold mb-2">
                  {listings.length === 0 ? "No parts listed yet" : "No listings found"}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {listings.length === 0
                    ? "Be the first to list! Reach thousands of UK car owners."
                    : "Try adjusting your search or filters."}
                </p>
                {listings.length === 0 && (
                  <Button onClick={() => navigate("/my-market")} className="rounded-xl gap-2 h-11">
                    <Store size={16} /> List Your Parts
                  </Button>
                )}
              </div>
            ) : (
              <>
                {featured.length > 0 && (
                  <div className="mb-8">
                    <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
                      <Star size={16} className="text-yellow-400 fill-yellow-400" /> Featured Listings
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {featured.map((l, i) => renderCard(l, true, i))}
                    </div>
                  </div>
                )}
                {regular.length > 0 && (
                  <div>
                    {featured.length > 0 && <h2 className="font-display text-lg font-bold mb-4">All Listings</h2>}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {regular.map((l, i) => renderCard(l, false, i))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Why list on GOPARTARA */}
            <div className="mt-12">
              <h2 className="font-display text-xl font-bold mb-1 text-center">Why list on GOPARTARA?</h2>
              <p className="text-muted-foreground text-sm text-center mb-6">Reach buyers actively searching for car parts</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { icon: Tag, title: "Free to list", desc: "List up to 5 parts free — no commission, no listing fees." },
                  { icon: Users, title: "50,000+ potential buyers", desc: "UK drivers and mechanics browse the marketplace daily." },
                  { icon: Zap, title: "Instant visibility", desc: "Listings go live immediately after our quick approval." },
                ].map(({ icon: Icon, title, desc }) => (
                  <div
                    key={title}
                    className="rounded-2xl p-5 transition-colors hover:border-white/15"
                    style={{ background: "#111111", border: "1px solid #1f1f1f" }}
                  >
                    <div
                      className="flex items-center justify-center mb-3 rounded-lg"
                      style={{ width: 40, height: 40, background: "rgba(204,17,17,0.1)" }}
                    >
                      <Icon size={20} style={{ color: "#cc1111" }} />
                    </div>
                    <h3 className="font-display text-base font-bold text-white mb-1">{title}</h3>
                    <p className="text-sm text-zinc-500 leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass rounded-2xl p-8 mt-8 text-center">
              <h2 className="font-display text-xl font-bold mb-2">Sell Your Parts on GOPARTARA</h2>
              <p className="text-muted-foreground mb-4">Reach thousands of car owners and mechanics.</p>
              <Button onClick={() => navigate("/my-market")} className="rounded-xl gap-2 h-11">
                <Store size={16} /> List Your Parts
              </Button>
            </div>
          </>
        )}
      </div>

      <CompareBar items={compareParts} onOpen={() => setShowCompare(true)} onClear={() => setCompareParts([])} />
      {showCompare && (
        <CompareModal items={compareParts} onRemove={(id) => setCompareParts((prev) => prev.filter((p) => p.id !== id))} onClose={() => setShowCompare(false)} />
      )}

      <Footer />
      <BackToTop />
    </div>
  );
};

export default Marketplace;
