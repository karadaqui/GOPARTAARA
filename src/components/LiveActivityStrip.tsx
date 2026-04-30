const pillStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  background: "#ffffff",
  border: "1px solid #bbf7d0",
  color: "#15803d",
  fontSize: "12px",
  fontWeight: 600,
  padding: "4px 10px",
  borderRadius: "999px",
  whiteSpace: "nowrap",
};

const LiveActivityStrip = () => (
  <section
    aria-label="Live activity"
    style={{
      background: "#f0fdf4",
      borderBottom: "1px solid #dcfce7",
      padding: "10px 16px",
    }}
  >
    <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-center gap-2">
      <span
        style={{
          color: "#16a34a",
          fontSize: "11px",
          fontWeight: 800,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          marginRight: 4,
        }}
      >
        <span className="live-dot" style={{ marginRight: 6, verticalAlign: "middle" }} />
        Live
      </span>
      <span style={pillStyle}>🔥 Live prices from 7 suppliers</span>
      <span style={pillStyle}>⚡ 1,000,000+ parts searchable</span>
      <span style={pillStyle}>🔻 Price drops tracked automatically</span>
    </div>
  </section>
);

export default LiveActivityStrip;
