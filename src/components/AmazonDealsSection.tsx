import { useState } from "react";
import { isUKUser } from "@/data/ebayDeals";

interface AmazonDeal {
  id: string;
  label: string;
  discount: string;
  description: string;
  icon: string;
  url: string;
}

const AMAZON_TAG = "gopartara-21";

const withAmazonTag = (baseUrl: string) =>
  `${baseUrl}${baseUrl.includes("?") ? "&" : "?"}tag=${AMAZON_TAG}`;

const AMAZON_UK_DEALS: AmazonDeal[] = [
  {
    id: "amazon-accessories",
    label: "Car Accessories",
    discount: "Shop today's deals",
    description: "Mounts, organizers, seat covers & more",
    icon: "🚗",
    url: withAmazonTag("https://www.amazon.co.uk/b?_encoding=UTF8&node=301308031"),
  },
  {
    id: "amazon-oils-fluids",
    label: "Oils & Fluids",
    discount: "Shop today's deals",
    description: "Engine oil, coolant, brake fluid & more",
    icon: "🛢️",
    url: withAmazonTag("https://www.amazon.co.uk/b?_encoding=UTF8&node=301315031"),
  },
  {
    id: "amazon-tools",
    label: "Tools & Equipment",
    discount: "Shop today's deals",
    description: "Garage tools, jacks, diagnostic kits",
    icon: "🔧",
    url: withAmazonTag("https://www.amazon.co.uk/b?_encoding=UTF8&node=2486235031"),
  },
  {
    id: "amazon-electronics",
    label: "Vehicle Electronics",
    discount: "Shop today's deals",
    description: "Dash cams, GPS, CarPlay adapters & more",
    icon: "📱",
    url: withAmazonTag("https://www.amazon.co.uk/b?_encoding=UTF8&node=3013843031"),
  },
];

const AMAZON_ALL_DEALS_URL = withAmazonTag("https://www.amazon.co.uk/b?_encoding=UTF8&node=248877031");

const PREVIEW_COUNT = 2;

const DealCard = ({ deal }: { deal: AmazonDeal }) => (
  <a
    href={deal.url}
    target="_blank"
    rel="noopener noreferrer"
    aria-label={`${deal.label} Amazon UK deal`}
    className="group flex items-center gap-3 px-4 py-3 bg-card/60 border border-border/60 rounded-xl hover:border-border transition-all min-w-0"
  >
    <span className="text-xl flex-shrink-0">{deal.icon}</span>
    <div className="flex-1 min-w-0">
      <p className="text-foreground text-sm font-semibold truncate">{deal.label}</p>
      <p className="text-muted-foreground text-xs truncate">{deal.discount}</p>
    </div>
    <span className="text-muted-foreground/60 group-hover:text-muted-foreground text-xs flex-shrink-0">→</span>
  </a>
);

const AmazonDealsSection = () => {
  const [expanded, setExpanded] = useState(false);

  if (!isUKUser()) return null;

  const visibleDeals = expanded ? AMAZON_UK_DEALS : AMAZON_UK_DEALS.slice(0, PREVIEW_COUNT);
  const hiddenCount = AMAZON_UK_DEALS.length - PREVIEW_COUNT;

  return (
    <section className="px-4 py-6">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-foreground/80">Amazon UK</span>
            <span className="text-muted-foreground text-xs">Affiliate deals</span>
          </div>
          <a
            href={AMAZON_ALL_DEALS_URL}
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
            {expanded ? "Show less ↑" : `Show all ${AMAZON_UK_DEALS.length} deals →`}
          </button>
        )}
      </div>
    </section>
  );
};

export default AmazonDealsSection;
