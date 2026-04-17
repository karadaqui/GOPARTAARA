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

    // sessionStorage cache (1h)
    const cacheKey = `gsp:${query.toLowerCase()}`;
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
    <a
      href={product.url}
      target="_blank"
      rel="noopener noreferrer sponsored"
      aria-label={`${product.title} — Green Spark Plug Co. affiliate`}
      className="group rounded-2xl overflow-hidden border border-amber-800/30 bg-amber-950/10 hover:border-amber-600/40 hover:bg-amber-950/20 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/30 transition-all flex flex-col"
    >
      {/* Image */}
      <div className="relative aspect-square bg-zinc-900 overflow-hidden">
        <SafeImage
          src={product.image}
          alt={product.title}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/70 backdrop-blur-sm border border-amber-700/30 rounded-full px-2 py-0.5">
          <span className="text-[10px]">🔩</span>
          <span className="text-[10px] font-semibold text-amber-400">
            Green Spark Plug Co.
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-3 flex-1 flex flex-col">
        <p className="text-sm font-semibold text-foreground mb-2 line-clamp-2 leading-snug min-h-[2.5rem] group-hover:text-amber-400 transition-colors">
          {product.title}
        </p>

        <div className="flex items-baseline gap-1 mb-1">
          <span className="text-lg font-bold text-foreground">{product.price}</span>
        </div>

        <p className="text-[11px] text-muted-foreground mb-3">{product.shipping}</p>

        <span className="mt-auto block w-full text-center py-2 bg-amber-600/20 group-hover:bg-amber-600/30 border border-amber-700/30 text-amber-400 text-xs font-semibold rounded-xl transition-all">
          View on Green Spark Plug Co. →
        </span>
      </div>
    </a>
  );
};

export default GreenSparkProductCard;
