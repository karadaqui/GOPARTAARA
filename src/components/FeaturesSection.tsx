import { useNavigate } from "react-router-dom";
import { Camera, Car, Bookmark, Bell, Store, BarChart3, Gift, ArrowRight } from "lucide-react";
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
    desc: "Compare prices from trusted UK & global suppliers side by side in a single search.",
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
    <section className="py-20 md:py-28">
      <div className="container px-6 md:px-4">
        <ScrollReveal className="text-center mb-16 md:mb-20">
          <span className="ds-eyebrow">Features</span>
          <h2 className="ds-h2 mt-2 mb-5">Everything You Need to Find the Right Part</h2>
          <p className="ds-body max-w-2xl mx-auto">
            From search to purchase, GOPARTARA gives you the tools to find, compare, and buy car parts faster.
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 max-w-6xl mx-auto">
          {features.map((f, i) => (
            <ScrollReveal key={f.title} delay={(i % 3) + 1}>
              <button
                onClick={() => navigate(f.link)}
                className="features-card group relative w-full text-left"
                style={{
                  background: "transparent",
                  border: "1px solid #1f1f1f",
                  borderRadius: "16px",
                  padding: "24px",
                  cursor: "pointer",
                  transition: "border-color 200ms ease, background-color 200ms ease",
                }}
              >
                <div
                  className="mb-5 flex items-center justify-center"
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "10px",
                    background: "rgba(204,17,17,0.1)",
                    color: "#cc1111",
                  }}
                >
                  <f.icon size={20} strokeWidth={2} />
                </div>
                <h3
                  className="mb-2"
                  style={{
                    color: "#ffffff",
                    fontSize: "15px",
                    fontWeight: 600,
                    letterSpacing: "-0.005em",
                  }}
                >
                  {f.title}
                </h3>
                <p
                  style={{
                    color: "#71717a",
                    fontSize: "13px",
                    lineHeight: 1.6,
                  }}
                >
                  {f.desc}
                </p>
              </button>
            </ScrollReveal>
          ))}
        </div>

        {/* CTA row */}
        <ScrollReveal>
          <div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-16 max-w-6xl mx-auto pt-12"
            style={{ borderTop: "1px solid #1f1f1f" }}
          >
            <p style={{ color: "#a1a1aa", fontSize: "15px" }}>
              Ready to find your part?
            </p>
            <button
              onClick={() => navigate("/search")}
              className="btn-ds-primary"
            >
              Search Now
              <ArrowRight size={16} />
            </button>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default FeaturesSection;
