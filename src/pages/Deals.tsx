import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import BackToTop from "@/components/BackToTop";

// ───────── eBay (eBay Partner Network) ─────────
const ebayAff = (url: string) => {
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}mkcid=1&mkrid=710-53481-19255-0&siteid=3&campid=5339148333&toolid=20014&customid=partara&mkevt=1`;
};

const EBAY_DEALS = [
  {
    icon: "🔧",
    title: "Car Parts & Accessories",
    subtitle: "Brakes, filters, exhausts & more",
    url: ebayAff("https://www.ebay.co.uk/deals/automotive/car-parts-accessories"),
    badge: "Top category",
  },
  {
    icon: "🏎️",
    title: "Garage Equipment & Tools",
    subtitle: "Jacks, compressors, testers",
    url: ebayAff("https://www.ebay.co.uk/deals/automotive/garage-equipment-tools"),
    badge: "Up to 50% off",
  },
  {
    icon: "📡",
    title: "Car Electronics",
    subtitle: "Dash cams, GPS, stereos & CarPlay",
    url: ebayAff("https://www.ebay.co.uk/deals/automotive/car-electronics"),
    badge: "Hot deals",
  },
  {
    icon: "🛞",
    title: "Wheels & Tyres",
    subtitle: "Alloys, winter tyres & more",
    url: ebayAff("https://www.ebay.co.uk/deals/automotive/wheels-tyres"),
    badge: "Big savings",
  },
  {
    icon: "🛢️",
    title: "Oils & Fluids",
    subtitle: "Engine oil, coolant, brake fluid",
    url: ebayAff("https://www.ebay.co.uk/deals/automotive/oils-fluids"),
    badge: "Essentials",
  },
  {
    icon: "🚗",
    title: "Car Care, Utility & Trailers",
    subtitle: "Cleaning, covers, towing & more",
    url: ebayAff("https://www.ebay.co.uk/deals/automotive/car-care-utility-trailers"),
    badge: "New deals",
  },
  {
    icon: "⚡",
    title: "Tuning & Styling",
    subtitle: "Performance parts & styling kits",
    url: ebayAff("https://www.ebay.co.uk/deals/automotive/tuning-styling"),
    badge: "Performance",
  },
  {
    icon: "👕",
    title: "Apparel & Accessories",
    subtitle: "Driving gear, helmets & clothing",
    url: ebayAff("https://www.ebay.co.uk/deals/automotive/apparel-accessories"),
    badge: "Style",
  },
  {
    icon: "🏍️",
    title: "Motorcycle Parts",
    subtitle: "Bike parts, helmets & gear",
    url: ebayAff("https://www.ebay.co.uk/deals/automotive/motorcycle-parts"),
    badge: "Bikers",
  },
  {
    icon: "⛺",
    title: "Camping & Caravan Parts",
    subtitle: "Awnings, accessories & spares",
    url: ebayAff("https://www.ebay.co.uk/deals/automotive/camping-caravan-parts"),
    badge: "Adventure",
  },
];

const EBAY_ALL_URL = ebayAff("https://www.ebay.co.uk/deals/automotive");

// ───────── Amazon ─────────
const AMAZON_DEALS = [
  { icon: "🏍️", title: "Motorbike Accessories & Parts", subtitle: "Helmets, gear & bike parts", url: "https://www.amazon.co.uk/b?node=301311031&tag=gopartara-21", badge: "Bikers" },
  { icon: "🚗", title: "Car Accessories", subtitle: "Mounts, covers, organizers & more", url: "https://www.amazon.co.uk/b?node=301308031&tag=gopartara-21", badge: "Top picks" },
  { icon: "🔧", title: "Car Parts", subtitle: "Brakes, filters, exhausts & more", url: "https://www.amazon.co.uk/b?node=301309031&tag=gopartara-21", badge: "Essentials" },
  { icon: "✨", title: "Car & Motorbike Care", subtitle: "Cleaning, wax, polish & detailing", url: "https://www.amazon.co.uk/b?node=303891031&tag=gopartara-21", badge: "Detailing" },
  { icon: "🛢️", title: "Oils & Fluids", subtitle: "Engine oil, coolant, brake fluid", url: "https://www.amazon.co.uk/b?node=301315031&tag=gopartara-21", badge: "Essentials" },
  { icon: "🔩", title: "Tools & Equipment", subtitle: "Garage tools, jacks, diagnostic kits", url: "https://www.amazon.co.uk/b?node=301312031&tag=gopartara-21", badge: "Workshop" },
  { icon: "👶", title: "Baby Car Seats", subtitle: "Group 0, 1, 2 & 3 seats", url: "https://www.amazon.co.uk/b?node=60036031&tag=gopartara-21", badge: "Family" },
  { icon: "🛞", title: "Tyres & Rims", subtitle: "All-season, winter & summer tyres", url: "https://www.amazon.co.uk/b?node=307675031&tag=gopartara-21", badge: "Big savings" },
  { icon: "🎁", title: "Gifts & Merchandise", subtitle: "Car-themed gifts & accessories", url: "https://www.amazon.co.uk/b?node=301310031&tag=gopartara-21", badge: "Gift ideas" },
  { icon: "📱", title: "Vehicle Electronics", subtitle: "Dash cams, GPS, CarPlay adapters", url: "https://www.amazon.co.uk/b?node=3013843031&tag=gopartara-21", badge: "Hot deals" },
  { icon: "🏕️", title: "Motorhome", subtitle: "Caravan & motorhome accessories", url: "https://www.amazon.co.uk/b?node=301314031&tag=gopartara-21", badge: "Adventure" },
];
const AMAZON_ALL_URL = "https://www.amazon.co.uk/b?node=248877031&tag=gopartara-21";

const Deals = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Car Parts Deals & Savings — eBay & Amazon UK | GOPARTARA"
        description="Best automotive deals from eBay UK and Amazon UK. Car parts, tools, tyres, electronics and more. Updated daily. Affiliate links."
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
                decoding="async"
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

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {EBAY_DEALS.map((deal) => (
              <a
                key={deal.title}
                href={deal.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${deal.title} — eBay UK deal`}
                className="group relative flex flex-col p-4 bg-card border border-border hover:border-border/80 hover:bg-card/80 rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-xl hover:shadow-background/40 hover:-translate-y-0.5"
              >
                <div className="absolute top-2 right-2 max-w-[55%]">
                  <span className="block truncate text-[9px] md:text-[10px] bg-primary/15 border border-primary/30 text-primary rounded-full px-2 py-0.5 font-bold">
                    {deal.badge}
                  </span>
                </div>
                <div className="text-2xl mb-3">{deal.icon}</div>
                <p className="text-foreground font-bold text-sm mb-1 pr-2">{deal.title}</p>
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

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {AMAZON_DEALS.map((deal) => (
              <a
                key={deal.title}
                href={deal.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${deal.title} — Amazon UK deal`}
                className="group relative flex flex-col p-4 bg-card border border-border hover:border-border/80 hover:bg-card/80 rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-xl hover:shadow-background/40 hover:-translate-y-0.5"
              >
                <div className="absolute top-2 right-2 max-w-[55%]">
                  <span className="block truncate text-[9px] md:text-[10px] bg-primary/15 border border-primary/30 text-primary rounded-full px-2 py-0.5 font-bold">
                    {deal.badge}
                  </span>
                </div>
                <div className="text-2xl mb-3">{deal.icon}</div>
                <p className="text-foreground font-bold text-sm mb-1 pr-2">{deal.title}</p>
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
      </main>

      <Footer />
      <BackToTop />
    </div>
  );
};

export default Deals;
