import { X, Scale, Package, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

const FlagImg = ({ advertiserId }: { advertiserId?: string }) => {
  const flagMap: Record<string, string> = {
    '4118':  '1f1ec-1f1e7', // 🇬🇧 GB
    '12715': '1f30d',       // 🌍 Globe
    '10499': '1f1ea-1f1f8', // 🇪🇸 ES
    '12716': '1f1ee-1f1f9', // 🇮🇹 IT
    '10747': '1f1ea-1f1ea', // 🇪🇪 EE
  }
  const code = flagMap[advertiserId || ''] || '1f30d'
  return (
    <img 
      src={`https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/${code}.png`}
      alt="flag"
      width={16}
      height={16}
      className="inline-block"
      loading="lazy"
    />
  )
}

export interface TyreCompareItem {
  id: string;
  title: string;
  price: string; // already includes currency symbol (£ or €)
  image?: string;
  url?: string;
  brand?: string;
  shipping?: string;
  supplierName?: string;
  advertiserId?: string;
  season: "summer" | "winter" | "allseason" | "unknown";
}

const SHIPS_TO: Record<string, string> = {
  "4118": "🇬🇧 UK + 35 countries",
  "12715": "🌍 64 countries",
  "10499": "🇪🇸 Spain only",
  "12716": "🇮🇹 Italy only",
  "10747": "🇪🇪 Estonia, Latvia, Lithuania",
};

const seasonLabel = (s: TyreCompareItem["season"]) => {
  if (s === "summer") return "☀️ Summer";
  if (s === "winter") return "❄️ Winter";
  if (s === "allseason") return "🌦️ All Season";
  return "—";
};

interface TyreCompareModalProps {
  items: TyreCompareItem[];
  onRemove: (id: string) => void;
  onClose: () => void;
}

export const TyreCompareModal = ({ items, onRemove, onClose }: TyreCompareModalProps) => {
  if (items.length < 2) return null;

  // Find cheapest by parsing numeric value out of price string
  const numericPrices = items
    .map((i) => parseFloat((i.price || "0").replace(/[^0-9.]/g, "")))
    .filter((n) => !isNaN(n) && n > 0);
  const cheapest = numericPrices.length ? Math.min(...numericPrices) : null;

  const rows: { label: string; render: (item: TyreCompareItem) => React.ReactNode; key: string }[] = [
    {
      key: "image",
      label: "Image",
      render: (item) =>
        item.image ? (
          <img src={item.image} alt="" className="w-20 h-20 sm:w-24 sm:h-24 object-contain rounded-lg bg-secondary/50 mx-auto" />
        ) : (
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg bg-secondary/50 flex items-center justify-center mx-auto">
            <Package size={24} className="text-muted-foreground" />
          </div>
        ),
    },
    {
      key: "title",
      label: "Title",
      render: (item) => <span className="text-xs sm:text-sm font-medium leading-tight line-clamp-3">{item.title}</span>,
    },
    {
      key: "price",
      label: "Price",
      render: (item) => (
        <span className="text-base sm:text-lg font-bold text-primary">{item.price}</span>
      ),
    },
    {
      key: "season",
      label: "Season",
      render: (item) => <span className="text-xs font-medium">{seasonLabel(item.season)}</span>,
    },
    {
      key: "brand",
      label: "Brand",
      render: (item) =>
        item.brand ? (
          <span className="text-xs font-medium">{item.brand}</span>
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        ),
    },
    {
      key: "supplier",
      label: "Supplier",
      render: (item) => (
        <span className="text-xs">{item.supplierName || item.advertiserId || "—"}</span>
      ),
    },
    {
      key: "ships",
      label: "Ships to",
      render: (item) => {
        const text = item.advertiserId ? SHIPS_TO[item.advertiserId] : null;
        return text ? (
          <span className="text-xs">{text}</span>
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        );
      },
    },
    {
      key: "delivery",
      label: "Delivery",
      render: (item) =>
        item.shipping ? (
          <span className="text-xs">{item.shipping}</span>
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        ),
    },
    {
      key: "condition",
      label: "Condition",
      render: () => (
        <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400">
          New
        </span>
      ),
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4" onClick={onClose}>
      <div className="glass-strong rounded-2xl p-4 sm:p-6 max-w-4xl w-full max-h-[85vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-xl font-bold flex items-center gap-2">
            <Scale size={20} className="text-primary" />
            Compare Tyres
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
                <tr key={row.key} className="border-t border-border/30">
                  <td className="text-xs font-medium text-muted-foreground p-2 sm:p-3 align-middle">{row.label}</td>
                  {items.map((item) => {
                    const itemPriceNum = parseFloat((item.price || "0").replace(/[^0-9.]/g, ""));
                    const isCheapest =
                      row.key === "price" && cheapest != null && itemPriceNum === cheapest;
                    return (
                      <td
                        key={item.id}
                        className={`p-2 sm:p-3 text-center align-middle ${
                          isCheapest ? "bg-emerald-500/10 rounded-lg" : ""
                        }`}
                      >
                        {row.render(item)}
                      </td>
                    );
                  })}
                </tr>
              ))}
              <tr className="border-t border-border/30">
                <td className="text-xs font-medium text-muted-foreground p-2 sm:p-3">Link</td>
                {items.map((item) => (
                  <td key={item.id} className="p-2 sm:p-3 text-center">
                    {item.url ? (
                      <a href={item.url} target="_blank" rel="noopener noreferrer sponsored">
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

export default TyreCompareModal;
