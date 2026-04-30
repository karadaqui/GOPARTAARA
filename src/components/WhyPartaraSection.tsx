import ScrollReveal from "@/components/ScrollReveal";

const CARDS = [
  {
    icon: "⚡",
    title: "7 suppliers, one search",
    desc: "We instantly query eBay, Amazon, Green Spark Plug Co., Tyres UK, mytyres.co.uk, EV King and more — simultaneously.",
    proof: "Most rivals only check 2–3 sites.",
  },
  {
    icon: "💸",
    title: "Save up to £43 per part",
    desc: "Live price comparison with strikethrough was-prices and savings highlighted in green so you always pick the best deal.",
    proof: "Average dealer markup is £65–£90.",
  },
  {
    icon: "🔒",
    title: "Free, secure, no signup",
    desc: "Search 1,000,000+ parts without creating an account. SSL encrypted. No card on file. No spam.",
    proof: "100% free to search — always.",
  },
];

const WhyPartaraSection = () => {
  return (
    <section
      style={{
        background: "#f8fafc",
        borderTop: "1px solid #e2e8f0",
        padding: "40px 16px",
      }}
    >
      <div className="max-w-6xl mx-auto">
        <ScrollReveal className="text-center mb-8">
          <p
            style={{
              color: "#cc1111",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              marginBottom: 10,
            }}
          >
            Why GOPARTARA
          </p>
          <h2
            style={{
              fontSize: "clamp(22px, 4vw, 32px)",
              fontWeight: 800,
              color: "#0f172a",
              letterSpacing: "-0.02em",
            }}
          >
            The only search that covers them all.
          </h2>
          <p style={{ color: "#64748b", fontSize: 14, marginTop: 8 }}>
            While others search one site, we search seven simultaneously.
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {CARDS.map((c) => (
            <div
              key={c.title}
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 12,
                padding: 18,
              }}
            >
              <div style={{ fontSize: 26, marginBottom: 10 }}>{c.icon}</div>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>
                {c.title}
              </h3>
              <p style={{ fontSize: 12, color: "#64748b", lineHeight: 1.55 }}>{c.desc}</p>
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#16a34a",
                  marginTop: 12,
                  paddingTop: 10,
                  borderTop: "1px solid #f1f5f9",
                }}
              >
                ✓ {c.proof}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyPartaraSection;
