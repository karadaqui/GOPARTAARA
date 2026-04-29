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
            fontSize: "clamp(28px, 7vw, 56px)",
            fontWeight: 800,
            letterSpacing: "-0.03em",
            color: "white",
            lineHeight: 1.05,
          }}
        >
          Search smarter. Pay less.
        </h2>
        <p
          style={{
            fontSize: "18px",
            color: "#71717a",
            marginTop: "12px",
          }}
        >
          Start searching for free — no account needed.
        </p>
        <div
          className="flex flex-col sm:flex-row sm:flex-wrap justify-center items-center"
          style={{ gap: "12px", marginTop: "32px" }}
        >
          <Link
            to="/search"
            className="w-full sm:w-auto justify-center"
            style={{
              background: "#cc1111",
              color: "white",
              padding: "14px 28px",
              borderRadius: "10px",
              fontSize: "16px",
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              maxWidth: "300px",
              transition: "background-color 150ms ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#b30f0f")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#cc1111")}
          >
            Search Parts Free →
          </Link>
          <Link
            to="/pricing"
            className="home-cta-secondary w-full sm:w-auto justify-center"
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
              maxWidth: "300px",
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
