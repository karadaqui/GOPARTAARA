import { Fragment } from "react";
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
  <section className="animated-gradient-bg py-12 md:py-16 relative overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-primary/[0.02] to-transparent pointer-events-none" />
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: "200px",
        background:
          "radial-gradient(ellipse 60% 30% at 50% 0%, rgba(204, 17, 17, 0.06) 0%, transparent 70%)",
        pointerEvents: "none",
        zIndex: 0,
      }}
    />
    <div className="container px-4 md:px-6 lg:px-8 relative" style={{ zIndex: 1 }}>
      <ScrollReveal className="text-center mb-8 md:mb-10" threshold={0.05}>
        <span className="inline-block uppercase" style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.12em", color: "#cc1111", marginBottom: "12px" }}>
          How It Works
        </span>
        <h2 className="font-display text-2xl md:text-5xl font-bold mb-5 tracking-tight">
          Find &amp; Save in Minutes
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto text-base md:text-lg leading-relaxed">
          Finding the right car part shouldn't take hours. With GOPARTARA, it takes seconds.
        </p>
      </ScrollReveal>
      {/* Desktop: 4 columns with vertical dividers */}
      <div
        className="hidden md:grid max-w-5xl mx-auto"
        style={{
          gridTemplateColumns: "1fr 1px 1fr 1px 1fr 1px 1fr",
          gap: 0,
          padding: "0 40px",
        }}
      >
        {steps.map((s, i) => {
          const isSearch = s.title === "Search";
          const handleClick = () => {
            if (!isSearch) return;
            const el = document.getElementById("search");
            if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
          };
          return (
            <Fragment key={s.title}>
              <ScrollReveal delay={i + 1} threshold={0.05}>
                <div
                  role={isSearch ? "button" : undefined}
                  tabIndex={isSearch ? 0 : undefined}
                  onClick={handleClick}
                  onKeyDown={(e) => {
                    if (isSearch && (e.key === "Enter" || e.key === " ")) {
                      e.preventDefault();
                      handleClick();
                    }
                  }}
                  className={isSearch ? "cursor-pointer px-6" : "px-6"}
                >
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#3f3f46",
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                    }}
                  >
                    {s.number}
                  </div>
                  <h3
                    style={{
                      fontSize: "20px",
                      fontWeight: 700,
                      color: "#ffffff",
                      marginTop: "16px",
                    }}
                  >
                    {s.title}
                  </h3>
                  <p
                    style={{
                      color: "#71717a",
                      fontSize: "14px",
                      lineHeight: 1.7,
                      marginTop: "8px",
                    }}
                  >
                    {s.desc}
                  </p>
                </div>
              </ScrollReveal>
              {i < steps.length - 1 && (
                <div key={`divider-${i}`} style={{ width: "1px", background: "#1a1a1a", height: "100%" }} />
              )}
            </Fragment>
          );
        })}
      </div>

      {/* Mobile: stacked 2-column grid */}
      <div className="grid grid-cols-2 gap-6 md:hidden max-w-5xl mx-auto px-4">
        {steps.map((s, i) => {
          const isSearch = s.title === "Search";
          const handleClick = () => {
            if (!isSearch) return;
            const el = document.getElementById("search");
            if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
          };
          return (
            <ScrollReveal key={s.title} delay={i + 1} threshold={0.05}>
              <div
                role={isSearch ? "button" : undefined}
                tabIndex={isSearch ? 0 : undefined}
                onClick={handleClick}
                onKeyDown={(e) => {
                  if (isSearch && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    handleClick();
                  }
                }}
                className={isSearch ? "cursor-pointer" : ""}
              >
                <div style={{ fontSize: "11px", color: "#3f3f46", fontWeight: 700, letterSpacing: "0.1em" }}>
                  {s.number}
                </div>
                <h3 style={{ fontSize: "20px", fontWeight: 700, color: "#ffffff", marginTop: "16px" }}>
                  {s.title}
                </h3>
                <p style={{ color: "#71717a", fontSize: "14px", lineHeight: 1.7, marginTop: "8px" }}>
                  {s.desc}
                </p>
              </div>
            </ScrollReveal>
          );
        })}
      </div>
    </div>
  </section>
);

export default HowItWorksSection;
