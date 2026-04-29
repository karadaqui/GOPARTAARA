import { Link } from "react-router-dom";
import { useState } from "react";

type Tier = {
  name: string;
  monthlyPrice: string;
  annualPrice: string;
  annualBilled: string;
  features: string[];
  ctaLabel: string;
  ctaTo: string;
  variant: "free" | "pro" | "elite";
};

const TIERS: Tier[] = [
  {
    name: "Free",
    monthlyPrice: "£0",
    annualPrice: "£0",
    annualBilled: "",
    ctaLabel: "Get started",
    ctaTo: "/auth",
    variant: "free",
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
    monthlyPrice: "£9.99",
    annualPrice: "£7.99",
    annualBilled: "Billed £95.88/yr",
    ctaLabel: "Upgrade to Pro",
    ctaTo: "/pricing",
    variant: "pro",
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
    monthlyPrice: "£19.99",
    annualPrice: "£15.99",
    annualBilled: "Billed £191.88/yr",
    ctaLabel: "Go Elite",
    ctaTo: "/pricing",
    variant: "elite",
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

const Dot = ({ variant }: { variant: Tier["variant"] }) => {
  const isElite = variant === "elite";
  return (
    <span
      style={{
        width: 16,
        height: 16,
        borderRadius: "50%",
        background: isElite ? "rgba(204,17,17,0.1)" : "rgba(34,197,94,0.1)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: isElite ? "#cc1111" : "#22c55e",
        }}
      />
    </span>
  );
};

const ctaStyles = (variant: Tier["variant"]): React.CSSProperties => {
  if (variant === "pro") {
    return {
      background: "#22c55e",
      border: "none",
      color: "#ffffff",
      fontWeight: 600,
    };
  }
  if (variant === "elite") {
    return {
      background: "#cc1111",
      border: "none",
      color: "#ffffff",
      fontWeight: 600,
    };
  }
  return {
    background: "transparent",
    border: "1px solid #333333",
    color: "#666666",
    fontWeight: 500,
  };
};

const HomePricing = () => {
  const [annual, setAnnual] = useState(false);

  return (
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
            color: "#cc1111",
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
            color: "#666666",
            margin: "0 auto 28px",
          }}
        >
          Free to start. Upgrade when you need more.
        </p>

        {/* Monthly / Annual toggle */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "#0d0d0d",
            border: "1px solid #1a1a1a",
            borderRadius: "100px",
            padding: "4px",
            marginBottom: "36px",
          }}
        >
          <button
            type="button"
            onClick={() => setAnnual(false)}
            style={{
              padding: "8px 20px",
              borderRadius: "100px",
              border: "none",
              background: !annual ? "#cc1111" : "transparent",
              color: !annual ? "#ffffff" : "#555555",
              fontFamily: '"DM Sans", sans-serif',
              fontWeight: !annual ? 600 : 500,
              fontSize: "13px",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setAnnual(true)}
            style={{
              padding: "8px 20px",
              borderRadius: "100px",
              border: "none",
              background: annual ? "#cc1111" : "transparent",
              color: annual ? "#ffffff" : "#555555",
              fontFamily: '"DM Sans", sans-serif',
              fontWeight: annual ? 600 : 500,
              fontSize: "13px",
              cursor: "pointer",
              transition: "all 0.15s ease",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            Annual
            <span
              style={{
                background: "rgba(34,197,94,0.12)",
                border: "1px solid rgba(34,197,94,0.2)",
                color: "#22c55e",
                borderRadius: "100px",
                padding: "3px 10px",
                fontSize: "11px",
                fontWeight: 600,
              }}
            >
              Save 20%
            </span>
          </button>
        </div>

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
            const isPro = tier.variant === "pro";
            const showAnnual = annual && tier.variant !== "free";
            const displayPrice = showAnnual ? tier.annualPrice : tier.monthlyPrice;
            const cta = ctaStyles(tier.variant);
            return (
              <div
                key={tier.name}
                style={{
                  position: "relative",
                  background: "#0d0d0d",
                  border: isPro ? "2px solid #cc1111" : "1px solid #1a1a1a",
                  borderRadius: "20px",
                  padding: "32px 28px",
                }}
              >
                {isPro && (
                  <span
                    style={{
                      position: "absolute",
                      top: "-12px",
                      left: "50%",
                      transform: "translateX(-50%)",
                      background: "#cc1111",
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
                    fontWeight: 700,
                    fontSize: "12px",
                    color: isPro ? "#cc1111" : "#888888",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    marginBottom: "12px",
                  }}
                >
                  {tier.name}
                </div>

                {showAnnual && (
                  <div
                    style={{
                      fontFamily: '"DM Sans", sans-serif',
                      fontSize: "14px",
                      color: "#333333",
                      textDecoration: "line-through",
                      marginBottom: "2px",
                    }}
                  >
                    {tier.monthlyPrice}/mo
                  </div>
                )}

                <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                  <span
                    style={{
                      fontFamily: '"Barlow Condensed", sans-serif',
                      fontWeight: 800,
                      fontSize: "40px",
                      color: "#ffffff",
                      lineHeight: 1,
                    }}
                  >
                    {displayPrice}
                  </span>
                  <span
                    style={{
                      fontFamily: '"DM Sans", sans-serif',
                      fontSize: "14px",
                      color: "#444444",
                    }}
                  >
                    /mo
                  </span>
                </div>

                <div
                  style={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontWeight: 400,
                    fontSize: "12px",
                    color: "#444444",
                    marginTop: "6px",
                    marginBottom: "20px",
                    minHeight: "16px",
                  }}
                >
                  {showAnnual ? tier.annualBilled : ""}
                </div>

                <Link
                  to={tier.ctaTo}
                  style={{
                    display: "block",
                    textAlign: "center",
                    borderRadius: "12px",
                    padding: "12px",
                    width: "100%",
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: "13px",
                    textDecoration: "none",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    ...cta,
                  }}
                  onMouseEnter={(e) => {
                    if (tier.variant === "pro") (e.currentTarget as HTMLElement).style.background = "#16a34a";
                    else if (tier.variant === "elite") (e.currentTarget as HTMLElement).style.background = "#aa0000";
                    else (e.currentTarget as HTMLElement).style.borderColor = "#555";
                  }}
                  onMouseLeave={(e) => {
                    if (tier.variant === "pro") (e.currentTarget as HTMLElement).style.background = "#22c55e";
                    else if (tier.variant === "elite") (e.currentTarget as HTMLElement).style.background = "#cc1111";
                    else (e.currentTarget as HTMLElement).style.borderColor = "#333333";
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
                        color: "#cccccc",
                      }}
                    >
                      <Dot variant={tier.variant} />
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
};

export default HomePricing;
