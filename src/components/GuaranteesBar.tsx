const items = [
  "🔒 Secure & encrypted",
  "💸 Always free",
  "⚡ Live price data",
  "🌍 7 global suppliers",
  "✅ No spam",
];

const GuaranteesBar = () => (
  <section
    aria-label="Guarantees"
    style={{
      background: "#ffffff",
      borderTop: "1px solid #e2e8f0",
      borderBottom: "1px solid #e2e8f0",
      padding: "16px",
    }}
  >
    <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
      {items.map((item) => (
        <span
          key={item}
          style={{
            fontSize: "13px",
            color: "#475569",
            fontWeight: 500,
            whiteSpace: "nowrap",
          }}
        >
          {item}
        </span>
      ))}
    </div>
  </section>
);

export default GuaranteesBar;
