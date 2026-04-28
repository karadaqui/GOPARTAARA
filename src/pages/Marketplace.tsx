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
import { Search, Store, Eye, Package, Scale, Star, Wrench, Bookmark } from "lucide-react";
import VerifiedSellerBadge from "@/components/badges/VerifiedSellerBadge";
import SafeImage from "@/components/SafeImage";
import { CompareBar, CompareModal, type CompareItem } from "@/components/PartsComparison";
import { usePersistentCompare } from "@/hooks/usePersistentCompare";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AuthGateModal from "@/components/AuthGateModal";
import ScrollReveal from "@/components/ScrollReveal";
import { toast } from "sonner";

interface BuyerOffer {
  id: string;
  amount: number;
  status: string;
  listing_id: string;
  seller_id: string;
  buyer_id: string;
  listing_title: string;
  listing_photo: string | null;
}

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

const CATEGORY_EMOJI: Record<string, string> = {
  "All": "🛒",
  "Engine Parts": "⚙️",
  "Body Parts": "🚗",
  "Brakes": "🛑",
  "Suspension": "🔧",
  "Electrical": "⚡",
  "Filters": "🧪",
  "Exhaust": "💨",
  "Interior": "🪑",
  "Cooling": "❄️",
  "Transmission": "⚙️",
  "Body Panels": "🚙",
  "Lighting": "💡",
  "Wheels & Tyres": "🛞",
  "Other": "📦",
};

const CATEGORIES = Object.keys(CATEGORY_EMOJI);

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
  const [compareParts, setCompareParts] = usePersistentCompare();
  const [showCompare, setShowCompare] = useState(false);
  const [buyerOffers, setBuyerOffers] = useState<BuyerOffer[]>([]);
  const [payingOfferId, setPayingOfferId] = useState<string | null>(null);
  const [hasShop, setHasShop] = useState(false);

  // Handle return from Stripe checkout
  useEffect(() => {
    const status = searchParams.get("payment");
    const offerId = searchParams.get("offer");
    if (!status) return;
    if (status === "success") {
      toast.success("Payment successful! The seller has been notified and will ship your part shortly.");
      if (offerId) {
        supabase.from("offers").update({ status: "paid" }).eq("id", offerId).then(() => {});
      }
    } else if (status === "cancelled") {
      toast.warning("Payment was cancelled. You can try again from your offers below.");
    }
    window.history.replaceState({}, "", "/marketplace");
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setAuthGateOpen(true); setLoading(false); return; }
    loadListings();
    loadBuyerOffers();
    (async () => {
      try {
        const { data } = await supabase
          .from("seller_profiles")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();
        setHasShop(!!data);
      } catch {}
    })();
  }, [user, authLoading]);

  const loadBuyerOffers = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from("offers")
        .select("id, amount, status, listing_id, seller_id, buyer_id")
        .eq("buyer_id", user.id)
        .in("status", ["accepted", "pending_payment", "paid"])
        .order("created_at", { ascending: false });
      if (!data || data.length === 0) { setBuyerOffers([]); return; }
      const listingIds = [...new Set(data.map((o: any) => o.listing_id))];
      const { data: listings } = await supabase
        .from("seller_listings").select("id, title, photos").in("id", listingIds);
      const map = new Map((listings || []).map((l: any) => [l.id, l]));
      setBuyerOffers(data.map((o: any) => ({
        ...o,
        listing_title: map.get(o.listing_id)?.title || "Unknown part",
        listing_photo: map.get(o.listing_id)?.photos?.[0] || null,
      })));
    } catch {}
  };

  const handlePayNow = async (offer: BuyerOffer) => {
    setPayingOfferId(offer.id);
    try {
      const { data, error } = await supabase.functions.invoke("create-marketplace-checkout", {
        body: { offerId: offer.id },
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to start checkout");
      setPayingOfferId(null);
    }
  };

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
        description="Buy and sell used and new car parts directly with other UK drivers. Free to list up to 5 parts. Browse brake pads, engines, suspension parts and more."
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
        <div className="text-center mb-6">
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-3">
            <span className="text-primary">Parts</span> Marketplace
          </h1>
          <p className="text-muted-foreground text-lg">Browse parts from verified sellers across the UK</p>
        </div>

        {/* Sell CTA */}
        <div className="bg-card border border-border rounded-xl px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
          <p className="text-sm text-foreground">
            <Wrench size={14} className="inline mr-1.5 -mt-0.5 text-primary" />
            Have parts to sell? List for free on GOPARTARA
          </p>
          <div className="flex items-center gap-2 shrink-0">
            <Button size="sm" className="rounded-xl gap-1.5 h-10 min-w-[120px]" onClick={() => navigate("/my-market")}>
              List Your Parts →
            </Button>
            {user && hasShop && (
              <button
                onClick={() => navigate("/my-market")}
                style={{
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.2)",
                  color: "white",
                  padding: "10px 20px",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                My Shop →
              </button>
            )}
          </div>
        </div>

        {/* Info banners */}
        <div className="space-y-2 mb-8">
          <div className="bg-green-900/30 border border-green-500/30 rounded-xl px-4 py-2.5 text-sm text-green-400">
            🎉 List your parts for free — Free plan: up to 5 listings. Pro & Elite: unlimited listings.
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
            {/* Buyer's accepted offers — Pay Now */}
            {buyerOffers.length > 0 && (
              <div className="mb-8 space-y-3">
                <h2 className="font-display text-lg font-bold text-foreground">Your offers</h2>
                {buyerOffers.map(o => (
                  <div key={o.id} className="bg-card border border-border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {o.listing_photo ? (
                        <SafeImage src={o.listing_photo} alt={o.listing_title} className="w-14 h-14 rounded-lg object-cover shrink-0" />
                      ) : (
                        <div className="w-14 h-14 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                          <Package size={20} className="text-muted-foreground" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm truncate text-foreground">{o.listing_title}</p>
                        <p className="text-xs text-muted-foreground">Your offer: £{Number(o.amount).toFixed(2)}</p>
                      </div>
                    </div>
                    {o.status === "paid" ? (
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">✓ Paid</Badge>
                    ) : (
                      <div className="flex flex-col items-stretch sm:items-end gap-1.5">
                        <Button
                          onClick={() => handlePayNow(o)}
                          disabled={payingOfferId === o.id}
                          className="rounded-xl h-11 bg-primary hover:bg-primary/90 font-semibold"
                        >
                          {payingOfferId === o.id ? "Redirecting…" : `Pay £${Number(o.amount).toFixed(2)} Securely →`}
                        </Button>
                        <p className="text-[11px] text-muted-foreground text-center sm:text-right">🔒 Secured by Stripe — card payments only</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

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
                {CATEGORIES.map(c => {
                  const active = category === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCategory(c)}
                      className="inline-flex items-center gap-1.5 text-xs font-medium h-8 px-3 transition-colors"
                      style={{
                        borderRadius: "8px",
                        background: active ? "#cc1111" : "#111111",
                        color: active ? "#ffffff" : "#a1a1aa",
                        border: active ? "1px solid #cc1111" : "1px solid #1f1f1f",
                      }}
                    >
                      <span aria-hidden>{CATEGORY_EMOJI[c]}</span>
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Why sell on GOPARTARA — always visible above grid */}
            <div className="mb-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { emoji: "🆓", title: "Free to list", desc: "Up to 5 listings on the Free plan. Unlimited on Pro & Elite." },
                  { emoji: "🛡️", title: "UK sellers only", desc: "All listings are from registered GOPARTARA members in the UK." },
                  { emoji: "⚡", title: "Live immediately", desc: "Your listing goes live as soon as you publish it." },
                ].map(({ emoji, title, desc }) => (
                  <div
                    key={title}
                    style={{
                      background: "#111111",
                      borderTop: "2px solid #cc1111",
                      borderRight: "1px solid #1f1f1f",
                      borderBottom: "1px solid #1f1f1f",
                      borderLeft: "1px solid #1f1f1f",
                      padding: "20px",
                      borderRadius: "12px",
                    }}
                  >
                    <div className="text-2xl mb-2" aria-hidden>{emoji}</div>
                    <h3 className="font-display text-base font-bold text-white mb-1">{title}</h3>
                    <p className="text-sm text-zinc-500 leading-relaxed">{desc}</p>
                  </div>
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
              <div
                className="rounded-2xl p-12 text-center"
                style={{ background: "#111111", border: "1px solid #1f1f1f" }}
              >
                <Package size={80} className="mx-auto mb-5" style={{ color: "#3f3f46" }} />
                <h3 className="font-display text-lg font-bold mb-2 text-white">
                  {category !== "All"
                    ? `No ${category} parts listed yet`
                    : listings.length === 0
                      ? "No parts listed yet"
                      : "No listings found"}
                </h3>
                <p className="text-zinc-500 mb-5 text-sm">
                  {category !== "All" || listings.length === 0
                    ? "Be the first — list yours free"
                    : "Try adjusting your search or filters."}
                </p>
                {(category !== "All" || listings.length === 0) && (
                  <Button
                    onClick={() => navigate("/my-market")}
                    className="rounded-xl gap-2 h-11 text-white border-0"
                    style={{ background: "#cc1111" }}
                  >
                    List a Part →
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

            <div className="glass rounded-2xl p-8 mt-8 text-center">
              <h2 className="font-display text-xl font-bold mb-2">Sell Your Parts on GOPARTARA</h2>
              <p className="text-muted-foreground mb-4">Growing community of UK car owners and mechanics.</p>
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
