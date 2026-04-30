import { Link } from "react-router-dom";

const HomeCTASection = () => {
  return (
    <section
      style={{
        background: "linear-gradient(135deg, #0a1628, #1d4ed8)",
        padding: "56px 24px",
        textAlign: "center",
      }}
    >
      <div className="max-w-3xl mx-auto">
        <h2
          style={{
            fontSize: "clamp(22px, 4.2vw, 28px)",
            fontWeight: 900,
            letterSpacing: "-0.02em",
            color: "#ffffff",
            lineHeight: 1.1,
          }}
        >
          Ready to stop overpaying?
        </h2>
        <p
          style={{
            fontSize: 13,
            color: "#93c5fd",
            marginTop: 10,
          }}
        >
          Compare 1,000,000+ parts across 7 trusted global suppliers — free.
        </p>
        <div
          className="flex flex-col sm:flex-row sm:flex-wrap justify-center items-center"
          style={{ gap: 12, marginTop: 24 }}
        >
          <Link
            to="/search"
            className="w-full sm:w-auto justify-center btn-amber"
            style={{
              padding: "13px 30px",
              fontSize: 15,
              display: "inline-flex",
              alignItems: "center",
              maxWidth: 320,
              textDecoration: "none",
            }}
          >
            Search Parts Free →
          </Link>
          <Link
            to="/pricing"
            className="w-full sm:w-auto justify-center"
            style={{
              background: "transparent",
              border: "1.5px solid rgba(255,255,255,0.35)",
              color: "#ffffff",
              padding: "12px 28px",
              borderRadius: 8,
              fontSize: 15,
              fontWeight: 700,
              display: "inline-flex",
              alignItems: "center",
              maxWidth: 320,
              textDecoration: "none",
              transition: "border-color 150ms ease, background 150ms ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.7)";
              e.currentTarget.style.background = "rgba(255,255,255,0.06)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.35)";
              e.currentTarget.style.background = "transparent";
            }}
          >
            View Pricing
          </Link>
        </div>
        <p style={{ marginTop: 18, color: "#93c5fd", fontSize: 11 }}>
          No credit card · No account needed · Results in 3 seconds
        </p>
      </div>
    </section>
  );
};

export default HomeCTASection;
