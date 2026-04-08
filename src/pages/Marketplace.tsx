import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Filter, Star, Store, Eye, Crown, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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
  "All", "Engine Parts", "Brakes", "Suspension", "Electrical", "Body Panels",
  "Interior", "Exhaust", "Transmission", "Filters", "Lighting", "Wheels & Tyres", "Other"
];

const Marketplace = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [listings, setListings] = useState<ListingWithSeller[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [category, setCategory] = useState("All");
  const [vehicleFilter, setVehicleFilter] = useState("");

  useEffect(() => {
    loadListings();
  }, []);

  const loadListings = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("seller_listings")
      .select("*, seller_profiles!inner(id, business_name, logo_url, seller_tier)")
      .eq("active", true)
      .eq("seller_profiles.approved", true)
      .order("created_at", { ascending: false });

    setListings((data as unknown as ListingWithSeller[]) || []);
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

  // Sort: pro sellers first, then featured, then basic
  const tierOrder: Record<string, number> = { pro: 0, featured: 1, basic: 2 };
  const sorted = [...filtered].sort((a, b) =>
    (tierOrder[a.seller_profiles.seller_tier] ?? 3) - (tierOrder[b.seller_profiles.seller_tier] ?? 3)
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-6xl py-20 px-4">
        <div className="text-center mb-10">
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-3">
            <span className="text-primary">Parts</span> Marketplace
          </h1>
          <p className="text-muted-foreground text-lg">Browse parts from verified sellers across the UK</p>
        </div>

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
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {sorted.map(listing => {
              const isFeatured = listing.seller_profiles.seller_tier === "featured" || listing.seller_profiles.seller_tier === "pro";
              return (
                <button
                  key={listing.id}
                  onClick={() => navigate(`/listing/${listing.id}`)}
                  className={`text-left glass rounded-xl overflow-hidden transition-all hover:scale-[1.02] ${
                    isFeatured ? "ring-1 ring-primary/30" : ""
                  }`}
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
                        <Crown size={12} className="text-primary" />
                      )}
                      {listing.seller_profiles.seller_tier === "featured" && (
                        <Star size={12} className="text-primary" />
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
      </div>
      <Footer />
    </div>
  );
};

export default Marketplace;
