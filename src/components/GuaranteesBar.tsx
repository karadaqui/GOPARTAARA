const ITEMS = [
  "🔒 Secure & encrypted",
  "💸 Always free to search",
  "⚡ Live price data",
  "🌍 7 global suppliers",
  "✅ No spam, ever",
];

const GuaranteesBar = () => (
  <section
    style={{
      background: "#ffffff",
      borderTop: "1px solid #e2e8f0",
      borderBottom: "1px solid #e2e8f0",
      padding: "20px 16px",
    }}
  >
    <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-center gap-x-7 gap-y-3">
      {ITEMS.map((i) => (
        <div
          key={i}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            color: "#166534",
            fontWeight: 700,
            fontSize: 12,
            whiteSpace: "nowrap",
          }}
        >
          {i}
        </div>
      ))}
    </div>
  </section>
);

export default GuaranteesBar;
