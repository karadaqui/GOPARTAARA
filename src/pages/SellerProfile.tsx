import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Store, Star, Globe, Mail, Phone, Package, Eye, Loader2, Lock } from "lucide-react";
import VerifiedSellerBadge from "@/components/badges/VerifiedSellerBadge";
import PlanBadge from "@/components/badges/PlanBadge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface SellerFull {
  id: string;
  business_name: string;
  description: string | null;
  logo_url: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  website_url: string | null;
  seller_tier: string;
}

interface Listing {
  id: string;
  title: string;
  price: number | null;
  category: string | null;
  photos: string[];
  view_count: number;
  tags: string[];
}

const SellerProfile = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [seller, setSeller] = useState<SellerFull | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) loadSeller();
  }, [id]);

  const loadSeller = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("seller_profiles")
      .select("*")
      .eq("id", id!)
      .single();

    if (data) {
      setSeller(data as SellerFull);
      const { data: ls } = await supabase
        .from("seller_listings")
        .select("id, title, price, category, photos, view_count, tags")
        .eq("seller_id", id!)
        .eq("active", true)
        .order("created_at", { ascending: false });
      setListings((ls as Listing[]) || []);
    }
    setLoading(false);
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

  if (!seller) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-24 text-center">
          <h1 className="font-display text-2xl font-bold mb-4">Seller not found</h1>
          <Button onClick={() => navigate("/marketplace")} className="rounded-xl">Back to Marketplace</Button>
        </div>
        <Footer />
      </div>
    );
  }

  const getVerifiedVariant = () => {
    if (seller.seller_tier === "pro") return "pro_seller" as const;
    return null;
  };
  const verifiedVariant = getVerifiedVariant();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-5xl py-20 px-4">
        {/* Profile header */}
        <div className="glass rounded-2xl p-8 mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {seller.logo_url ? (
              <img src={seller.logo_url} alt={seller.business_name} className="w-24 h-24 rounded-2xl object-cover border border-border" />
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-secondary flex items-center justify-center">
                <Store size={36} className="text-muted-foreground" />
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h1 className="font-display text-3xl font-bold">{seller.business_name}</h1>
                {verifiedVariant && <VerifiedSellerBadge variant={verifiedVariant} />}
              </div>
              <PlanBadge plan={seller.seller_tier + "_seller"} />
              {seller.description && (
                <p className="text-secondary-foreground mt-2">{seller.description}</p>
              )}
              <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-muted-foreground">
                {user ? (
                  <>
                    {seller.contact_email && (
                      <a href={`mailto:${seller.contact_email}`} className="flex items-center gap-1.5 hover:text-foreground transition-colors">
                        <Mail size={14} /> {seller.contact_email}
                      </a>
                    )}
                    {seller.contact_phone && (
                      <span className="flex items-center gap-1.5"><Phone size={14} /> {seller.contact_phone}</span>
                    )}
                  </>
                ) : (
                  <span className="flex items-center gap-1.5 text-muted-foreground/60">
                    <Lock size={14} /> Sign in to view contact details
                  </span>
                )}
                {seller.website_url && (
                  <a href={seller.website_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-foreground transition-colors">
                    <Globe size={14} /> Website
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Listings */}
        <h2 className="font-display text-xl font-bold mb-6">{listings.length} Listings</h2>
        {listings.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <Package size={48} className="text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">This seller hasn't listed any parts yet.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {listings.map(l => (
              <button
                key={l.id}
                onClick={() => navigate(`/listing/${l.id}`)}
                className="text-left glass rounded-xl overflow-hidden hover:scale-[1.02] transition-transform"
              >
                {l.photos[0] ? (
                  <img src={l.photos[0]} alt={l.title} className="w-full h-40 object-cover" />
                ) : (
                  <div className="w-full h-40 bg-secondary flex items-center justify-center">
                    <Package size={32} className="text-muted-foreground" />
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-display font-bold text-sm mb-1 line-clamp-2">{l.title}</h3>
                  <div className="flex justify-between items-center">
                    {l.price && <span className="text-primary font-bold">£{l.price.toFixed(2)}</span>}
                    <span className="text-xs text-muted-foreground flex items-center gap-1"><Eye size={12} /> {l.view_count}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default SellerProfile;
