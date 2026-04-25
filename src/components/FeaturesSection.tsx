import { useNavigate } from "react-router-dom";
import { Camera } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";

const miniFeatures = [
  {
    num: "02",
    title: "UK Plate Lookup",
    desc: "Enter your registration number to find parts specific to your exact vehicle.",
    link: "/search",
  },
  {
    num: "03",
    title: "My Garage",
    desc: "Save your vehicles and filter searches to find compatible parts every time.",
    link: "/garage",
  },
  {
    num: "04",
    title: "Price Alerts",
    desc: "Set a target price and get notified by email when the price drops.",
    link: "/dashboard",
  },
  {
    num: "05",
    title: "Marketplace",
    desc: "Browse and buy from verified UK sellers with moderated listings you can trust.",
    link: "/marketplace",
  },
  {
    num: "06",
    title: "Price Comparison",
    desc: "Compare prices from trusted UK & global suppliers side by side in a single search.",
    link: "/search",
  },
  {
    num: "07",
    title: "Referral Program",
    desc: "Invite a friend and give them 1 month Pro free. You get 1 month Pro free too.",
    link: "/dashboard",
  },
];

const FeaturesSection = () => {
  const navigate = useNavigate();

  return (
    <section className="py-24 md:py-32">
      <div className="container px-6 md:px-4 max-w-6xl">
        <ScrollReveal className="mb-12">
          <p
            style={{
              color: "#52525b",
              fontSize: "12px",
              fontWeight: 600,
              letterSpacing: "0.04em",
              marginBottom: "16px",
            }}
          >
            04 — Features
          </p>
          <h2
            className="font-display"
            style={{
              fontSize: "clamp(36px, 5vw, 56px)",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              lineHeight: 1.05,
              color: "#ffffff",
              maxWidth: "720px",
              marginBottom: "16px",
            }}
          >
            Everything you need to find the right part.
          </h2>
          <p
            style={{
              fontSize: "17px",
              color: "#71717a",
              lineHeight: 1.65,
              maxWidth: "560px",
            }}
          >
            From search to purchase, GOPARTARA gives you the tools to find, compare, and buy car parts faster.
          </p>
        </ScrollReveal>

        {/* Feature 01 — Photo Search showcase */}
        <ScrollReveal>
          <button
            onClick={() => navigate("/search")}
            className="group w-full text-left mb-6 rounded-3xl overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #0d0d0d 0%, #111111 100%)",
              border: "1px solid #1f1f1f",
              padding: "0",
              cursor: "pointer",
              transition: "border-color 200ms",
            }}
          >
            <div
              className="grid grid-cols-1 md:grid-cols-2 items-center"
              style={{ gap: "32px", padding: "40px 32px" }}
            >
              <div>
                <p
                  style={{
                    color: "#3f3f46",
                    fontSize: "12px",
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    marginBottom: "16px",
                  }}
                >
                  01
                </p>
                <h3
                  style={{
                    fontSize: "clamp(26px, 3.2vw, 36px)",
                    fontWeight: 800,
                    letterSpacing: "-0.02em",
                    color: "#ffffff",
                    lineHeight: 1.1,
                    marginBottom: "14px",
                  }}
                >
                  Photo Search
                </h3>
                <p
                  style={{
                    color: "#a1a1aa",
                    fontSize: "16px",
                    lineHeight: 1.65,
                    marginBottom: "20px",
                    maxWidth: "440px",
                  }}
                >
                  Snap a photo of any car part and we'll identify it and find the best prices instantly.
                </p>
                <span
                  style={{
                    color: "#cc1111",
                    fontWeight: 600,
                    fontSize: "14px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                  className="feat-arrow"
                >
                  Try Photo Search
                  <span className="feat-arrow-icon" style={{ display: "inline-block", transition: "transform 200ms" }}>
                    →
                  </span>
                </span>
              </div>
              <div className="flex justify-center md:justify-end">
                <div
                  style={{
                    width: "200px",
                    height: "300px",
                    background: "#1a1a1a",
                    border: "1px solid #262626",
                    borderRadius: "20px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "16px",
                    color: "#71717a",
                  }}
                >
                  <div
                    style={{
                      width: "72px",
                      height: "72px",
                      borderRadius: "16px",
                      background: "#0f0f0f",
                      border: "1px solid #262626",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#cc1111",
                    }}
                  >
                    <Camera size={32} strokeWidth={1.5} />
                  </div>
                  <span style={{ fontSize: "13px", fontWeight: 500 }}>Point at any part</span>
                </div>
              </div>
            </div>
          </button>
        </ScrollReveal>

        {/* Mini features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {miniFeatures.map((f, i) => (
            <ScrollReveal key={f.title} delay={(i % 3) + 1}>
              <button
                onClick={() => navigate(f.link)}
                className="mini-feat group w-full text-left h-full"
                style={{
                  background: "#0d0d0d",
                  border: "1px solid #1a1a1a",
                  borderRadius: "20px",
                  padding: "32px",
                  cursor: "pointer",
                  transition: "border-color 300ms",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  height: "100%",
                }}
              >
                <p
                  style={{
                    color: "#3f3f46",
                    fontSize: "12px",
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                  }}
                >
                  {f.num}
                </p>
                <h4
                  style={{
                    fontSize: "22px",
                    fontWeight: 700,
                    letterSpacing: "-0.02em",
                    color: "#ffffff",
                    lineHeight: 1.2,
                  }}
                >
                  {f.title}
                </h4>
                <p
                  style={{
                    color: "#71717a",
                    fontSize: "14px",
                    lineHeight: 1.6,
                  }}
                >
                  {f.desc}
                </p>
              </button>
            </ScrollReveal>
          ))}
        </div>
      </div>
      <style>{`
        .mini-feat:hover {
          border-color: #cc1111 !important;
        }
        .feat-arrow:hover .feat-arrow-icon {
          transform: translateX(3px);
        }
      `}</style>
    </section>
  );
};

export default FeaturesSection;
