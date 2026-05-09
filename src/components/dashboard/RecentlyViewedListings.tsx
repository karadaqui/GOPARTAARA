import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Eye, ArrowRight } from "lucide-react";

interface ViewedItem {
  id: string;
  listing_id: string;
  viewed_at: string;
  title: string;
  price: number | null;
  photo: string | null;
}

const RecentlyViewedListings = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<ViewedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    (async () => {
      try {
        const sb = supabase as any;
        const { data: rows } = await sb
          .from("recently_viewed")
          .select("id, listing_id, viewed_at")
          .eq("user_id", user.id)
          .order("viewed_at", { ascending: false })
          .limit(10);
        if (!rows || rows.length === 0) { setItems([]); return; }
        const ids = rows.map((r: any) => r.listing_id);
        const { data: listings } = await supabase
          .from("seller_listings")
          .select("id, title, price, photos")
          .in("id", ids);
        const map = new Map((listings || []).map((l: any) => [l.id, l]));
        setItems(
          rows
            .map((r: any) => {
              const l: any = map.get(r.listing_id);
              if (!l) return null;
              const raw = l.photos?.[0] || null;
              const photo = raw
                ? raw.startsWith("http") ? raw
                  : `https://bkwieknlxvkrzluongif.supabase.co/storage/v1/object/public/listing-photos/${raw}`
                : null;
              return { id: r.id, listing_id: r.listing_id, viewed_at: r.viewed_at, title: l.title, price: l.price, photo };
            })
            .filter(Boolean) as ViewedItem[]
        );
      } catch {}
      setLoading(false);
    })();
  }, [user]);

  if (loading) return null;

  return (
    <div className="glass rounded-2xl p-6 sm:p-8 mb-6">
      <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
        <Eye size={18} className="text-primary" />
        Recently Viewed
      </h2>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No recently viewed listings yet.{" "}
          <Link to="/marketplace" className="text-primary hover:underline">Browse the marketplace →</Link>
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {items.map(item => (
            <Link
              key={item.id}
              to={`/listing/${item.listing_id}`}
              className="group block rounded-xl overflow-hidden border border-border bg-card hover:border-primary/50 transition-colors"
            >
              <div className="aspect-square bg-secondary flex items-center justify-center overflow-hidden">
                {item.photo ? (
                  <img src={item.photo} alt={item.title} loading="lazy" decoding="async" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                ) : (
                  <span className="text-3xl">🔧</span>
                )}
              </div>
              <div className="p-2.5">
                <span className="inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded bg-primary/15 text-primary mb-1">
                  Marketplace
                </span>
                <p className="text-xs font-semibold line-clamp-2 leading-tight mb-1">{item.title}</p>
                {item.price != null && (
                  <p className="text-sm font-bold text-primary">£{Number(item.price).toFixed(2)}</p>
                )}
                <span className="text-[10px] text-muted-foreground inline-flex items-center gap-0.5 mt-1 group-hover:text-primary">
                  View again <ArrowRight size={10} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecentlyViewedListings;
