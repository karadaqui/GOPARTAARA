import { getActiveDeals, EBAY_ALL_DEALS_URL, isUKUser, type EbayDeal } from "@/data/ebayDeals";

const getDealIcon = (deal: EbayDeal): string => {
  if (deal.type === "all") return "🔥";
  if (deal.type === "tools") return "🧰";
  return deal.brand?.slice(0, 1).toUpperCase() ?? "⭐";
};

const EbayDealsSection = () => {
  const activeDeals = getActiveDeals();

  if (!isUKUser() || activeDeals.length === 0) return null;

  return (
    <section className="py-6 px-4 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">eBay UK</span>
          <span className="text-muted-foreground/60 text-xs">·</span>
          <span className="text-muted-foreground/60 text-xs">Affiliate deals</span>
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

      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {activeDeals.map((deal) => (
          <a
            key={deal.id}
            href={deal.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${deal.label} eBay UK deal`}
            className="flex-shrink-0 flex items-center gap-2.5 px-3 py-2.5 bg-card/60 border border-border/50 rounded-xl hover:border-border hover:bg-card transition-colors group min-w-[160px]"
          >
            <span className="text-base">{getDealIcon(deal)}</span>
            <div className="min-w-0">
              <p className="text-foreground text-xs font-semibold truncate">{deal.label}</p>
              <p className="text-muted-foreground text-[10px] truncate">{deal.discount}</p>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
};

export default EbayDealsSection;
