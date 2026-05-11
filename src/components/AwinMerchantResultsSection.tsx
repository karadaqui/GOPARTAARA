import { ExternalLink } from "lucide-react";
import SafeImage from "@/components/SafeImage";
import ShippingPill from "@/components/ShippingPill";
import { SUPPLIERS, getSupplierShipping, shippingPriority, type Supplier } from "@/data/suppliers";
import { useAwinMerchantProducts, type AwinMerchantProduct } from "@/hooks/useAwinMerchantProducts";

interface Props {
  searchQuery: string;
  countryCode: string;
}

// Awin merchants we render via the parametric feed (excluding suppliers that
// already have their own bespoke surface — eBay, Green Spark Plug, EV King,
// Amazon UK affiliate banner, and the existing tyre-cache feeds).
const FEED_MERCHANT_IDS = new Set<number>([67974, 8626, 16673, 16809, 8794]);

const MerchantBlock = ({
  supplier,
  query,
  countryCode,
}: {
  supplier: Supplier;
  query: string;
  countryCode: string;
}) => {
  const { products, loading } = useAwinMerchantProducts(
    String(supplier.mid),
    query,
    true,
  );

  if (!loading && products.length === 0) return null;

  const shipInfo = getSupplierShipping(supplier);

  return (
    <section className="mb-8 animate-fade-in" aria-label={`${supplier.name} results`}>
      <div className="flex items-end justify-between mb-3 gap-3 flex-wrap">
        <div>
          <p className="text-[11px] font-semibold tracking-widest uppercase text-amber-500/70 mb-1">
            {supplier.flag} {shipInfo.label} · AFFILIATE PARTNER
          </p>
          <h3 className="text-base font-bold text-foreground">
            {supplier.name}
          </h3>
        </div>
        <a
          href={supplier.affiliateUrl || supplier.baseUrl}
          target="_blank"
          rel="noopener sponsored noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-amber-700/40 bg-amber-950/20 text-amber-400 hover:text-amber-300 hover:border-amber-500/60 text-xs font-semibold transition-colors"
        >
          Browse {supplier.name} <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border border-white/[0.06] bg-zinc-900/40 h-56 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
          {products.slice(0, 4).map((p: AwinMerchantProduct) => (
            <a
              key={p.id}
              href={p.url}
              target="_blank"
              rel="noopener sponsored noreferrer"
              className="relative group rounded-2xl border border-white/[0.06] bg-zinc-900/40 hover:border-amber-600/40 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/30 transition-[colors,transform] flex flex-col overflow-hidden"
            >
              <ShippingBadge supplier={supplier} countryCode={countryCode} />
              <div className="aspect-square bg-zinc-950/40 flex items-center justify-center overflow-hidden">
                {p.image ? (
                  <SafeImage src={p.image} alt={p.title} className="w-full h-full object-contain p-3" />
                ) : (
                  <span className="text-3xl">{supplier.flag}</span>
                )}
              </div>
              <div className="p-3 flex flex-col flex-1">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[10px] font-semibold text-amber-400 truncate">
                    {p.supplierName}
                  </span>
                </div>
                <p className="text-sm font-semibold text-foreground mb-2 line-clamp-2 leading-snug min-h-[2.5rem] group-hover:text-amber-400 transition-colors">
                  {p.title}
                </p>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-lg font-bold text-foreground">{p.price || "See price"}</span>
                </div>
                <p className="text-[11px] text-muted-foreground mb-3">{p.shipping}</p>
                <span className="mt-auto block w-full text-center py-2 bg-amber-600/20 group-hover:bg-amber-600/30 border border-amber-700/30 text-amber-400 text-xs font-semibold rounded-xl transition-colors">
                  View on {supplier.name} →
                </span>
              </div>
            </a>
          ))}
        </div>
      )}
      <p className="text-[10px] text-muted-foreground mt-2 text-center">
        Affiliate link — we may earn a small commission at no extra cost to you.
      </p>
    </section>
  );
};

const AwinMerchantResultsSection = ({ searchQuery, countryCode }: Props) => {
  if (!searchQuery?.trim()) return null;

  // Show every active feed merchant; sort so ships-to-country first,
  // then worldwide, then everything else. Empty merchants self-hide.
  const merchants = SUPPLIERS
    .filter((s) => s.live !== false && !!s.mid && FEED_MERCHANT_IDS.has(s.mid))
    .slice()
    .sort((a, b) => shippingPriority(a, countryCode) - shippingPriority(b, countryCode));

  if (merchants.length === 0) return null;

  return (
    <div className="mt-6">
      {merchants.map((s) => (
        <MerchantBlock key={s.id} supplier={s} query={searchQuery} countryCode={countryCode} />
      ))}
    </div>
  );
};

export default AwinMerchantResultsSection;
