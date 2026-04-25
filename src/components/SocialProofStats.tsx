type Stat = {
  label: string;
  display: string;
};

// Hardcoded marketing numbers — DO NOT fetch from database.
const stats: Stat[] = [
  { label: "Parts searchable", display: "1,000,000+" },
  { label: "Live suppliers", display: "7" },
  { label: "Always available", display: "24/7" },
  { label: "Always free to use", display: "Free" },
];

const StatCell = ({ stat }: { stat: Stat }) => (
  <div className="stats-cell text-center py-2 px-4">
    <div
      style={{
        fontSize: "28px",
        fontWeight: 700,
        color: "#ffffff",
        lineHeight: 1.1,
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {stat.display}
    </div>
    <div
      style={{
        fontSize: "12px",
        color: "#52525b",
        marginTop: "2px",
        fontWeight: 400,
        letterSpacing: "0.04em",
      }}
    >
      {stat.label}
    </div>
  </div>
);

const SocialProofStats = () => (
  <section
    aria-label="Platform stats"
    style={{
      borderTop: "1px solid #1f1f1f",
      borderBottom: "1px solid #1f1f1f",
      padding: "20px 0",
      background: "transparent",
    }}
  >
    <div className="max-w-6xl mx-auto px-4">
      <div className="stats-grid grid grid-cols-2 md:grid-cols-4">
        {stats.map((stat) => (
          <StatCell key={stat.label} stat={stat} />
        ))}
      </div>
    </div>
  </section>
);

export default SocialProofStats;
