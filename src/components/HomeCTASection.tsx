import { Link } from "react-router-dom";

const HomeCTASection = () => {
  return (
    <section
      style={{
        background: "linear-gradient(135deg, #0a1628 0%, #1d4ed8 100%)",
        padding: "64px 24px",
        textAlign: "center",
      }}
    >
      <div className="max-w-3xl mx-auto">
        <h2
          style={{
            fontSize: "clamp(28px, 6vw, 48px)",
            fontWeight: 800,
            letterSpacing: "-0.03em",
            color: "#ffffff",
            lineHeight: 1.1,
          }}
        >
          Search smarter. Pay less.
        </h2>
        <p style={{ fontSize: "17px", color: "#bfdbfe", marginTop: "12px" }}>
          Start searching for free — no account needed.
        </p>
        <div
          className="flex flex-col sm:flex-row sm:flex-wrap justify-center items-center"
          style={{ gap: "12px", marginTop: "32px" }}
        >
          <Link
            to="/search"
            className="btn-amber w-full sm:w-auto"
            style={{
              padding: "14px 28px",
              fontSize: "16px",
              maxWidth: "300px",
            }}
          >
            Search Parts Free →
          </Link>
          <Link
            to="/pricing"
            className="home-cta-secondary w-full sm:w-auto justify-center"
            style={{
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.4)",
              color: "#ffffff",
              padding: "14px 28px",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              maxWidth: "300px",
              textDecoration: "none",
              transition: "color 150ms ease, border-color 150ms ease, background-color 150ms ease",
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
