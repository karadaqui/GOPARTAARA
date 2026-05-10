import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AwinMerchantProduct {
  id: string;
  title: string;
  price: string;
  image: string;
  url: string;
  brand?: string;
  shipping: string;
  description?: string;
  inStock?: boolean;
  supplier: string;
  supplierName: string;
  category?: string;
}

/**
 * Fetches products for one Awin merchant via the parametric `awin-merchant-feed`
 * edge function. Mirrors the shape of `useGspProducts`, with a sessionStorage
 * cache (1h) keyed by merchantId+query.
 */
export const useAwinMerchantProducts = (
  merchantId: string,
  query: string,
  enabled: boolean,
) => {
  const [products, setProducts] = useState<AwinMerchantProduct[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || !query || !merchantId) {
      setProducts([]);
      return;
    }
    let cancelled = false;
    setLoading(true);

    const cacheKey = `awinm:v1:${merchantId}:${query.toLowerCase()}`;
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
    } catch { /* ignore */ }

    supabase.functions
      .invoke("awin-merchant-feed", { body: { merchantId, query } })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.warn(`[awin-merchant ${merchantId}] error`, error.message);
          setProducts([]);
          return;
        }
        const list: AwinMerchantProduct[] = data?.products || [];
        setProducts(list);
        try {
          sessionStorage.setItem(
            cacheKey,
            JSON.stringify({ products: list, expires: Date.now() + 60 * 60 * 1000 }),
          );
        } catch { /* ignore quota */ }
      })
      .catch((e) => {
        if (!cancelled) console.warn(`[awin-merchant ${merchantId}] threw`, e);
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [merchantId, query, enabled]);

  return { products, loading };
};
