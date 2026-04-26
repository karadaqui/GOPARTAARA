import ScrollReveal from "@/components/ScrollReveal";

const steps = [
  {
    n: "01",
    title: "Search any part",
    desc: "Type a part name, enter your reg plate, or upload a photo. We search 7 suppliers simultaneously.",
  },
  {
    n: "02",
    title: "Compare prices instantly",
    desc: "See all results ranked by price from UK and EU suppliers. Filter by condition, shipping, and supplier rating.",
  },
  {
    n: "03",
    title: "Buy or set an alert",
    desc: "Order directly from the cheapest supplier. Or set a target price — we'll email you the moment it drops.",
  },
];

const HowItWorksSection = () => (
  <section
    style={{
      maxWidth: "1200px",
      margin: "0 auto",
      padding: "64px 40px",
    }}
  >
    <ScrollReveal>
      <h2
        style={{
          fontSize: "clamp(32px, 5vw, 48px)",
          fontWeight: 800,
          letterSpacing: "-2px",
          color: "#ffffff",
          marginBottom: "48px",
          lineHeight: 1.05,
        }}
      >
        How it works
      </h2>
    </ScrollReveal>

    <div className="grid grid-cols-1 md:grid-cols-3">
      {steps.map((s, i) => (
        <ScrollReveal key={s.n} delay={i + 1}>
          <div
            style={{
              padding: "0 32px",
              borderRight:
                i < steps.length - 1 ? "1px solid #1a1a1a" : "none",
              paddingLeft: i === 0 ? 0 : "32px",
              paddingRight: i === steps.length - 1 ? 0 : "32px",
              marginBottom: "32px",
            }}
          >
            <span
              style={{
                fontSize: "11px",
                color: "#3f3f46",
                letterSpacing: "0.1em",
                fontWeight: 700,
              }}
            >
              {s.n}
            </span>
            <h3
              style={{
                fontSize: "22px",
                fontWeight: 700,
                color: "#ffffff",
                marginTop: "12px",
                letterSpacing: "-0.5px",
              }}
            >
              {s.title}
            </h3>
            <p
              style={{
                fontSize: "15px",
                color: "#71717a",
                lineHeight: 1.7,
                marginTop: "8px",
              }}
            >
              {s.desc}
            </p>
          </div>
        </ScrollReveal>
      ))}
    </div>
  </section>
);

export default HowItWorksSection;
