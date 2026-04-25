type Stat = {
  label: string;
  display: string;
  accent?: boolean;
};

// Hardcoded marketing numbers — DO NOT fetch from database.
const stats: Stat[] = [
  { label: "Parts searchable", display: "1,000,000+" },
  { label: "Live suppliers", display: "7", accent: true },
  { label: "Always available", display: "24/7" },
  { label: "Always free to use", display: "Free" },
];

const StatCell = ({ stat }: { stat: Stat }) => (
  <div
    className="bento-tile"
    style={{
      background: "#0d0d0d",
      border: "1px solid #1a1a1a",
      borderRadius: "16px",
      padding: "28px 32px",
      display: "flex",
      flexDirection: "column",
      gap: "6px",
      borderTop: "2px solid #1a1a1a",
      transition: "border-top-color 200ms ease, background-color 200ms ease",
    }}
  >
    <div
      style={{
        fontSize: "clamp(32px, 4vw, 44px)",
        fontWeight: 900,
        color: stat.accent ? "#cc1111" : "#ffffff",
        lineHeight: 1.0,
        letterSpacing: "-0.03em",
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {stat.display}
    </div>
    <div
      style={{
        fontSize: "12px",
        color: "#52525b",
        fontWeight: 500,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
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
      padding: "48px 0",
      background: "transparent",
    }}
  >
    <div className="max-w-6xl mx-auto px-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {stats.map((stat) => (
          <StatCell key={stat.label} stat={stat} />
        ))}
      </div>
    </div>
    <style>{`
      .bento-tile:hover {
        border-top-color: #cc1111 !important;
        background: #101010 !important;
      }
    `}</style>
  </section>
);

export default SocialProofStats;
