const PILLS = [
  "🔥 Live prices from 7 suppliers updated now",
  "⚡ 1,000,000+ parts searchable instantly",
  "🔻 Price drops tracked automatically",
];

const LiveActivityStrip = () => (
  <div
    style={{
      background: "#f0fdf4",
      borderBottom: "1px solid #dcfce7",
      padding: "10px 16px",
    }}
  >
    <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-center gap-2 md:gap-3">
      <span
        style={{
          fontSize: "10px",
          fontWeight: 800,
          color: "#16a34a",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
        }}
      >
        <span className="live-dot" style={{ marginRight: 6, verticalAlign: "middle" }} />
        Live
      </span>
      {PILLS.map((p) => (
        <span
          key={p}
          style={{
            background: "#dcfce7",
            color: "#166534",
            borderRadius: 999,
            padding: "4px 10px",
            fontSize: 11,
            fontWeight: 600,
            whiteSpace: "nowrap",
          }}
        >
          {p}
        </span>
      ))}
    </div>
  </div>
);

export default LiveActivityStrip;
