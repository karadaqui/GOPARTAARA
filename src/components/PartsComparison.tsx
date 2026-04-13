import { X, Scale, Star, MapPin, Truck, Package, ExternalLink, Zap } from "lucide-react";
import { buildEbayAffiliateUrl } from "@/lib/ebayAffiliate";
import { Button } from "@/components/ui/button";
import VerifiedSellerBadge from "@/components/badges/VerifiedSellerBadge";
import { useLocale } from "@/contexts/LocaleContext";

export interface CompareItem {
  id: string;
  title: string;
  price: number | null;
  condition?: string;
  sellerName?: string;
  sellerRating?: number;
  sellerTier?: string;
  shipping?: string;
  freeShipping?: boolean;
  shippingCost?: number;
  location?: string;
  itemCountry?: string;
  category?: string;
  compatibleVehicles?: string[];
  url?: string;
  imageUrl?: string;
  source: "ebay" | "marketplace";
}

interface CompareBarProps {
  items: CompareItem[];
  onOpen: () => void;
  onClear: () => void;
}

export const CompareBar = ({ items, onOpen, onClear }: CompareBarProps) => {
  if (items.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="glass-strong rounded-2xl px-5 py-3 flex items-center gap-4 shadow-2xl shadow-background/60 border border-primary/20">
        <Scale size={18} className="text-primary shrink-0" />
        <div className="flex items-center gap-2">
          {items.map((item) => (
            <div key={item.id} className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-secondary overflow-hidden border border-border/50">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center"><Package size={12} className="text-muted-foreground" /></div>
              )}
            </div>
          ))}
          {Array.from({ length: 3 - items.length }).map((_, i) => (
            <div key={`empty-${i}`} className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg border border-dashed border-border/40" />
          ))}
        </div>
        <Button size="sm" onClick={onOpen} disabled={items.length < 2} className="rounded-xl gap-1.5 text-xs sm:text-sm">
          <Scale size={14} />
          Compare ({items.length})
        </Button>
        <button onClick={onClear} className="text-muted-foreground hover:text-foreground transition-colors">
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

interface CompareModalProps {
  items: CompareItem[];
  onRemove: (id: string) => void;
  onClose: () => void;
}

export const CompareModal = ({ items, onRemove, onClose }: CompareModalProps) => {
  const locale = useLocale();

  if (items.length < 2) return null;

  const rows: { label: string; render: (item: CompareItem) => React.ReactNode }[] = [
    {
      label: "Image",
      render: (item) => item.imageUrl ? (
        <img src={item.imageUrl} alt="" className="w-20 h-20 sm:w-24 sm:h-24 object-contain rounded-lg bg-secondary/50 mx-auto" />
      ) : (
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg bg-secondary/50 flex items-center justify-center mx-auto">
          <Package size={24} className="text-muted-foreground" />
        </div>
      ),
    },
    {
      label: "Title",
      render: (item) => <span className="text-xs sm:text-sm font-medium leading-tight line-clamp-3">{item.title}</span>,
    },
    {
      label: "Price",
      render: (item) => {
        if (item.price == null) return <span className="text-muted-foreground text-xs">N/A</span>;
        const conv = locale.convertPrice(item.price);
        return (
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-base sm:text-lg font-bold text-primary">{locale.formatPrice(item.price)}</span>
            {conv && <span className="text-[10px] text-muted-foreground">≈ {conv.symbol}{conv.converted.toFixed(2)}</span>}
          </div>
        );
      },
    },
    {
      label: "Condition",
      render: (item) => item.condition ? (
        <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${
          item.condition === "New" ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
        }`}>
          {item.condition === "New" ? locale.t("new") : item.condition === "Used" ? locale.t("used") : locale.t("not_specified")}
        </span>
      ) : <span className="text-muted-foreground text-xs">—</span>,
    },
    {
      label: "Seller",
      render: (item) => (
        <div className="flex flex-col items-center gap-1">
          <span className="text-xs font-medium">{item.sellerName || "—"}</span>
          {item.sellerTier === "pro" && <VerifiedSellerBadge variant="pro_seller" size="sm" />}
        </div>
      ),
    },
    {
      label: "Rating",
      render: (item) => item.sellerRating != null ? (
        <span className="flex items-center gap-1 text-xs text-amber-400 justify-center">
          <Star size={12} className="fill-amber-400" />
          {item.sellerRating.toFixed(0)}%
        </span>
      ) : <span className="text-muted-foreground text-xs">—</span>,
    },
    {
      label: locale.t("free_shipping").includes("P&P") ? "Shipping" : "Shipping",
      render: (item) => {
        if (item.freeShipping) return <span className="text-xs text-emerald-400 font-medium flex items-center gap-1 justify-center"><Truck size={12} /> {locale.t("free_shipping")}</span>;
        if (item.shippingCost != null && item.shippingCost > 0) {
          const conv = locale.convertPrice(item.shippingCost);
          return (
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-xs flex items-center gap-1 justify-center"><Truck size={12} /> {locale.formatPrice(item.shippingCost)}</span>
              {conv && <span className="text-[10px] text-muted-foreground">≈ {conv.symbol}{conv.converted.toFixed(2)}</span>}
            </div>
          );
        }
        if (item.shipping) return <span className="text-xs">{item.shipping}</span>;
        return <span className="text-muted-foreground text-xs">—</span>;
      },
    },
    {
      label: `${locale.t("ships_to")} ${locale.getCountryName(locale.locationCountry)}`,
      render: (item) => {
        // If item is from user's location country, it ships
        const sameCountry = item.itemCountry === locale.locationCountry;
        if (item.freeShipping && sameCountry) {
          return <span className="text-xs text-emerald-400 font-medium flex items-center gap-1 justify-center"><Zap size={12} /> Free ⚡</span>;
        }
        // We assume shipsToUK-type data; for now show yes for same country
        return <span className="text-xs text-emerald-400 font-medium flex items-center justify-center">✅ Yes</span>;
      },
    },
    {
      label: "Location",
      render: (item) => item.location ? (
        <span className="text-xs flex items-center gap-1 justify-center"><MapPin size={11} /> {item.location}</span>
      ) : <span className="text-muted-foreground text-xs">—</span>,
    },
    {
      label: "Category",
      render: (item) => item.category ? (
        <span className="text-xs px-2 py-0.5 rounded-md bg-secondary border border-border">{item.category}</span>
      ) : <span className="text-muted-foreground text-xs">—</span>,
    },
    ...(items.some(i => i.compatibleVehicles?.length) ? [{
      label: "Vehicles",
      render: (item: CompareItem) => item.compatibleVehicles?.length ? (
        <span className="text-xs text-muted-foreground leading-tight">{item.compatibleVehicles.slice(0, 3).join(", ")}</span>
      ) : <span className="text-muted-foreground text-xs">—</span>,
    }] : []),
  ];

  // Find cheapest
  const prices = items.map(i => i.price).filter((p): p is number => p != null && p > 0);
  const cheapest = prices.length ? Math.min(...prices) : null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4" onClick={onClose}>
      <div className="glass-strong rounded-2xl p-4 sm:p-6 max-w-4xl w-full max-h-[85vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-xl font-bold flex items-center gap-2">
            <Scale size={20} className="text-primary" />
            Compare Parts
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose} className="rounded-xl">
            <X size={18} />
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left text-xs font-medium text-muted-foreground p-2 w-24 sm:w-28" />
                {items.map((item) => (
                  <th key={item.id} className="p-2 text-center min-w-[120px] sm:min-w-[160px]">
                    <button
                      onClick={() => onRemove(item.id)}
                      className="text-[10px] text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1 mx-auto mb-1"
                    >
                      <X size={10} /> Remove
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label} className="border-t border-border/30">
                  <td className="text-xs font-medium text-muted-foreground p-2 sm:p-3 align-middle">{row.label}</td>
                  {items.map((item) => (
                    <td
                      key={item.id}
                      className={`p-2 sm:p-3 text-center align-middle ${
                        row.label === "Price" && cheapest != null && item.price === cheapest
                          ? "bg-emerald-500/10 rounded-lg"
                          : ""
                      }`}
                    >
                      {row.render(item)}
                    </td>
                  ))}
                </tr>
              ))}
              {/* View link row */}
              <tr className="border-t border-border/30">
                <td className="text-xs font-medium text-muted-foreground p-2 sm:p-3">Link</td>
                {items.map((item) => (
                  <td key={item.id} className="p-2 sm:p-3 text-center">
                    {item.url ? (
                      <a href={item.source === "ebay" ? buildEbayAffiliateUrl(item.url) : item.url} target="_blank" rel="noopener noreferrer" title="Buying through this link supports PARTARA at no extra cost to you 💙">
                        <Button size="sm" className="rounded-xl gap-1.5 text-xs">
                          <ExternalLink size={12} />
                          View
                        </Button>
                      </a>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
