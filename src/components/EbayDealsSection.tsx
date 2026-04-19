import { useState } from "react";
import { getActiveDeals, EBAY_ALL_DEALS_URL, isUKUser, type EbayDeal } from "@/data/ebayDeals";

const getDealIcon = (deal: EbayDeal): string => {
  if (deal.type === "all") return "🔥";
  if (deal.type === "tools") return "🧰";
  return deal.brand?.slice(0, 1).toUpperCase() ?? "⭐";
};

const DealCard = ({ deal }: { deal: EbayDeal }) => (
  <a
    href={deal.url}
    target="_blank"
    rel="noopener noreferrer"
    aria-label={`${deal.label} eBay UK deal`}
    className="group flex items-center gap-3 px-4 py-3 bg-card/60 border border-border/60 rounded-xl hover:border-border transition-all min-w-0"
  >
    <span className="text-xl flex-shrink-0">{getDealIcon(deal)}</span>
    <div className="flex-1 min-w-0">
      <p className="text-foreground text-sm font-semibold truncate">{deal.label}</p>
      <p className="text-muted-foreground text-xs truncate">{deal.discount}</p>
    </div>
    <span className="text-muted-foreground/60 group-hover:text-muted-foreground text-xs flex-shrink-0">→</span>
  </a>
);

const PREVIEW_COUNT = 2;

const EbayDealsSection = () => {
  const [expanded, setExpanded] = useState(false);
  const activeDeals = getActiveDeals();

  if (!isUKUser() || activeDeals.length === 0) return null;

  const visibleDeals = expanded ? activeDeals : activeDeals.slice(0, PREVIEW_COUNT);
  const hiddenCount = activeDeals.length - PREVIEW_COUNT;

  return (
    <section className="px-4 py-6">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-foreground/80">eBay UK</span>
            <span className="text-muted-foreground text-xs">Affiliate deals</span>
          </div>
          <a
            href={EBAY_ALL_DEALS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            View all →
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {visibleDeals.map((deal) => (
            <DealCard key={deal.id} deal={deal} />
          ))}
        </div>

        {hiddenCount > 0 && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="mt-3 w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-2"
          >
            {expanded ? "Show less ↑" : `Show all ${activeDeals.length} deals →`}
          </button>
        )}
      </div>
    </section>
  );
};

export default EbayDealsSection;
