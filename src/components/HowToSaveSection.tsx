// "Find. Compare. Save." — 3-step how-it-works guide for the Homepage

const STEPS = [
  {
    icon: "🔍",
    title: "Search",
    description:
      "Type a part name, snap a photo, or enter your reg plate. We check all 7 suppliers instantly.",
  },
  {
    icon: "⚖️",
    title: "Compare",
    description:
      "See prices side by side from eBay, mytyres, Green Spark Plug Co. and more. No hidden fees.",
  },
  {
    icon: "💰",
    title: "Save",
    description:
      "Click through to the cheapest supplier and buy directly. We never mark up the price.",
  },
];

const HowToSaveSection = () => {
  return (
    <section className="px-4 py-14" aria-label="How to save money with GOPARTARA">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <p
            style={{
              fontSize: 11,
              color: "#cc1111",
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            How it works
          </p>
          <h2
            className="font-display"
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: "#ffffff",
              letterSpacing: "-0.02em",
              margin: 0,
            }}
          >
            Find. Compare. Save.
          </h2>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connecting line (desktop only) */}
          <div
            aria-hidden="true"
            className="hidden md:block absolute top-7 left-[16.66%] right-[16.66%] h-px"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, rgba(251,191,36,0.4) 20%, rgba(251,191,36,0.4) 80%, transparent 100%)",
            }}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-4 relative">
            {STEPS.map((step, i) => (
              <div
                key={step.title}
                className="relative flex flex-col items-center text-center"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 16,
                  padding: "28px 22px 24px",
                }}
              >
                {/* Numbered badge */}
                <div
                  className="flex items-center justify-center mb-3"
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    background: "#0a0a0a",
                    border: "1px solid rgba(251,191,36,0.4)",
                    fontSize: 24,
                    position: "relative",
                    zIndex: 1,
                  }}
                  aria-hidden="true"
                >
                  {step.icon}
                  <span
                    style={{
                      position: "absolute",
                      top: -6,
                      right: -6,
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      background: "#fbbf24",
                      color: "#0a0a0a",
                      fontSize: 11,
                      fontWeight: 800,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      lineHeight: 1,
                    }}
                  >
                    {i + 1}
                  </span>
                </div>

                <h3
                  style={{
                    color: "#ffffff",
                    fontSize: 17,
                    fontWeight: 700,
                    letterSpacing: "-0.01em",
                    marginBottom: 8,
                  }}
                >
                  {step.title}
                </h3>
                <p
                  style={{
                    color: "#a1a1aa",
                    fontSize: 13,
                    lineHeight: 1.55,
                    margin: 0,
                  }}
                >
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowToSaveSection;
