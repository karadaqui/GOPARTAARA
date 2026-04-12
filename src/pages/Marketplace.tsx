import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import BackToTop from "@/components/BackToTop";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Store, Eye, Package, Scale } from "lucide-react";
import VerifiedSellerBadge from "@/components/badges/VerifiedSellerBadge";
import { CompareBar, CompareModal, type CompareItem } from "@/components/PartsComparison";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AuthGateModal from "@/components/AuthGateModal";

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
    if (!user) {
      setAuthGateOpen(true);
      setLoading(false);
      return;
    }
    loadListings();
  }, [user, authLoading]);

  const loadListings = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("seller_listings")
      .select("*, seller_profiles(id, business_name, logo_url, seller_tier, approved)")
      .eq("active", true)
      .eq("approval_status", "approved")
      .order("created_at", { ascending: false });

    const filtered = ((data as unknown as (ListingWithSeller & { seller_profiles: ListingWithSeller['seller_profiles'] & { approved: boolean } })[]) || [])
      .filter(l => l.seller_profiles?.approved);

    setListings(filtered as unknown as ListingWithSeller[]);
    setLoading(false);
  };

  const filtered = listings.filter(l => {
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
  });

  const tierOrder: Record<string, number> = { pro: 0, featured: 1, basic: 2 };
  const sorted = [...filtered].sort((a, b) =>
    (tierOrder[a.seller_profiles.seller_tier] ?? 3) - (tierOrder[b.seller_profiles.seller_tier] ?? 3)
  );

  const toggleCompare = (listing: ListingWithSeller) => {
    const isSelected = compareParts.some((p) => p.id === listing.id);
    if (isSelected) {
      setCompareParts((prev) => prev.filter((p) => p.id !== listing.id));
    } else if (compareParts.length < 3) {
      setCompareParts((prev) => [...prev, {
        id: listing.id,
        title: listing.title,
        price: listing.price,
        sellerName: listing.seller_profiles.business_name,
        sellerTier: listing.seller_profiles.seller_tier,
        category: listing.category || undefined,
        compatibleVehicles: listing.compatible_vehicles,
        imageUrl: listing.photos[0] || undefined,
        source: "marketplace" as const,
      }]);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead
        title="Parts Marketplace | PARTARA"
        description="Browse and buy car parts from verified UK sellers on the PARTARA marketplace. Compare prices, read reviews, and find the perfect part for your vehicle."
        path="/marketplace"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          "name": "PARTARA Parts Marketplace",
          "url": "https://gopartara.com/marketplace",
          "description": "Browse and buy car parts from verified UK sellers."
        }}
      />
      <Navbar />

      <AuthGateModal
        open={authGateOpen}
        onOpenChange={(open) => {
          setAuthGateOpen(open);
          if (!open && !user) navigate("/");
        }}
        title="Sign in to browse the marketplace"
        description="Create a free account to browse parts from verified UK sellers."
      />

      <div className="container max-w-6xl pt-24 pb-20 px-4 flex-1">
        <div className="text-center mb-10">
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-3">
            <span className="text-primary">Parts</span> Marketplace
          </h1>
          <p className="text-muted-foreground text-lg">Browse parts from verified sellers across the UK</p>
        </div>

        {/* Free listing & commission banners */}
        <div className="space-y-2 mb-8">
          <div className="bg-green-900/30 border border-green-500/30 rounded-xl px-4 py-2.5 text-sm text-green-400">
            🎉 Free to list — All PARTARA members can list up to 5 parts for free. Upgrade to Pro for unlimited listings.
          </div>
          <div className="bg-zinc-900/50 border border-white/[0.06] rounded-xl px-4 py-2.5 text-xs text-zinc-500">
            ℹ️ Commission policy: Listing is currently free. A small commission may be introduced in the future with 30 days notice to all sellers.
          </div>
        </div>

        {!user ? (
          <div className="glass rounded-2xl p-12 text-center">
            <Store size={48} className="text-muted-foreground mx-auto mb-4" />
            <h3 className="font-display text-lg font-bold mb-2">Sign in to browse the marketplace</h3>
            <p className="text-muted-foreground mb-4">Create a free account to view listings from verified sellers.</p>
            <Button onClick={() => navigate("/auth")} className="rounded-xl">Get Started</Button>
          </div>
        ) : (
          <>
            {/* Filters */}
            <div className="glass rounded-2xl p-4 mb-8">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search parts..."
                    className="pl-9 bg-secondary border-border rounded-xl"
                  />
                </div>
                <Input
                  value={vehicleFilter}
                  onChange={e => setVehicleFilter(e.target.value)}
                  placeholder="Filter by vehicle (e.g. BMW 3 Series)"
                  className="bg-secondary border-border rounded-xl md:w-64"
                />
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {CATEGORIES.map(c => (
                  <Button
                    key={c}
                    size="sm"
                    variant={category === c ? "default" : "outline"}
                    onClick={() => setCategory(c)}
                    className="rounded-full text-xs h-7"
                  >
                    {c}
                  </Button>
                ))}
              </div>
            </div>

            {/* Results */}
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : sorted.length === 0 ? (
              <div className="glass rounded-2xl p-12 text-center">
                <Package size={48} className="text-muted-foreground mx-auto mb-4" />
                <h3 className="font-display text-lg font-bold mb-2">No listings found</h3>
                <p className="text-muted-foreground">Try adjusting your search or filters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
                {sorted.map(listing => {
                  const isFeatured = listing.seller_profiles.seller_tier === "featured" || listing.seller_profiles.seller_tier === "pro";
                  const isComparing = compareParts.some((p) => p.id === listing.id);
                  return (
                    <div
                      key={listing.id}
                      className={`text-left glass rounded-xl overflow-hidden card-hover relative ${
                        isFeatured ? "ring-1 ring-primary/30" : ""
                      } ${isComparing ? "ring-2 ring-primary/50" : ""}`}
                    >
                      <button
                        onClick={() => navigate(`/listing/${listing.id}`)}
                        className="w-full text-left"
                      >
                        {listing.photos[0] ? (
                          <img src={listing.photos[0]} alt={listing.title} className="w-full h-44 object-cover" />
                        ) : (
                          <div className="w-full h-44 bg-secondary flex items-center justify-center">
                            <Package size={32} className="text-muted-foreground" />
                          </div>
                        )}
                        <div className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-display font-bold text-sm line-clamp-2 flex-1">{listing.title}</h3>
                            {listing.price && <span className="text-primary font-bold ml-2">£{listing.price.toFixed(2)}</span>}
                          </div>
                          <div className="flex items-center gap-2 mb-3">
                            {listing.seller_profiles.logo_url ? (
                              <img src={listing.seller_profiles.logo_url} alt="" className="w-5 h-5 rounded-full object-cover" />
                            ) : (
                              <Store size={14} className="text-muted-foreground" />
                            )}
                            <span className="text-xs text-muted-foreground">{listing.seller_profiles.business_name}</span>
                            {listing.seller_profiles.seller_tier === "pro" && (
                              <VerifiedSellerBadge variant="pro_seller" size="sm" />
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1 mb-2">
                            {listing.category && <Badge variant="outline" className="text-[10px]">{listing.category}</Badge>}
                            {listing.tags.slice(0, 2).map(t => (
                              <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>
                            ))}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><Eye size={12} /> {listing.view_count}</span>
                          </div>
                        </div>
                      </button>
                      {/* Compare button */}
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleCompare(listing); }}
                        disabled={!isComparing && compareParts.length >= 3}
                        className={`absolute top-2 right-2 h-8 w-8 rounded-lg flex items-center justify-center transition-all ${
                          isComparing
                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                            : "bg-background/80 backdrop-blur-sm text-muted-foreground hover:text-foreground border border-border/50"
                        } ${!isComparing && compareParts.length >= 3 ? "opacity-40 cursor-not-allowed" : ""}`}
                        title={isComparing ? "Remove from compare" : "Add to compare"}
                      >
                        <Scale size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* CTA */}
            <div className="glass rounded-2xl p-8 mt-12 text-center">
              <h2 className="font-display text-xl font-bold mb-2">Sell Your Parts on PARTARA</h2>
              <p className="text-muted-foreground mb-4">Reach thousands of car owners and mechanics.</p>
              <Button onClick={() => navigate("/list-your-parts")} className="rounded-xl gap-2">
                <Store size={16} /> List Your Parts
              </Button>
            </div>
          </>
        )}
      </div>

      <CompareBar
        items={compareParts}
        onOpen={() => setShowCompare(true)}
        onClear={() => setCompareParts([])}
      />
      {showCompare && (
        <CompareModal
          items={compareParts}
          onRemove={(id) => setCompareParts((prev) => prev.filter((p) => p.id !== id))}
          onClose={() => setShowCompare(false)}
        />
      )}

      <Footer />
      <BackToTop />
    </div>
  );
};

export default Marketplace;
