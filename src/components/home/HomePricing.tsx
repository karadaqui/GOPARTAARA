import { Link } from "react-router-dom";

type Tier = {
  name: string;
  price: string;
  features: string[];
  highlighted?: boolean;
  ctaLabel: string;
  dotShade: "muted" | "red" | "white";
};

const TIERS: Tier[] = [
  {
    name: "Free",
    price: "£0",
    ctaLabel: "Get started",
    dotShade: "muted",
    features: [
      "10 searches per month",
      "5 saved parts",
      "5 price alerts",
      "5 marketplace listings",
      "1 vehicle in My Garage",
    ],
  },
  {
    name: "Pro",
    price: "£9.99",
    ctaLabel: "Upgrade to Pro",
    dotShade: "red",
    highlighted: true,
    features: [
      "Unlimited searches",
      "Photo search",
      "Unlimited saved parts",
      "Unlimited price alerts",
      "Unlimited marketplace listings",
      "Unlimited vehicles in My Garage",
      "Compare up to 5 parts at once",
      "Search history",
    ],
  },
  {
    name: "Elite",
    price: "£19.99",
    ctaLabel: "Go Elite",
    dotShade: "white",
    features: [
      "Everything in Pro",
      "Bulk compare (up to 20 parts)",
      "CSV export",
      "Garage analytics",
      "Priority support",
      "Early access to new features",
    ],
  },
];

const Dot = ({ shade }: { shade: Tier["dotShade"] }) => {
  const styles =
    shade === "red"
      ? { bg: "rgba(204,17,17,0.12)", inner: "var(--red)" }
      : shade === "white"
      ? { bg: "rgba(255,255,255,0.05)", inner: "#555" }
      : { bg: "rgba(34,197,94,0.12)", inner: "var(--green)" };
  return (
    <span
      style={{
        width: 16,
        height: 16,
        borderRadius: "50%",
        background: styles.bg,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: styles.inner }} />
    </span>
  );
};

const HomePricing = () => (
  <section
    style={{
      padding: "56px 24px",
      borderBottom: "1px solid var(--border)",
    }}
  >
    <div style={{ maxWidth: "1180px", margin: "0 auto", textAlign: "center" }}>
      <p
        style={{
          fontFamily: '"DM Sans", sans-serif',
          fontWeight: 600,
          fontSize: "11px",
          color: "var(--red)",
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          margin: "0 0 12px",
        }}
      >
        Pricing
      </p>
      <h2
        style={{
          fontFamily: '"Barlow Condensed", sans-serif',
          fontWeight: 700,
          fontSize: "clamp(32px, 5vw, 42px)",
          color: "#ffffff",
          margin: "0 0 12px",
          lineHeight: 1.05,
          letterSpacing: "-0.01em",
        }}
      >
        Simple, transparent pricing.
      </h2>
      <p
        style={{
          fontFamily: '"DM Sans", sans-serif',
          fontWeight: 400,
          fontSize: "15px",
          color: "#4a4a4a",
          margin: "0 auto 44px",
        }}
      >
        Free to start. Upgrade when you need more.
      </p>

      <div
        className="home-pricing-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "16px",
          maxWidth: "920px",
          margin: "0 auto",
          textAlign: "left",
        }}
      >
        {TIERS.map((tier) => {
          const highlight = !!tier.highlighted;
          return (
            <div
              key={tier.name}
              style={{
                position: "relative",
                background: "var(--surface)",
                border: highlight ? "2px solid var(--red)" : "1px solid var(--border)",
                borderRadius: "var(--radius-xl)",
                padding: "32px 28px",
              }}
            >
              {highlight && (
                <span
                  style={{
                    position: "absolute",
                    top: "-12px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "var(--red)",
                    borderRadius: "100px",
                    padding: "4px 16px",
                    fontFamily: '"DM Sans", sans-serif',
                    fontWeight: 700,
                    fontSize: "11px",
                    color: "#fff",
                    letterSpacing: "0.06em",
                    whiteSpace: "nowrap",
                  }}
                >
                  MOST POPULAR
                </span>
              )}
              <div
                style={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontWeight: 600,
                  fontSize: "12px",
                  color: highlight ? "var(--red)" : "var(--text-muted)",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  marginBottom: "12px",
                }}
              >
                {tier.name}
              </div>
              <div
                style={{
                  fontFamily: '"Barlow Condensed", sans-serif',
                  fontWeight: 800,
                  fontSize: "40px",
                  color: "#ffffff",
                  lineHeight: 1,
                }}
              >
                {tier.price}
              </div>
              <div
                style={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontWeight: 400,
                  fontSize: "12px",
                  color: "var(--text-dim)",
                  marginTop: "4px",
                  marginBottom: "24px",
                }}
              >
                per month
              </div>

              <Link
                to="/pricing"
                style={{
                  display: "block",
                  textAlign: "center",
                  background: highlight ? "var(--red)" : "transparent",
                  border: highlight ? "none" : "1px solid var(--border-2)",
                  borderRadius: "var(--radius-md)",
                  padding: "12px",
                  width: "100%",
                  fontFamily: '"DM Sans", sans-serif',
                  fontWeight: highlight ? 600 : 500,
                  fontSize: "13px",
                  color: highlight ? "#fff" : "var(--text)",
                  textDecoration: "none",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  if (highlight) (e.currentTarget as HTMLElement).style.background = "#aa0000";
                  else (e.currentTarget as HTMLElement).style.borderColor = "#444";
                }}
                onMouseLeave={(e) => {
                  if (highlight) (e.currentTarget as HTMLElement).style.background = "var(--red)";
                  else (e.currentTarget as HTMLElement).style.borderColor = "var(--border-2)";
                }}
              >
                {tier.ctaLabel}
              </Link>

              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: "24px 0 0",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                {tier.features.map((f) => (
                  <li
                    key={f}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      fontFamily: '"DM Sans", sans-serif',
                      fontWeight: 400,
                      fontSize: "13px",
                      color: "var(--text-muted)",
                    }}
                  >
                    <Dot shade={tier.dotShade} />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
    <style>{`
      @media (max-width: 860px) {
        .home-pricing-grid { grid-template-columns: 1fr !important; max-width: 420px !important; }
      }
    `}</style>
  </section>
);

export default HomePricing;
