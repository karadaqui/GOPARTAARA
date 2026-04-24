const stats = [
  { value: "1,000,000+", label: "Parts searchable" },
  { value: "7", label: "Live suppliers" },
  { value: "50,000+", label: "Users worldwide" },
  { value: "Free", label: "Always free to use" },
];

const SocialProofStats = () => {
  return (
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
        <div className="grid grid-cols-2 md:grid-cols-4">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className="text-center py-2 px-4"
              style={{
                borderRight:
                  i < stats.length - 1 ? "1px solid #1f1f1f" : "none",
              }}
            >
              <div
                style={{
                  fontSize: "28px",
                  fontWeight: 700,
                  color: "#ffffff",
                  lineHeight: 1.1,
                }}
              >
                {stat.value}
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
          ))}
        </div>
      </div>
    </section>
  );
};

export default SocialProofStats;
