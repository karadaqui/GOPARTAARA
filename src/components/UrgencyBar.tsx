// Slim full-width urgency bar that sits above the navbar on every page.
const UrgencyBar = () => (
  <div
    role="region"
    aria-label="Live platform stats"
    style={{
      background: "#0a1628",
      color: "#bfdbfe",
      fontSize: "11px",
      lineHeight: 1.2,
      padding: "6px 16px",
      textAlign: "center",
      fontWeight: 500,
      letterSpacing: "0.01em",
      whiteSpace: "nowrap",
      overflowX: "auto",
    }}
  >
    🔥 Live price comparison · 💰 Average savings up to{" "}
    <strong style={{ color: "#fde68a", fontWeight: 700 }}>£43 per part</strong> · ⚡ 7
    suppliers checked simultaneously
  </div>
);

export default UrgencyBar;
