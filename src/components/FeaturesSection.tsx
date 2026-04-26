import { useNavigate } from "react-router-dom";
import ScrollReveal from "@/components/ScrollReveal";

type Cell = {
  title: string;
  subtitle: string;
  link: string;
  span?: boolean; // spans 2 columns
  footer?: string;
};

const cells: Cell[] = [
  {
    title: "Photo Search",
    subtitle:
      "Point your camera at any car part — we identify it and find the cheapest price in seconds",
    link: "/search",
    span: true,
    footer: "Powered by AI vision →",
  },
  {
    title: "UK Reg Plate",
    subtitle:
      "Enter your registration — instantly find parts compatible with your exact vehicle",
    link: "/search",
  },
  {
    title: "Price Alerts",
    subtitle:
      "Set your target price. Get an email the moment any supplier drops below it",
    link: "/dashboard",
  },
  {
    title: "My Garage",
    subtitle:
      "Save your vehicles. Filter every search to only show compatible parts",
    link: "/garage",
  },
  {
    title: "P2P Marketplace",
    subtitle:
      "Buy and sell second-hand parts directly with other UK drivers. No fees, no middleman",
    link: "/marketplace",
    span: true,
  },
];

const FeaturesSection = () => {
  const navigate = useNavigate();

  return (
    <section
      style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "64px 40px",
      }}
    >
      <ScrollReveal>
        <p
          style={{
            fontSize: "12px",
            color: "#52525b",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            marginBottom: "12px",
          }}
        >
          Features
        </p>
        <h2
          style={{
            fontSize: "clamp(32px, 5vw, 48px)",
            fontWeight: 800,
            letterSpacing: "-2px",
            color: "#ffffff",
            marginBottom: "40px",
            lineHeight: 1.05,
          }}
        >
          Everything you need
        </h2>
      </ScrollReveal>

      <ScrollReveal>
        <div
          className="bento-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "1px",
            background: "#141414",
            border: "1px solid #141414",
            borderRadius: "16px",
            overflow: "hidden",
          }}
        >
          {cells.map((c, i) => (
            <button
              key={c.title}
              type="button"
              onClick={() => navigate(c.link)}
              className="bento-cell"
              style={{
                background: "#0a0a0a",
                padding: "32px 36px",
                textAlign: "left",
                cursor: "pointer",
                gridColumn: c.span
                  ? i === 0
                    ? "1 / 3"
                    : "2 / 4"
                  : undefined,
                border: "none",
                color: "inherit",
                transition: "background-color 0.15s",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                minHeight: "160px",
              }}
            >
              <div>
                <h3
                  style={{
                    fontSize: "20px",
                    fontWeight: 700,
                    color: "#ffffff",
                    letterSpacing: "-0.5px",
                  }}
                >
                  {c.title}
                </h3>
                <p
                  style={{
                    fontSize: "14px",
                    color: "#71717a",
                    lineHeight: 1.6,
                    marginTop: "8px",
                  }}
                >
                  {c.subtitle}
                </p>
              </div>
              {c.footer && (
                <p
                  style={{
                    fontSize: "13px",
                    color: "#52525b",
                    marginTop: "20px",
                  }}
                >
                  {c.footer}
                </p>
              )}
            </button>
          ))}
        </div>
      </ScrollReveal>

      <style>{`
        .bento-cell:hover {
          background: #0f0f0f !important;
        }
        @media (max-width: 768px) {
          .bento-grid {
            grid-template-columns: 1fr !important;
          }
          .bento-cell {
            grid-column: auto !important;
          }
        }
      `}</style>
    </section>
  );
};

export default FeaturesSection;
