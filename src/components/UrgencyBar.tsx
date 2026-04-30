const UrgencyBar = () => (
  <div
    style={{
      background: "#0a1628",
      padding: "8px 0",
      textAlign: "center",
      fontSize: "11px",
      color: "#bfdbfe",
      lineHeight: 1.4,
    }}
  >
    <span>🔥 </span>
    <strong style={{ color: "#fde68a", fontWeight: 700 }}>Live price comparison</strong>
    <span> · 💰 Average savings up to </span>
    <strong style={{ color: "#fde68a", fontWeight: 700 }}>£43 per part</strong>
    <span> · ⚡ </span>
    <strong style={{ color: "#fde68a", fontWeight: 700 }}>7 suppliers</strong>
    <span> checked simultaneously</span>
  </div>
);

export default UrgencyBar;
