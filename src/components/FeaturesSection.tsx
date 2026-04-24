import { useNavigate } from "react-router-dom";
import { Camera, Car, Bookmark, Bell, Store, BarChart3, Gift } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";

const features = [
  {
    icon: Camera,
    title: "Photo Search",
    desc: "Snap a photo of any car part and we'll identify it and find the best prices instantly.",
    link: "/search",
  },
  {
    icon: Car,
    title: "UK Plate Lookup",
    desc: "Enter your registration number to find parts specific to your exact vehicle.",
    link: "/search",
  },
  {
    icon: Bookmark,
    title: "My Garage",
    desc: "Save your vehicles and filter searches to find compatible parts every time.",
    link: "/garage",
  },
  {
    icon: Bell,
    title: "Price Alerts",
    desc: "Set a target price and get notified by email when the price drops.",
    link: "/dashboard",
  },
  {
    icon: Store,
    title: "Marketplace",
    desc: "Browse and buy from verified UK sellers with moderated listings you can trust.",
    link: "/marketplace",
  },
  {
    icon: BarChart3,
    title: "Price Comparison",
    desc: "Compare prices from trusted UK &amp; global suppliers side by side in a single search.",
    link: "/search",
  },
  {
    icon: Gift,
    title: "Referral Program",
    desc: "Invite a friend and give them 1 month Pro free. You get 1 month Pro free too. Share the love.",
    link: "/dashboard",
  },
];

const FeaturesSection = () => {
  const navigate = useNavigate();

  return (
    <section className="py-12 md:py-16">
      <div className="container px-6 md:px-4">
        <ScrollReveal className="text-center mb-16">
          <span className="inline-block text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-4">
            Features
          </span>
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-5 tracking-tight">
            Everything You Need to Find the Right Part
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
            From search to purchase, GOPARTARA gives you the tools to find, compare, and buy car parts faster.
          </p>
        </ScrollReveal>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-6xl mx-auto">
          {features.map((f, i) => (
            <ScrollReveal key={f.title} delay={(i % 4) + 1}>
              <button
                onClick={() => navigate(f.link)}
                className={`group relative w-full rounded-2xl border border-border/50 bg-card/40 backdrop-blur-sm p-5 sm:p-7 text-center transition-colors hover:border-primary/30 hover:bg-card/70 card-hover cursor-pointer ${(f as any).dimmed ? "opacity-75" : ""}`}
              >
                {(f as any).badge && (
                  <span className={`absolute top-3 right-3 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${(f as any).badgeColor}`}>
                    {(f as any).badge}
                  </span>
                )}
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-[colors,transform] group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-110 group-hover:rotate-3">
                  <f.icon size={26} />
                </div>
                <h3 className="font-semibold text-sm sm:text-base mb-2">{f.title}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </button>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
