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
      background: "linear-gradient(90deg, #0a1628, #1d4ed8)",
      padding: "20px 16px",
    }}
  >
    <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4">
      {stats.map((stat, idx) => (
        <div
          key={stat.label}
          className="text-center px-3 py-2"
          style={{
            borderRight:
              idx < stats.length - 1
                ? "1px solid rgba(255,255,255,0.1)"
                : undefined,
          }}
        >
          <div
            style={{
              fontSize: 26,
              fontWeight: 900,
              color: "#fbbf24",
              lineHeight: 1.1,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {stat.value}
          </div>
          <div
            style={{
              fontSize: 10,
              color: "#93c5fd",
              marginTop: 4,
              fontWeight: 600,
              letterSpacing: "0.07em",
              textTransform: "uppercase",
            }}
          >
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  </section>
);

export default SocialProofStats;
