import { getActiveDeals, isUKUser, type EbayDeal } from "@/data/ebayDeals";

const getDealMeta = (deal: EbayDeal) => {
  if (deal.type === "all") {
    return {
      icon: "🔥",
      badge: "All Deals",
      cardClassName: "border-primary/40 bg-primary/10 hover:border-primary hover:bg-primary/15",
      badgeClassName: "border-primary/30 bg-primary/10 text-primary",
      accentClassName: "text-primary",
    };
  }

  if (deal.type === "tools") {
    return {
      icon: "🧰",
      badge: "Tools",
      cardClassName: "border-border/70 bg-secondary/70 hover:border-primary/35 hover:bg-secondary",
      badgeClassName: "border-border/70 bg-background/80 text-foreground",
      accentClassName: "text-primary",
    };
  }

  return {
    icon: deal.brand?.slice(0, 1).toUpperCase() ?? "⭐",
    badge: deal.brand ?? "Brand",
    cardClassName: "border-border/70 bg-card/85 hover:border-primary/35 hover:bg-card",
    badgeClassName: "border-border/70 bg-background/80 text-foreground",
    accentClassName: "text-primary",
  };
};

const DealCard = ({ deal }: { deal: EbayDeal }) => {
  const { icon, badge, cardClassName, badgeClassName, accentClassName } = getDealMeta(deal);

  return (
    <a
      href={deal.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${deal.label} eBay UK deal`}
      className={`group flex h-full min-h-[176px] min-w-0 flex-col rounded-2xl border p-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${cardClassName}`}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-border/70 bg-background/80 text-sm font-black text-primary">
          {icon}
        </div>
        <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-wide ${badgeClassName}`}>
          {badge}
        </span>
      </div>

      <div className="flex flex-1 flex-col">
        <p className="mb-1 text-sm font-bold leading-snug text-foreground transition-colors group-hover:text-primary line-clamp-2">
          {deal.label}
        </p>
        <p className="mb-4 text-[11px] leading-5 text-muted-foreground line-clamp-2">
          {deal.description}
        </p>

        <div className="mt-auto flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className={`text-[11px] font-semibold ${accentClassName}`}>{deal.discount}</p>
            <p className="text-[10px] text-muted-foreground">eBay UK affiliate deal</p>
          </div>
          <span className="shrink-0 text-xs font-semibold text-primary transition-transform group-hover:translate-x-0.5">
            View deal →
          </span>
        </div>
      </div>
    </a>
  );
};

const EbayDealsSection = () => {
  const activeDeals = getActiveDeals();

  if (!isUKUser() || activeDeals.length === 0) return null;

  return (
    <section className="px-4 py-8 md:py-10">
      <div className="mx-auto max-w-7xl rounded-[28px] border border-border/70 bg-card/40 p-4 backdrop-blur-xl md:p-6">
        <div className="mb-5 flex flex-col gap-4 md:mb-6">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            eBay UK affiliate deals
          </div>

          <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                eBay Motors Deals
              </h2>
              <p className="mt-1 text-sm text-muted-foreground font-sans">
                BMW, Vauxhall, MINI, Ford, Renault, Dacia + tools + all deals.
              </p>
            </div>
            <p className="text-xs font-medium text-muted-foreground">
              {activeDeals.length} verified affiliate links
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5 xl:gap-4">
          {activeDeals.map((deal) => (
            <DealCard key={deal.id} deal={deal} />
          ))}
        </div>

        <p className="mt-4 text-center text-[11px] text-muted-foreground">
          Affiliate links — we may earn a small commission at no extra cost to you.
        </p>
      </div>
    </section>
  );
};

export default EbayDealsSection;
