import { useEffect, useState } from "react";
import { Bookmark, BookmarkCheck, ExternalLink, Loader2, Scale } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import SafeImage from "@/components/SafeImage";
import PriceAlertDialog from "@/components/PriceAlertDialog";

export interface GspProductSpecs {
  partNumber?: string;
  brand?: string;
  manufacturer?: string;
  packSize?: string;
  barcode?: string;
  diameter?: string;
  reach?: string;
  hex?: string;
  thread?: string;
  electrode?: string;
  resistor?: string;
  seal?: string;
  tip?: string;
  [key: string]: string | undefined;
}

export interface GspProduct {
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
  condition?: string;
  sku?: string;
  barcode?: string;
  category?: string;
  specs?: GspProductSpecs;
}

// Whitelist + display order. Only these specs are shown on the card.
const SPEC_ORDER: Array<keyof GspProductSpecs> = [
  "partNumber",
  "brand",
  "diameter",
  "reach",
  "hex",
  "electrode",
];

const SPEC_LABELS: Record<string, string> = {
  partNumber: "Part No.",
  brand: "Brand",
  diameter: "Diameter",
  reach: "Reach",
  hex: "Hex Size",
  electrode: "Electrode",
};

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

    // sessionStorage cache (1h) — v5 cache bust for scraped product-page specs
    const cacheKey = `gsp:v5:${query.toLowerCase()}`;
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

interface GreenSparkProductCardProps {
  product: GspProduct;
  onSave?: (item: {
    id: string;
    partName: string;
    partNumber: string;
    price: number;
    url: string;
    imageUrl: string;
  }) => void;
  isSaved?: boolean;
  savingId?: string | null;
  onCompareToggle?: (item: {
    id: string;
    title: string;
    price: number;
    condition: string;
    sellerName: string;
    url: string;
    imageUrl: string;
    source: "gsp";
  }) => void;
  isComparing?: boolean;
  compareDisabled?: boolean;
}

const parsePrice = (price: string): number => {
  const m = price.match(/[\d.]+/);
  return m ? parseFloat(m[0]) : 0;
};

const GreenSparkProductCard = ({
  product,
  onSave,
  isSaved,
  savingId,
  onCompareToggle,
  isComparing,
  compareDisabled,
}: GreenSparkProductCardProps) => {
  const numericPrice = parsePrice(product.price);
  const partNumber = `gsp-${product.id}`;
  const isThisSaving = savingId === partNumber;

  const handleCompareClick = () => {
    if (!onCompareToggle) return;
    onCompareToggle({
      id: partNumber,
      title: product.title,
      price: numericPrice,
      condition: "New",
      sellerName: product.supplierName || "Green Spark Plug Co.",
      url: product.url,
      imageUrl: product.image,
      source: "gsp",
    });
  };

  const handleSaveClick = () => {
    if (!onSave) return;
    onSave({
      id: partNumber,
      partName: product.title,
      partNumber,
      price: numericPrice,
      url: product.url,
      imageUrl: product.image,
    });
  };

  return (
    <div className="group rounded-3xl overflow-hidden border border-amber-800/40 bg-[#111]/60 backdrop-blur-sm hover:border-amber-600/60 hover:bg-[#111]/80 hover:shadow-2xl hover:shadow-black/60 hover:-translate-y-0.5 transition-[colors,transform] flex flex-col relative animate-fade-in">
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

        {/* Specs — whitelist only, compact 2-col grid, key/value on one line */}
        {(() => {
          const specs = product.specs || {};
          const visibleSpecs = SPEC_ORDER
            .map((k) => [k, specs[k]] as const)
            .filter(([, v]) => v && String(v).trim() !== "" && String(v).trim() !== "-");
          if (visibleSpecs.length === 0) return null;
          return (
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 border-t border-zinc-800/40 pt-2 -mt-1">
              {visibleSpecs.map(([key, value]) => (
                <div key={key} className="flex justify-between gap-1 min-w-0">
                  <span className="text-[10px] text-zinc-600 shrink-0">
                    {SPEC_LABELS[key as string]}
                  </span>
                  <span className="text-[10px] text-zinc-300 font-medium text-right truncate">
                    {String(value)}
                  </span>
                </div>
              ))}
            </div>
          );
        })()}

        <div>
          <span className="text-2xl font-bold text-amber-500">{product.price}</span>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="inline-flex items-center gap-1 text-xs text-zinc-500">
            🚚 {product.shipping || "See site for delivery"}
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

        {/* CTA + Save + Price Alert — same layout as eBay card */}
        <div className="flex flex-col sm:flex-row gap-2">
          <a
            href={product.url}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold transition-colors duration-150"
            title="Affiliate link — supports PARTARA at no extra cost"
          >
            <ExternalLink size={14} /> View Product
          </a>
          {onCompareToggle && (
            <button
              onClick={handleCompareClick}
              disabled={!isComparing && compareDisabled}
              aria-label="Compare this part"
              className={`min-w-[44px] min-h-[44px] sm:w-9 sm:h-9 sm:min-w-0 sm:min-h-0 rounded-2xl border flex items-center justify-center transition-colors ${
                isComparing
                  ? "border-amber-500 bg-amber-500/20 text-amber-400"
                  : "border-white/[0.06] bg-[#1a1a1a] hover:bg-[#222] text-zinc-400 hover:text-white"
              }`}
              title={isComparing ? "Remove from compare" : "Compare"}
            >
              <Scale size={14} />
            </button>
          )}
          {onSave && (
            <button
              onClick={handleSaveClick}
              disabled={isThisSaving}
              aria-label="Save this part"
              className="min-w-[44px] min-h-[44px] sm:w-9 sm:h-9 sm:min-w-0 sm:min-h-0 rounded-2xl border border-white/[0.06] bg-[#1a1a1a] hover:bg-[#222] flex items-center justify-center transition-colors text-zinc-400 hover:text-white"
              title={isSaved ? "Saved" : "Save part"}
            >
              {isThisSaving ? (
                <Loader2 size={14} className="animate-spin" />
              ) : isSaved ? (
                <BookmarkCheck size={14} className="text-amber-500" />
              ) : (
                <Bookmark size={14} />
              )}
            </button>
          )}
          <PriceAlertDialog
            supplierName="Green Spark Plug Co."
            partQuery={product.title}
            supplierUrl={product.url}
            currentPrice={numericPrice}
          />
        </div>
      </div>
    </div>
  );
};

export default GreenSparkProductCard;
