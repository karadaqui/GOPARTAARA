type Stat = { value: string; label: string };

const stats: Stat[] = [
  { value: "1,000,000+", label: "Parts indexed" },
  { value: "7", label: "Live suppliers" },
  { value: "£43", label: "Avg saving today" },
  { value: "Free", label: "Always & forever" },
];

const SocialProofStats = () => (
  <section
    aria-label="Platform stats"
    style={{
      background: "linear-gradient(90deg, #0a1628 0%, #1d4ed8 100%)",
      padding: "28px 16px",
    }}
  >
    <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4">
      {stats.map((s, idx) => (
        <div
          key={s.label}
          style={{
            textAlign: "center",
            padding: "8px 12px",
            borderRight:
              idx < stats.length - 1 ? "1px solid rgba(255,255,255,0.1)" : "none",
          }}
          className={idx < 2 ? "border-b md:border-b-0" : ""}
        >
          <div
            style={{
              fontSize: "26px",
              fontWeight: 900,
              color: "#fbbf24",
              letterSpacing: "-0.02em",
              lineHeight: 1.1,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {s.value}
          </div>
          <div
            style={{
              fontSize: "10px",
              color: "#93c5fd",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginTop: "6px",
              fontWeight: 600,
            }}
          >
            {s.label}
          </div>
        </div>
      ))}
    </div>
  </section>
);

export default SocialProofStats;
