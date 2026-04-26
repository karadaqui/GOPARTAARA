type Stat = {
  label: string;
  display: string;
};

const stats: Stat[] = [
  { label: "Parts searchable", display: "1,000,000+" },
  { label: "Live suppliers", display: "7" },
  { label: "Always available", display: "24/7" },
  { label: "Always free to use", display: "Free" },
];

const SocialProofStats = () => (
  <section
    aria-label="Platform stats"
    style={{
      borderTop: "1px solid #141414",
      borderBottom: "1px solid #141414",
    }}
  >
    <div
      style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "0 40px",
      }}
    >
      <div className="grid grid-cols-2 md:grid-cols-4">
        {stats.map((stat, idx) => (
          <div
            key={stat.label}
            className="text-center"
            style={{
              padding: "32px 0",
              borderRight:
                idx < stats.length - 1 ? "1px solid #141414" : "none",
            }}
          >
            <div
              style={{
                fontSize: "36px",
                fontWeight: 800,
                color: "#ffffff",
                letterSpacing: "-1px",
                lineHeight: 1,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {stat.display}
            </div>
            <div
              style={{
                fontSize: "12px",
                color: "#52525b",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                marginTop: "4px",
              }}
            >
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default SocialProofStats;
