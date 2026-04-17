import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import SafeImage from "@/components/SafeImage";

export interface GspProduct {
  id: string;
  title: string;
  price: string;
  image: string;
  url: string;
  brand?: string;
  shipping: string;
  inStock?: boolean;
  supplier: string;
  supplierName: string;
}

export const useGspProducts = (query: string, enabled: boolean) => {
  const [products, setProducts] = useState<GspProduct[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || !query) {
      setProducts([]);
      return;
    }
    let cancelled = false;
    setLoading(true);

    // sessionStorage cache (1h) — v3 cache bust to force fresh feed for all users
    const cacheKey = `gsp:v3:${query.toLowerCase()}`;
    try {
      const raw = sessionStorage.getItem(cacheKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.expires > Date.now()) {
          setProducts(parsed.products || []);
          setLoading(false);
          return;
        }
      }
    } catch {
      /* ignore */
    }

    supabase.functions
      .invoke("awin-product-feed", { body: { query } })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.warn("[gsp] feed error", error.message);
          setProducts([]);
          return;
        }
        const list: GspProduct[] = data?.products || [];
        setProducts(list);
        try {
          sessionStorage.setItem(
            cacheKey,
            JSON.stringify({ products: list, expires: Date.now() + 60 * 60 * 1000 }),
          );
        } catch {
          /* ignore */
        }
      })
      .catch(() => {
        if (!cancelled) setProducts([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [query, enabled]);

  return { products, loading };
};

const GreenSparkProductCard = ({ product }: { product: GspProduct }) => {
  return (
    <div className="group rounded-3xl overflow-hidden border border-amber-800/40 bg-[#111]/60 backdrop-blur-sm hover:border-amber-600/60 hover:bg-[#111]/80 hover:shadow-2xl hover:shadow-black/60 hover:-translate-y-0.5 transition-all duration-300 flex flex-col relative animate-fade-in">
      {/* Condition bar — same height/style as eBay "New" bar */}
      <div
        className="h-7 flex items-center justify-center text-xs font-semibold tracking-wide uppercase border-b border-white/10"
        style={{ background: "#14532d", color: "#4ade80" }}
      >
        New
      </div>

      {/* Image */}
      <a href={product.url} target="_blank" rel="noopener noreferrer sponsored" className="block relative">
        <div className="h-[140px] sm:h-[180px] lg:h-[200px] bg-[#0d0d0d] overflow-hidden relative">
          <SafeImage
            src={product.image}
            alt={product.title}
            className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-500"
          />
          {/* Supplier label top-left on the image */}
          <span className="absolute top-2 left-2 flex items-center gap-1 bg-black/70 backdrop-blur-sm border border-amber-700/40 rounded-full px-2 py-0.5">
            <span className="text-[10px]">🔩</span>
            <span className="text-[10px] font-semibold text-amber-400">
              Green Spark Plug Co.
            </span>
          </span>
        </div>
      </a>

      {/* Body — same padding/gap as eBay card */}
      <div className="p-4 flex-1 flex flex-col gap-3">
        <a href={product.url} target="_blank" rel="noopener noreferrer sponsored" className="block">
          <p className="text-sm font-medium text-white leading-snug line-clamp-2 min-h-[2.5rem] group-hover:text-amber-400 transition-colors">
            {product.title}
          </p>
        </a>

        <div>
          <span className="text-2xl font-bold text-amber-500">{product.price}</span>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="inline-flex items-center gap-1 text-xs text-zinc-500">
            🚚 {product.shipping}
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] text-zinc-600">
            🌍 Ships worldwide
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-zinc-500 border-t border-white/[0.06] pt-3 mt-auto">
          <span className="font-medium truncate text-amber-400">
            {product.brand || "Green Spark Plug Co."}
          </span>
          <span className="text-zinc-600 ml-auto">Affiliate</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <a
            href={product.url}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold transition-colors duration-150"
            title="Affiliate link — supports PARTARA at no extra cost"
          >
            View on Green Spark Plug Co. →
          </a>
        </div>
      </div>
    </div>
  );
};

export default GreenSparkProductCard;
