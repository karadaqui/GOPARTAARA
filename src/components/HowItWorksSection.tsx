import ScrollReveal from "@/components/ScrollReveal";

const steps = [
  {
    number: "01",
    title: "Search",
    desc: "Type a part name, upload a photo, or enter your reg plate. We'll handle the rest.",
  },
  {
    number: "02",
    title: "Compare",
    desc: "See prices from trusted UK & global suppliers side by side. Filter by price, rating, and availability.",
  },
  {
    number: "03",
    title: "Save",
    desc: "Order directly from your chosen supplier. No middleman, no markup — just the best deal.",
  },
  {
    number: "04",
    title: "Save More",
    desc: "Set price alerts and get notified when parts drop to your target price. Never overpay again.",
  },
];

const HowItWorksSection = () => (
  <section className="py-20 md:py-28 relative overflow-hidden">
    <div className="container px-4 md:px-6 lg:px-8 relative">
      <ScrollReveal className="text-center mb-16 md:mb-20" threshold={0.05}>
        <span className="ds-eyebrow">How It Works</span>
        <h2 className="ds-h2 mt-2 mb-5">Four Simple Steps</h2>
        <p className="ds-body max-w-xl mx-auto">
          Finding the right car part shouldn't take hours. With GOPARTARA, it takes seconds.
        </p>
      </ScrollReveal>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-14 md:gap-y-20 max-w-4xl mx-auto">
        {steps.map((s, i) => (
          <ScrollReveal key={s.title} delay={i + 1} threshold={0.05}>
            <div className="relative pl-2 sm:pl-0">
              {/* Massive ghost number behind */}
              <span
                aria-hidden="true"
                className="absolute select-none pointer-events-none"
                style={{
                  top: "-28px",
                  left: "-8px",
                  fontSize: "120px",
                  fontWeight: 800,
                  color: "#cc1111",
                  opacity: 0.12,
                  letterSpacing: "-0.04em",
                  lineHeight: 1,
                  fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif",
                }}
              >
                {s.number}
              </span>

              {/* Foreground content */}
              <div className="relative">
                <span
                  className="block mb-3"
                  style={{
                    color: "#cc1111",
                    fontSize: "13px",
                    fontWeight: 600,
                    letterSpacing: "0.12em",
                  }}
                >
                  STEP {String(i + 1).padStart(2, "0")}
                </span>
                <h3
                  className="mb-3"
                  style={{
                    color: "#ffffff",
                    fontSize: "22px",
                    fontWeight: 600,
                    letterSpacing: "-0.01em",
                    lineHeight: 1.2,
                  }}
                >
                  {s.title}
                </h3>
                <p
                  style={{
                    color: "#71717a",
                    fontSize: "14px",
                    lineHeight: 1.6,
                    maxWidth: "320px",
                  }}
                >
                  {s.desc}
                </p>
              </div>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </div>
  </section>
);

export default HowItWorksSection;
