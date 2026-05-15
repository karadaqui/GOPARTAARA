import { ExternalLink } from "lucide-react";
import SafeImage from "@/components/SafeImage";
import ShippingPill from "@/components/ShippingPill";
import { SUPPLIERS, getSupplierShipping, shippingPriority, type Supplier } from "@/data/suppliers";
import { useAwinMerchantProducts, type AwinMerchantProduct } from "@/hooks/useAwinMerchantProducts";

interface Props {
  searchQuery: string;
  countryCode: string;
}

// Parse vehicle make/model/year from product title (e.g. "Audi S5 B8/8T 3.0 V6 2007-2016 - ...")
const MAKES = ["Audi","BMW","Ford","Renault","Porsche","Volkswagen","VW","Vauxhall","Mini","Fiat","Mercedes","Mercedes-Benz","Peugeot","Citroen","Citroën","Skoda","Seat","Toyota","Honda","Nissan","Mazda","Subaru","Mitsubishi","Hyundai","Kia","Volvo","Jaguar","Land Rover","Range Rover","Lexus","Alfa Romeo","Opel"];
const parseVehicle = (title: string): string | null => {
  if (!title) return null;
  const make = MAKES.find((m) => new RegExp(`\\b${m.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}\\b`, "i").test(title));
  if (!make) return null;
  const yearMatch = title.match(/\b(19|20)\d{2}(?:\s*[-–]\s*(?:19|20)?\d{2,4})?\b/);
  const idx = title.toLowerCase().indexOf(make.toLowerCase());
  const after = title.slice(idx + make.length).split(/[-–|,]/)[0].trim();
  const model = after.split(/\s+/).slice(0, 4).join(" ");
  const yr = yearMatch ? ` ${yearMatch[0]}` : "";
  return `${make} ${model}${yr}`.trim();
};

// Awin merchants we render via the parametric feed (excluding suppliers that
// already have their own bespoke surface — eBay, Green Spark Plug, EV King,
// Amazon UK affiliate banner, and the existing tyre-cache feeds).
const FEED_MERCHANT_IDS = new Set<number>([67974, 8626, 16673, 16809, 8794, 104933, 30295]);

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
          {products.slice(0, 4).map((p: AwinMerchantProduct) => {
            const vehicle = parseVehicle(p.title);
            return (
            <a
              key={p.id}
              href={p.url}
              target="_blank"
              rel="noopener sponsored noreferrer"
              className="relative group rounded-2xl border border-white/[0.06] bg-zinc-900/40 hover:border-amber-600/40 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/30 transition-[colors,transform] flex flex-col overflow-hidden"
            >
              <div className="aspect-square bg-zinc-950/40 flex items-center justify-center overflow-hidden">
                {p.image ? (
                  <SafeImage src={p.image} alt={p.title} className="w-full h-full object-contain p-3" />
                ) : (
                  <span className="text-3xl">{supplier.flag}</span>
                )}
              </div>
              <div className="p-3 flex flex-col flex-1">
                <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                  <span className="text-[10px] font-semibold text-amber-400 truncate">
                    {p.supplierName}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                    New
                  </span>
                  {p.inStock !== false && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20 font-medium inline-flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-green-400" /> In stock
                    </span>
                  )}
                </div>
                <p className="text-sm font-semibold text-foreground mb-2 line-clamp-2 leading-snug min-h-[2.5rem] group-hover:text-amber-400 transition-colors">
                  {p.title}
                </p>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-lg font-bold text-foreground">{p.price || "See price"}</span>
                </div>
                <div className="flex flex-col gap-0.5 text-[11px] text-muted-foreground mb-2">
                  {vehicle && (
                    <div className="flex gap-1">
                      <span className="text-zinc-500">Fits:</span>
                      <span className="text-zinc-300 truncate">{vehicle}</span>
                    </div>
                  )}
                  {p.brand && (
                    <div className="flex gap-1">
                      <span className="text-zinc-500">Brand:</span>
                      <span className="text-zinc-300 truncate">{p.brand}</span>
                    </div>
                  )}
                  {p.category && (
                    <div className="flex gap-1">
                      <span className="text-zinc-500">Category:</span>
                      <span className="text-zinc-300 truncate">{p.category}</span>
                    </div>
                  )}
                  <div className="flex gap-1">
                    <span className="text-zinc-500">Part #:</span>
                    <span className="text-zinc-300 truncate font-mono">{p.id.split('-').slice(1).join('-') || p.id}</span>
                  </div>
                </div>
                <ShippingPill supplierName={supplier.name} className="mb-2 self-start" />
                <p className="text-[11px] text-muted-foreground mb-3">{p.shipping}</p>
                <span
                  style={{ whiteSpace: "nowrap", height: "44px" }}
                  className="mt-auto flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold transition-colors duration-150"
                >
                  <ExternalLink size={14} /> View →
                </span>
              </div>
            </a>
            );
          })}
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
