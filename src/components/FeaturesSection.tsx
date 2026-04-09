import { Camera, Car, Bookmark, Bell, Store, Star, BarChart3, Gift } from "lucide-react";

const features = [
  {
    icon: Camera,
    title: "Photo Search",
    desc: "Snap a photo of any car part and we'll identify it and find the best prices instantly.",
  },
  {
    icon: Car,
    title: "UK Plate Lookup",
    desc: "Enter your registration number to find parts specific to your exact vehicle.",
  },
  {
    icon: Bookmark,
    title: "My Garage",
    desc: "Save your vehicles and filter searches to find compatible parts every time.",
  },
  {
    icon: Bell,
    title: "Price Alerts",
    desc: "Set target prices and get notified when parts drop to the price you want.",
  },
  {
    icon: Store,
    title: "Marketplace",
    desc: "Browse and buy from verified UK sellers with moderated listings you can trust.",
  },
  {
    icon: Star,
    title: "Community Reviews",
    desc: "Read honest reviews from real buyers to choose the right part and supplier.",
  },
  {
    icon: BarChart3,
    title: "Price Comparison",
    desc: "Compare prices across 6+ suppliers side by side in a single search.",
  },
  {
    icon: Gift,
    title: "Referral Program",
    desc: "Invite friends and earn bonus searches. They get extra searches too.",
  },
];

const FeaturesSection = () => (
  <section className="py-20 md:py-28">
    <div className="container px-4">
      <div className="text-center mb-14">
        <span className="inline-block text-xs font-semibold uppercase tracking-widest text-primary mb-4">
          Features
        </span>
        <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
          Everything You Need to Find the Right Part
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          From search to purchase, PARTARA gives you the tools to find, compare, and buy car parts faster.
        </p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 max-w-6xl mx-auto">
        {features.map((f) => (
          <div
            key={f.title}
            className="group rounded-xl sm:rounded-2xl border border-border bg-card p-3 sm:p-6 text-center transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
          >
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <f.icon size={24} />
            </div>
            <h3 className="font-semibold text-sm mb-1.5">{f.title}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default FeaturesSection;
