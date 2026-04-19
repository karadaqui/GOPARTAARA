import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import BackToTop from "@/components/BackToTop";

// ───────── eBay (eBay Partner Network) ─────────
const ebayAff = (url: string) => {
  const base = "https://rover.ebay.com/rover/1/710-53481-19255-0/1";
  return `${base}?mpre=${encodeURIComponent(url)}&campid=5339148333&customid=partara&toolid=10049`;
};

const EBAY_DEALS = [
  {
    icon: "🔧",
    title: "Car Parts & Accessories",
    subtitle: "Brakes, filters, exhausts & more",
    url: affUrl("https://www.ebay.co.uk/deals/automotive/car-parts-accessories"),
    badge: "Top category",
  },
  {
    icon: "🏎️",
    title: "Garage Equipment & Tools",
    subtitle: "Jacks, compressors, testers",
    url: affUrl("https://www.ebay.co.uk/deals/automotive/garage-equipment-tools"),
    badge: "Up to 50% off",
  },
  {
    icon: "📡",
    title: "Car Electronics",
    subtitle: "Dash cams, GPS, stereos & CarPlay",
    url: affUrl("https://www.ebay.co.uk/deals/automotive/car-electronics"),
    badge: "Hot deals",
  },
  {
    icon: "🛞",
    title: "Wheels & Tyres",
    subtitle: "Alloys, winter tyres & more",
    url: affUrl("https://www.ebay.co.uk/deals/automotive/wheels-tyres"),
    badge: "Big savings",
  },
  {
    icon: "🛢️",
    title: "Oils & Fluids",
    subtitle: "Engine oil, coolant, brake fluid",
    url: affUrl("https://www.ebay.co.uk/deals/automotive/oils-fluids"),
    badge: "Essentials",
  },
  {
    icon: "🚗",
    title: "Car Care, Utility & Trailers",
    subtitle: "Cleaning, covers, towing & more",
    url: affUrl("https://www.ebay.co.uk/deals/automotive/car-care-utility-trailers"),
    badge: "New deals",
  },
  {
    icon: "⚡",
    title: "Tuning & Styling",
    subtitle: "Performance parts & styling kits",
    url: affUrl("https://www.ebay.co.uk/deals/automotive/tuning-styling"),
    badge: "Performance",
  },
  {
    icon: "👕",
    title: "Apparel & Accessories",
    subtitle: "Driving gear, helmets & clothing",
    url: affUrl("https://www.ebay.co.uk/deals/automotive/apparel-accessories"),
    badge: "Style",
  },
  {
    icon: "🏍️",
    title: "Motorcycle Parts",
    subtitle: "Bike parts, helmets & gear",
    url: affUrl("https://www.ebay.co.uk/deals/automotive/motorcycle-parts"),
    badge: "Bikers",
  },
  {
    icon: "⛺",
    title: "Camping & Caravan Parts",
    subtitle: "Awnings, accessories & spares",
    url: affUrl("https://www.ebay.co.uk/deals/automotive/camping-caravan-parts"),
    badge: "Adventure",
  },
];

const EBAY_ALL_URL = affUrl("https://www.ebay.co.uk/deals/automotive");

// ───────── Amazon ─────────
const AMAZON_TAG = "gopartara-21";
const withAmazonTag = (baseUrl: string) =>
  `${baseUrl}${baseUrl.includes("?") ? "&" : "?"}tag=${AMAZON_TAG}`;

const AMAZON_DEALS = [
  {
    id: "amazon-accessories",
    title: "Car Accessories",
    subtitle: "Mounts, organizers, seat covers & more",
    icon: "🚗",
    url: withAmazonTag("https://www.amazon.co.uk/b?_encoding=UTF8&node=301308031"),
  },
  {
    id: "amazon-oils-fluids",
    title: "Oils & Fluids",
    subtitle: "Engine oil, coolant, brake fluid & more",
    icon: "🛢️",
    url: withAmazonTag("https://www.amazon.co.uk/b?_encoding=UTF8&node=301315031"),
  },
  {
    id: "amazon-tools",
    title: "Tools & Equipment",
    subtitle: "Garage tools, jacks, diagnostic kits",
    icon: "🔧",
    url: withAmazonTag("https://www.amazon.co.uk/b?_encoding=UTF8&node=2486235031"),
  },
  {
    id: "amazon-electronics",
    title: "Vehicle Electronics",
    subtitle: "Dash cams, GPS, CarPlay adapters & more",
    icon: "📱",
    url: withAmazonTag("https://www.amazon.co.uk/b?_encoding=UTF8&node=3013843031"),
  },
];
const AMAZON_ALL_URL = withAmazonTag(
  "https://www.amazon.co.uk/b?_encoding=UTF8&node=248877031",
);

const Deals = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Deals & Savings — Curated UK Car Parts Deals | GOPARTARA"
        description="Curated affiliate deals from the UK's most trusted automotive retailers — eBay UK, Amazon UK and classic car part specialists. Updated daily."
        path="/deals"
      />
      <Navbar />

      <main className="pt-16">
        {/* HERO */}
        <section className="relative overflow-hidden pt-24 pb-16 px-4">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-primary text-xs font-semibold tracking-wider uppercase">
                Updated Daily
              </span>
            </div>
            <h1 className="text-5xl sm:text-6xl font-black text-foreground mb-4 tracking-tight">
              Deals &amp; Savings
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Curated affiliate deals from the UK's most trusted automotive retailers.
              Handpicked daily.
            </p>
          </div>
        </section>

        {/* SECTION 1 — eBay UK */}
        <section className="px-4 pb-16 max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <img
                src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f4b0.png"
                width={32}
                height={32}
                loading="lazy"
                alt="deals"
                className="rounded-xl"
              />
              <div>
                <h2 className="text-foreground font-bold text-lg">eBay UK</h2>
                <p className="text-muted-foreground text-xs">Deals & Savings · Updated daily</p>
              </div>
            </div>
            <a
              href={EBAY_ALL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 group"
            >
              View all
              <span className="group-hover:translate-x-0.5 transition-transform">→</span>
            </a>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {EBAY_DEALS.map((deal) => (
              <a
                key={deal.title}
                href={deal.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${deal.title} — eBay UK deal`}
                className="group relative flex flex-col p-4 bg-card border border-border hover:border-border/80 hover:bg-card/80 rounded-2xl transition-all duration-200 hover:shadow-xl hover:shadow-background/40 hover:-translate-y-0.5"
              >
                <div className="absolute top-3 right-3">
                  <span className="text-[10px] bg-primary/15 border border-primary/30 text-primary rounded-full px-2 py-0.5 font-bold">
                    {deal.badge}
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-secondary border border-border flex items-center justify-center text-xl mb-3 group-hover:border-border/80 transition-colors">
                  {deal.icon}
                </div>
                <p className="text-foreground font-bold text-sm mb-1 pr-12">{deal.title}</p>
                <p className="text-muted-foreground text-xs mb-3 flex-1">{deal.subtitle}</p>
                <div className="flex items-center gap-1 text-muted-foreground group-hover:text-primary transition-colors">
                  <span className="text-xs font-semibold">View deal</span>
                  <span className="text-xs group-hover:translate-x-0.5 transition-transform">→</span>
                </div>
              </a>
            ))}
          </div>

          <p className="text-muted-foreground/60 text-xs text-center mt-4">
            {" "}
          </p>
        </section>

        {/* SECTION 2 — Amazon UK */}
        <section className="px-4 pb-24 max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <img
                src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f4b0.png"
                width={32}
                height={32}
                loading="lazy"
                alt="deals"
                className="rounded-xl"
              />
              <div>
                <h2 className="text-foreground font-bold text-lg">Amazon UK</h2>
                <p className="text-muted-foreground text-xs">Deals & Savings · Updated daily</p>
              </div>
            </div>
            <a
              href={AMAZON_ALL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 group"
            >
              View all
              <span className="group-hover:translate-x-0.5 transition-transform">→</span>
            </a>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {AMAZON_DEALS.map((deal) => (
              <a
                key={deal.id}
                href={deal.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${deal.title} — Amazon UK`}
                className="group flex flex-col p-4 bg-card border border-border hover:border-orange-900/50 hover:bg-orange-950/10 rounded-2xl transition-all hover:-translate-y-0.5"
              >
                <span className="text-2xl mb-3">{deal.icon}</span>
                <p className="text-foreground font-bold text-sm mb-1">{deal.title}</p>
                <p className="text-muted-foreground text-xs mb-3 flex-1">{deal.subtitle}</p>
                <div className="flex items-center gap-1 text-muted-foreground group-hover:text-orange-400 transition-colors">
                  <span className="text-xs font-semibold">Shop now</span>
                  <span className="text-xs group-hover:translate-x-0.5 transition-transform">→</span>
                </div>
              </a>
            ))}
          </div>

          <p className="text-muted-foreground/60 text-xs text-center mt-4">
            {" "}
          </p>
        </section>
      </main>

      <Footer />
      <BackToTop />
    </div>
  );
};

export default Deals;
