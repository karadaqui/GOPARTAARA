import { Link } from "react-router-dom";

const HomeCTASection = () => {
  return (
    <section
      style={{
        background:
          "linear-gradient(135deg, #0d0000 0%, #1a0000 50%, #0d0000 100%)",
        borderTop: "1px solid rgba(204,17,17,0.2)",
        borderBottom: "1px solid rgba(204,17,17,0.2)",
        padding: "80px 24px",
        textAlign: "center",
      }}
    >
      <div className="max-w-3xl mx-auto">
        <h2
          style={{
            fontSize: "clamp(36px, 5vw, 56px)",
            fontWeight: 800,
            letterSpacing: "-0.03em",
            color: "white",
            lineHeight: 1.05,
          }}
        >
          Stop Overpaying for Car Parts.
        </h2>
        <p
          style={{
            fontSize: "18px",
            color: "#71717a",
            marginTop: "12px",
          }}
        >
          Join 50,000+ drivers saving money every week.
        </p>
        <div
          className="flex flex-wrap justify-center"
          style={{ gap: "12px", marginTop: "32px" }}
        >
          <Link
            to="/search"
            style={{
              background: "#cc1111",
              color: "white",
              padding: "14px 28px",
              borderRadius: "10px",
              fontSize: "16px",
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              transition: "background-color 150ms ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#b30f0f")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#cc1111")}
          >
            Search Parts Free →
          </Link>
          <Link
            to="/pricing"
            className="home-cta-secondary"
            style={{
              background: "transparent",
              border: "1px solid #27272a",
              color: "#a1a1aa",
              padding: "14px 28px",
              borderRadius: "10px",
              fontSize: "16px",
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              transition: "color 150ms ease, border-color 150ms ease",
            }}
          >
            View Pricing
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HomeCTASection;
