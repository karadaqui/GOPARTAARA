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

const AmazonDealsSection = () => {
  if (!isUKUser()) return null;

  return (
    <section className="py-6 px-4 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Amazon UK</span>
          <span className="text-muted-foreground/60 text-xs">·</span>
          <span className="text-muted-foreground/60 text-xs">Affiliate deals</span>
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

      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {AMAZON_UK_DEALS.map((deal) => (
          <a
            key={deal.id}
            href={deal.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${deal.label} Amazon UK deal`}
            className="flex-shrink-0 flex items-center gap-2.5 px-3 py-2.5 bg-card/60 border border-border/50 rounded-xl hover:border-border hover:bg-card transition-colors group min-w-[160px]"
          >
            <span className="text-base">{deal.icon}</span>
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

export default AmazonDealsSection;
