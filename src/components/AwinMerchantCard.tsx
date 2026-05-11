import { Bookmark, BookmarkCheck, ExternalLink, Loader2, Scale } from "lucide-react";
import SafeImage from "@/components/SafeImage";
import ShippingPill from "@/components/ShippingPill";
import PriceAlertDialog from "@/components/PriceAlertDialog";
import type { AwinMerchantProduct } from "@/hooks/useAwinMerchantProducts";

// Short supplier name shown in the badge pill (mirrors eBay supplier badge)
const SHORT_NAMES: Record<string, string> = {
  "green spark plug co.": "GSP",
  "maxpeedingrods": "Maxpeed",
  "mytyres.co.uk": "mytyres",
  "tyres uk": "TyresUK",
  "ev king": "EV King",
  "amazon uk": "Amazon",
  "pneumatici it": "Pneumatici",
  "neumaticos-online.es": "neumaticos",
  "reifendirekt ee": "ReifenDirekt",
  "autobandenmarkt": "Autobandenmarkt",
  "kohl automobile": "Kohl Auto",
  "tirendo": "Tirendo",
  "dunford inc": "Dunford",
};

const shortName = (name: string) => {
  const k = (name || "").toLowerCase().trim();
  return SHORT_NAMES[k] || name;
};

const parsePrice = (raw: string): number => {
  const m = (raw || "").replace(/,/g, ".").match(/[\d]+(?:\.[\d]+)?/);
  return m ? parseFloat(m[0]) : 0;
};

interface Props {
  product: AwinMerchantProduct;
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

const AwinMerchantCard = ({
  product,
  onSave,
  isSaved,
  savingId,
  onCompareToggle,
  isComparing,
  compareDisabled,
}: Props) => {
  const numericPrice = parsePrice(product.price);
  const partNumber = `awin-${product.supplier}-${product.id}`;
  const isThisSaving = savingId === partNumber;
  const supplierShort = shortName(product.supplierName);

  const handleSaveClick = () => {
    onSave?.({
      id: partNumber,
      partName: product.title,
      partNumber,
      price: numericPrice,
      url: product.url,
      imageUrl: product.image,
    });
  };

  const handleCompareClick = () => {
    onCompareToggle?.({
      id: partNumber,
      title: product.title,
      price: numericPrice,
      condition: "New",
      sellerName: product.supplierName,
      url: product.url,
      imageUrl: product.image,
      source: "gsp",
    });
  };

  return (
    <div className="group rounded-3xl overflow-hidden border border-white/[0.06] bg-[#111]/60 backdrop-blur-sm hover:border-white/[0.15] hover:bg-[#111]/80 hover:shadow-2xl hover:shadow-black/60 hover:-translate-y-0.5 transition-[colors,transform] flex flex-col relative animate-fade-in">
      <a href={product.url} target="_blank" rel="noopener sponsored noreferrer" className="block relative">
        <div className="h-[140px] sm:h-[180px] lg:h-[200px] bg-[#0d0d0d] overflow-hidden relative">
          {product.image ? (
            <SafeImage
              src={product.image}
              alt={product.title}
              className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-3xl text-zinc-700">🔧</div>
          )}
        </div>
      </a>

      <div className="p-4 flex-1 flex flex-col gap-3">
        <a href={product.url} target="_blank" rel="noopener sponsored noreferrer" className="block" title={product.title}>
          <p className="text-sm font-medium text-white leading-snug line-clamp-2 min-h-[2.5rem] group-hover:text-amber-400 transition-colors">
            {product.title}
          </p>
        </a>

        {/* Supplier pill (mirrors eBay supplier badge row) */}
        <div className="flex items-center flex-wrap gap-1.5 -mt-1">
          <span
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-white/[0.04] border border-white/[0.08] text-zinc-300"
            title={product.supplierName}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#fbbf24" }} />
            {supplierShort}
          </span>
        </div>

        <div>
          <span className="text-2xl font-bold text-amber-500">{product.price || "See price"}</span>
        </div>

        <div className="flex flex-col gap-1.5">
          <ShippingPill supplierName={product.supplierName} className="self-start" />
        </div>

        <div className="flex flex-col gap-0.5 text-xs border-t border-white/[0.06] pt-3 mt-auto">
          <span className="font-medium truncate text-amber-400">{product.supplierName}</span>
          <span className="text-zinc-500 italic">Visit supplier for full details</span>
        </div>

        {/* CTA + Compare + Save + Alert (matches eBay card row) */}
        <div className="flex flex-col sm:flex-row gap-2">
          <a
            href={product.url}
            target="_blank"
            rel="noopener sponsored noreferrer"
            style={{ whiteSpace: "nowrap", height: "44px" }}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold transition-colors duration-150"
            title={`Affiliate link — supports GOPARTARA at no extra cost`}
          >
            <ExternalLink size={14} /> View on {supplierShort} →
          </a>
          {onCompareToggle && (
            <button
              onClick={handleCompareClick}
              disabled={!isComparing && compareDisabled}
              aria-label="Compare this part"
              className={`min-w-[44px] min-h-[44px] sm:w-9 sm:h-9 sm:min-w-0 sm:min-h-0 rounded-xl border flex items-center justify-center transition-colors ${
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
              className="min-w-[44px] min-h-[44px] sm:w-9 sm:h-9 sm:min-w-0 sm:min-h-0 rounded-xl border border-white/[0.06] bg-[#1a1a1a] hover:bg-[#222] flex items-center justify-center transition-colors text-zinc-400 hover:text-white"
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
            supplierName={product.supplierName}
            partQuery={product.title}
            supplierUrl={product.url}
            currentPrice={numericPrice}
          />
        </div>
      </div>
    </div>
  );
};

export default AwinMerchantCard;
