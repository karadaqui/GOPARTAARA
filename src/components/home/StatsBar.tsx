import { Fragment } from "react";

const STATS = [
  { value: "1,000,000+", label: "Parts" },
  { value: "7", label: "Suppliers" },
  { value: "Free", label: "To use" },
  { value: "3", label: "Free searches" },
];

const StatsBar = () => (
  <section
    style={{
      background: "#0d0d0d",
      borderTop: "1px solid #1a1a1a",
      borderBottom: "1px solid #1a1a1a",
      padding: "20px 0",
      margin: "40px 0 0",
    }}
  >
    <div
      className="stats-bar-grid"
      style={{
        maxWidth: "1100px",
        margin: "0 auto",
        padding: "0 24px",
        display: "grid",
        gridTemplateColumns: "1fr 1px 1fr 1px 1fr 1px 1fr",
        alignItems: "center",
        gap: 0,
      }}
    >
      {STATS.map((s, i) => (
        <Fragment key={s.label}>
          <div style={{ textAlign: "center", padding: "0 12px" }}>
            <div
              style={{
                fontFamily: '"Barlow Condensed", system-ui, sans-serif',
                fontWeight: 700,
                fontSize: "28px",
                color: "#ffffff",
                lineHeight: 1.1,
                letterSpacing: "-0.01em",
              }}
            >
              {s.value}
            </div>
            <div
              style={{
                fontFamily: '"DM Sans", system-ui, sans-serif',
                fontWeight: 400,
                fontSize: "12px",
                color: "#555555",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginTop: "4px",
              }}
            >
              {s.label}
            </div>
          </div>
          {i < STATS.length - 1 && (
            <div style={{ width: "1px", height: "40px", background: "#1a1a1a" }} />
          )}
        </Fragment>
      ))}
    </div>
    <style>{`
      @media (max-width: 640px) {
        .stats-bar-grid {
          grid-template-columns: 1fr 1fr !important;
          gap: 16px !important;
        }
        .stats-bar-grid > div[style*="width: 1px"] {
          display: none !important;
        }
      }
    `}</style>
  </section>
);

export default StatsBar;
