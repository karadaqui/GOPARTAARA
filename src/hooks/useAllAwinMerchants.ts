import { useMemo } from "react";
import { useAwinMerchantProducts, type AwinMerchantProduct } from "@/hooks/useAwinMerchantProducts";

// Active feed merchants (must match FEED_MERCHANT_IDS in AwinMerchantResultsSection)
const FEED_MERCHANTS = ["67974", "8626", "16673", "16809", "8794", "104933"] as const;

/**
 * Aggregates products from all active Awin feed merchants into a single flat
 * array, so they can be merged into the unified search-results grid alongside
 * eBay and Green Spark Plug results.
 */
export const useAllAwinMerchants = (query: string, enabled: boolean) => {
  const m1 = useAwinMerchantProducts(FEED_MERCHANTS[0], query, enabled);
  const m2 = useAwinMerchantProducts(FEED_MERCHANTS[1], query, enabled);
  const m3 = useAwinMerchantProducts(FEED_MERCHANTS[2], query, enabled);
  const m4 = useAwinMerchantProducts(FEED_MERCHANTS[3], query, enabled);
  const m5 = useAwinMerchantProducts(FEED_MERCHANTS[4], query, enabled);

  const products: AwinMerchantProduct[] = useMemo(
    () => [...m1.products, ...m2.products, ...m3.products, ...m4.products, ...m5.products],
    [m1.products, m2.products, m3.products, m4.products, m5.products],
  );

  const loading = m1.loading || m2.loading || m3.loading || m4.loading || m5.loading;

  return { products, loading };
};
