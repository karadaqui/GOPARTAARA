import { Fragment } from "react";

const STEPS = [
  { n: "01", title: "Search", desc: "Type a part name, your reg plate, or VIN number." },
  { n: "02", title: "Compare", desc: "See live prices from 7 UK suppliers side by side." },
  { n: "03", title: "Save", desc: "Order direct from the cheapest listing. No markup." },
];

const HowItWorksBig = () => (
  <section
    style={{
      padding: "60px 0",
      borderBottom: "1px solid #1a1a1a",
    }}
  >
    <div
      style={{
        fontFamily: '"DM Sans", system-ui, sans-serif',
        fontWeight: 600,
        fontSize: "11px",
        color: "#cc1111",
        letterSpacing: "0.25em",
        textAlign: "center",
        marginBottom: "40px",
        textTransform: "uppercase",
      }}
    >
      How It Works
    </div>
    <div
      className="hiw-grid"
      style={{
        maxWidth: "1000px",
        margin: "0 auto",
        padding: "0 24px",
        display: "grid",
        gridTemplateColumns: "1fr 1px 1fr 1px 1fr",
        alignItems: "start",
        gap: 0,
      }}
    >
      {STEPS.map((s, i) => (
        <Fragment key={s.n}>
          <div style={{ padding: "0 32px", textAlign: "left" }}>
            <div
              style={{
                fontFamily: '"Barlow Condensed", system-ui, sans-serif',
                fontWeight: 800,
                fontSize: "48px",
                color: "rgba(204,17,17,0.2)",
                lineHeight: 1,
                letterSpacing: "-0.02em",
              }}
            >
              {s.n}
            </div>
            <h3
              style={{
                fontFamily: '"Barlow Condensed", system-ui, sans-serif',
                fontWeight: 700,
                fontSize: "24px",
                color: "#ffffff",
                margin: "12px 0 8px",
                letterSpacing: "-0.01em",
              }}
            >
              {s.title}
            </h3>
            <p
              style={{
                fontFamily: '"DM Sans", system-ui, sans-serif',
                fontWeight: 400,
                fontSize: "14px",
                color: "#666666",
                lineHeight: 1.6,
                maxWidth: "240px",
                margin: 0,
              }}
            >
              {s.desc}
            </p>
          </div>
          {i < STEPS.length - 1 && (
            <div style={{ width: "1px", height: "120px", background: "#1a1a1a", alignSelf: "center" }} />
          )}
        </Fragment>
      ))}
    </div>
    <style>{`
      @media (max-width: 768px) {
        .hiw-grid {
          grid-template-columns: 1fr !important;
          gap: 32px !important;
        }
        .hiw-grid > div[style*="width: 1px"] {
          display: none !important;
        }
      }
    `}</style>
  </section>
);

export default HowItWorksBig;
