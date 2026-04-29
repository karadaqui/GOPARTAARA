import { Link } from "react-router-dom";

const PILLS = ["Free to list", "Secure payments", "UK buyers only"];

const MarketplaceCTA = () => (
  <section
    style={{
      padding: "60px 40px",
      background: "#0d0d0d",
      border: "1px solid #1a1a1a",
      borderRadius: "6px",
      margin: "40px auto",
      maxWidth: "900px",
    }}
    className="mp-cta"
  >
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1.4fr 1fr",
        gap: "40px",
        alignItems: "center",
      }}
      className="mp-cta-grid"
    >
      <div>
        <div
          style={{
            fontFamily: '"DM Sans", system-ui, sans-serif',
            fontWeight: 600,
            fontSize: "11px",
            color: "#cc1111",
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            marginBottom: "16px",
          }}
        >
          Marketplace
        </div>
        <h3
          style={{
            fontFamily: '"Barlow Condensed", system-ui, sans-serif',
            fontWeight: 700,
            fontSize: "36px",
            color: "#ffffff",
            margin: "0 0 12px",
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
          }}
        >
          Sell your parts directly to UK buyers.
        </h3>
        <p
          style={{
            fontFamily: '"DM Sans", system-ui, sans-serif',
            fontWeight: 400,
            fontSize: "14px",
            color: "#666666",
            lineHeight: 1.6,
            margin: "0 0 24px",
            maxWidth: "440px",
          }}
        >
          List up to 5 parts for free. No commission until your part sells.
        </p>
        <Link
          to="/marketplace"
          style={{
            display: "inline-block",
            background: "transparent",
            border: "1px solid #333333",
            color: "#ffffff",
            padding: "10px 24px",
            borderRadius: "3px",
            fontFamily: '"DM Sans", system-ui, sans-serif',
            fontWeight: 600,
            fontSize: "13px",
            textDecoration: "none",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "#cc1111";
            e.currentTarget.style.background = "rgba(204,17,17,0.05)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "#333333";
            e.currentTarget.style.background = "transparent";
          }}
        >
          Start selling →
        </Link>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "flex-end" }}>
        {PILLS.map((p) => (
          <span
            key={p}
            style={{
              border: "1px solid #1a1a1a",
              padding: "6px 14px",
              borderRadius: "3px",
              fontFamily: '"DM Sans", system-ui, sans-serif',
              fontWeight: 400,
              fontSize: "12px",
              color: "#666666",
              whiteSpace: "nowrap",
            }}
          >
            {p}
          </span>
        ))}
      </div>
    </div>
    <style>{`
      @media (max-width: 768px) {
        .mp-cta { padding: 40px 24px !important; }
        .mp-cta-grid {
          grid-template-columns: 1fr !important;
          gap: 24px !important;
        }
        .mp-cta-grid > div:last-child {
          justify-content: flex-start !important;
        }
      }
    `}</style>
  </section>
);

export default MarketplaceCTA;
