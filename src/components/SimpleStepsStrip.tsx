const steps = [
  { n: "01", title: "Search", desc: "Type a part name, reg plate, or VIN" },
  { n: "02", title: "Compare", desc: "See prices from 7 UK suppliers side by side" },
  { n: "03", title: "Buy", desc: "Click through to the cheapest listing. Done." },
];

const SimpleStepsStrip = () => (
  <section
    style={{
      borderTop: "1px solid #1a1a1a",
      borderBottom: "1px solid #1a1a1a",
      padding: "32px 0",
      margin: "40px auto",
      maxWidth: "780px",
    }}
  >
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1px 1fr 1px 1fr",
        alignItems: "center",
      }}
      className="simple-steps-grid"
    >
      {steps.map((s, i) => (
        <>
          <div key={s.n} style={{ padding: "0 24px", textAlign: "left" }}>
            <div
              style={{
                fontFamily: '"DM Sans", system-ui, sans-serif',
                fontSize: "11px",
                fontWeight: 700,
                color: "#cc1111",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                marginBottom: "8px",
              }}
            >
              {s.n} — {s.title}
            </div>
            <div
              style={{
                fontFamily: '"DM Sans", system-ui, sans-serif',
                fontSize: "13px",
                fontWeight: 400,
                color: "#666666",
                lineHeight: 1.5,
              }}
            >
              {s.desc}
            </div>
          </div>
          {i < steps.length - 1 && (
            <div key={`d-${i}`} style={{ width: "1px", height: "48px", background: "#1a1a1a" }} />
          )}
        </>
      ))}
    </div>
    <style>{`
      @media (max-width: 640px) {
        .simple-steps-grid {
          grid-template-columns: 1fr !important;
          gap: 24px;
        }
        .simple-steps-grid > div[style*="width: 1px"] {
          display: none;
        }
      }
    `}</style>
  </section>
);

export default SimpleStepsStrip;
