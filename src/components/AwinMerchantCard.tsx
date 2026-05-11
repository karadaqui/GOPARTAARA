import { ExternalLink } from "lucide-react";
import SafeImage from "@/components/SafeImage";
import ShippingPill from "@/components/ShippingPill";
import type { AwinMerchantProduct } from "@/hooks/useAwinMerchantProducts";

interface Props {
  product: AwinMerchantProduct;
}

/**
 * Card variant used inside the unified search-results grid for Awin merchant
 * products (Dunford, Maxpeedingrods, Kohl, Tirendo, Autobandenmarkt, …).
 * Mirrors the eBay/GSP card sizing so the grid stays visually consistent.
 */
const AwinMerchantCard = ({ product }: Props) => {
  return (
    <a
      href={product.url}
      target="_blank"
      rel="noopener sponsored noreferrer"
      className="group rounded-3xl overflow-hidden border border-amber-800/40 bg-[#111]/60 backdrop-blur-sm hover:border-amber-600/60 hover:bg-[#111]/80 hover:shadow-2xl hover:shadow-black/60 hover:-translate-y-0.5 transition-[colors,transform] flex flex-col relative animate-fade-in"
    >
      {/* Affiliate ribbon — same height/style as the eBay condition bar */}
      <div
        className="h-7 flex items-center justify-center text-xs font-semibold tracking-wide uppercase border-b border-white/10"
        style={{ background: "#3f2d09", color: "#fbbf24" }}
      >
        Affiliate Partner
      </div>

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
        <span className="absolute top-2 left-2 flex items-center gap-1 bg-black/70 backdrop-blur-sm border border-amber-700/40 rounded-full px-2 py-0.5">
          <span className="text-[10px] font-semibold text-amber-400 truncate max-w-[160px]">
            {product.supplierName}
          </span>
        </span>
      </div>

      <div className="p-4 flex-1 flex flex-col gap-3">
        <p className="text-sm font-medium text-white leading-snug line-clamp-2 min-h-[2.5rem] group-hover:text-amber-400 transition-colors">
          {product.title}
        </p>

        <div>
          <span className="text-2xl font-bold text-amber-500">{product.price || "See price"}</span>
        </div>

        <div className="flex flex-col gap-1.5">
          {product.shipping && (
            <span className="inline-flex items-center gap-1 text-xs text-zinc-500">
              🚚 {product.shipping}
            </span>
          )}
          <ShippingPill supplierName={product.supplierName} className="self-start" />
        </div>

        <div className="flex items-center gap-1.5 text-xs text-zinc-500 border-t border-white/[0.06] pt-3 mt-auto">
          <span className="font-medium truncate text-amber-400">{product.supplierName}</span>
          <span className="text-zinc-600 ml-auto">Affiliate</span>
        </div>

        <span className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-amber-600 group-hover:bg-amber-500 text-white text-sm font-semibold transition-colors duration-150">
          <ExternalLink size={14} /> View on {product.supplierName}
        </span>
      </div>
    </a>
  );
};

export default AwinMerchantCard;
