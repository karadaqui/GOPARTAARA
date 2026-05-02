// "Why drivers trust us" — 3-column trust section for the Homepage

const TRUST_POINTS = [
  {
    icon: "🔒",
    title: "We never mark up prices",
    description: "We show you the exact price from the supplier. No hidden fees, ever.",
  },
  {
    icon: "⚡",
    title: "Results in under 3 seconds",
    description: "Our search engine checks all 7 suppliers simultaneously, not one by one.",
  },
  {
    icon: "🎯",
    title: "Right part, right car",
    description: "Use your reg plate or VIN to filter parts guaranteed to fit your exact vehicle.",
  },
];

const WhyDriversTrustUs = () => {
  return (
    <section className="px-4 py-12" aria-label="Why drivers trust us">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <p
            style={{
              fontSize: 11,
              color: "#fbbf24",
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            Trust &amp; Transparency
          </p>
          <h2
            className="font-display"
            style={{
              fontSize: 26,
              fontWeight: 700,
              color: "#ffffff",
              letterSpacing: "-0.01em",
              margin: 0,
            }}
          >
            Why drivers trust us
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {TRUST_POINTS.map((point) => (
            <div
              key={point.title}
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 16,
                padding: "24px 22px",
              }}
            >
              <div
                className="flex items-center justify-center mb-4"
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: "rgba(251,191,36,0.10)",
                  border: "1px solid rgba(251,191,36,0.25)",
                  fontSize: 24,
                }}
                aria-hidden="true"
              >
                {point.icon}
              </div>
              <h3
                style={{
                  color: "#ffffff",
                  fontSize: 16,
                  fontWeight: 700,
                  letterSpacing: "-0.01em",
                  marginBottom: 6,
                }}
              >
                {point.title}
              </h3>
              <p
                style={{
                  color: "#a1a1aa",
                  fontSize: 13,
                  lineHeight: 1.55,
                  margin: 0,
                }}
              >
                {point.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyDriversTrustUs;
