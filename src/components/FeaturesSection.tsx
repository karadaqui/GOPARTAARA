import { useNavigate } from "react-router-dom";
import { Camera, Car, Bookmark, Bell, Store, BarChart3, Gift, BellRing } from "lucide-react";
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
    icon: Store,
    title: "Marketplace",
    desc: "Browse and buy from verified UK sellers with moderated listings you can trust.",
    link: "/marketplace",
  },
  {
    icon: BarChart3,
    title: "Price Comparison",
    desc: "Compare prices from trusted UK & global suppliers side by side in a single search.",
    link: "/search",
  },
  {
    icon: Gift,
    title: "Referral Program",
    desc: "Invite a friend and give them 1 month Pro free. You get 1 month Pro free too. Share the love.",
    link: "/dashboard",
  },
  {
    icon: BellRing,
    title: "Price Drop Alerts",
    desc: "Set your target price and we'll email you the moment any part drops below it.",
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
          <h2
            className="font-display text-3xl md:text-5xl mb-5"
            style={{ fontWeight: 800, letterSpacing: "-0.03em", color: "white" }}
          >
            Everything You Need to Find the Right Part
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
            From search to purchase, GOPARTARA gives you the tools to find, compare, and buy car parts faster.
          </p>
        </ScrollReveal>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-6xl mx-auto">
          {features.map((f, i) => (
            <ScrollReveal key={f.title} delay={(i % 3) + 1}>
              <button
                onClick={() => navigate(f.link)}
                className="feature-card-premium group relative w-full text-left p-6 sm:p-7 cursor-pointer"
                style={{
                  background: "#111111",
                  border: "1px solid #1f1f1f",
                  borderTop: "2px solid #cc1111",
                  borderRadius: "12px",
                  transition: "background-color 200ms ease, border-color 200ms ease",
                }}
              >
                <div
                  className="mb-5 flex items-center justify-start transition-transform group-hover:scale-110"
                  style={{ color: "#cc1111" }}
                >
                  <f.icon size={24} strokeWidth={2} />
                </div>
                <h3 className="font-semibold text-base sm:text-lg mb-2" style={{ color: "white" }}>
                  {f.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "#71717a" }}>
                  {f.desc}
                </p>
              </button>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
