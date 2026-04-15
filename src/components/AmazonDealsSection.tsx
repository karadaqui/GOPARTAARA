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
    <section className="px-4 pb-10">
      <div className="mx-auto max-w-7xl rounded-[28px] border border-border/70 bg-card/30 p-4 backdrop-blur-xl md:p-6">
        <div className="mb-5 flex flex-col gap-4 md:mb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-secondary/70 px-3 py-1 text-[11px] font-semibold text-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Amazon UK affiliate deals
            </div>
            <h2 className="mt-3 font-display text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              Amazon Automotive Deals
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Accessories, fluids, tools and electronics.
            </p>
          </div>

          <a
            href={AMAZON_ALL_DEALS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center rounded-xl border border-border/70 bg-secondary/70 px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:border-primary/35 hover:text-primary lg:w-auto"
          >
            All Amazon Deals →
          </a>
        </div>

        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4 xl:gap-4">
          {AMAZON_UK_DEALS.map((deal) => (
            <a
              key={deal.id}
              href={deal.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${deal.label} Amazon UK deal`}
              className="group flex h-full min-h-[176px] min-w-0 flex-col rounded-2xl border border-border/70 bg-card/85 p-4 transition-all duration-200 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl border border-border/70 bg-background/80 text-lg">
                {deal.icon}
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
                    <p className="text-[11px] font-semibold text-primary">{deal.discount}</p>
                    <p className="text-[10px] text-muted-foreground">Amazon UK affiliate</p>
                  </div>
                  <span className="shrink-0 text-xs font-semibold text-primary transition-transform group-hover:translate-x-0.5">
                    Shop →
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>

        <p className="mt-4 text-center text-[11px] text-muted-foreground">
          Amazon UK affiliate links — we earn a small commission at no extra cost to you. tag: {AMAZON_TAG}
        </p>
      </div>
    </section>
  );
};

export default AmazonDealsSection;
