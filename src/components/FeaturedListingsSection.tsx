import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import SafeImage from "@/components/SafeImage";

interface FeaturedListing {
  id: string;
  title: string;
  price: number | null;
  currency: string;
  photos: string[];
  category: string | null;
}

const FeaturedListingsSection = () => {
  const [listings, setListings] = useState<FeaturedListing[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase
          .from("seller_listings")
          .select("id, title, price, currency, photos, category, featured, featured_until, boost_package, active, approval_status")
          .eq("featured", true)
          .eq("active", true)
          .eq("approval_status", "approved")
          .ilike("boost_package", "%Homepage%")
          .gt("featured_until", new Date().toISOString())
          .order("featured_until", { ascending: false })
          .limit(6);
        setListings(((data as any[]) || []) as FeaturedListing[]);
      } catch {}
    })();
  }, []);

  if (listings.length < 2) return null;

  return (
    <section className="px-4 py-8 max-w-6xl mx-auto">
      <h2 className="ds-h2 mb-4">Featured Parts</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {listings.map((l) => (
          <Link
            key={l.id}
            to={`/marketplace/${l.id}`}
            className="rounded-2xl overflow-hidden border border-border bg-card hover:border-primary/40 transition-colors"
          >
            <div className="aspect-square bg-elevated">
              <SafeImage src={l.photos?.[0]} alt={l.title} className="w-full h-full object-cover" />
            </div>
            <div className="p-3">
              <p className="text-sm font-medium text-foreground line-clamp-2 mb-1">{l.title}</p>
              {l.price != null && (
                <p className="text-base font-bold" style={{ color: "#cc1111" }}>
                  {l.currency === "GBP" ? "£" : l.currency} {Number(l.price).toFixed(2)}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default FeaturedListingsSection;
