import { Search, BarChart3, ShoppingCart, Bell } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";

const steps = [
  {
    icon: Search,
    number: "01",
    title: "Search",
    desc: "Type a part name, upload a photo, or enter your reg plate. We'll handle the rest.",
  },
  {
    icon: BarChart3,
    number: "02",
    title: "Compare",
    desc: "See prices from trusted UK & global suppliers side by side. Filter by price, rating, and availability.",
  },
  {
    icon: ShoppingCart,
    number: "03",
    title: "Save",
    desc: "Order directly from your chosen supplier. No middleman, no markup — just the best deal.",
  },
  {
    icon: Bell,
    number: "04",
    title: "Save More",
    desc: "Set price alerts and get notified when parts drop to your target price. Never overpay again.",
  },
];

const HowItWorksSection = () => (
  <section className="py-12 md:py-16 relative overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-primary/[0.02] to-transparent pointer-events-none" />
    <div className="container px-4 md:px-6 lg:px-8 relative">
      <ScrollReveal className="text-center mb-8 md:mb-10" threshold={0.05}>
        <span className="inline-block text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-4">
          How It Works
        </span>
        <h2
          className="font-display text-3xl md:text-5xl mb-5"
          style={{ fontWeight: 800, letterSpacing: "-0.03em", color: "white" }}
        >
          Find &amp; Save in Minutes
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto text-base md:text-lg leading-relaxed">
          Finding the right car part shouldn't take hours. With GOPARTARA, it takes seconds.
        </p>
      </ScrollReveal>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-10 max-w-5xl mx-auto relative">
        {steps.map((s, i) => (
          <ScrollReveal key={s.title} delay={i + 1} threshold={0.05}>
            <div className="relative text-center group mb-6 md:mb-16 pt-6 md:pt-8">
              {/* Large background number */}
              <span
                className="hidden md:block absolute select-none pointer-events-none"
                style={{
                  fontSize: "72px",
                  fontWeight: 900,
                  color: "rgba(204,17,17,0.08)",
                  top: 0,
                  left: "50%",
                  transform: "translateX(-50%)",
                  zIndex: 0,
                  lineHeight: 1,
                }}
              >
                {s.number}
              </span>
              {/* Mobile number (smaller, top-right) */}
              <span className="md:hidden absolute -top-1 right-2 text-4xl font-black select-none pointer-events-none" style={{ color: "rgba(204,17,17,0.12)" }}>
                {s.number}
              </span>
              {/* Connecting dashed line — between steps (not after last) */}
              {i < steps.length - 1 && (
                <div
                  className="hidden md:block absolute pointer-events-none"
                  style={{
                    top: "64px",
                    left: "calc(50% + 36px)",
                    width: "calc(100% - 72px)",
                    borderTop: "1px dashed rgba(255,255,255,0.08)",
                    zIndex: 0,
                  }}
                />
              )}
              <div
                className="relative mx-auto mb-4 md:mb-6 flex h-14 w-14 md:h-16 md:w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-[colors,transform] group-hover:bg-primary/20 group-hover:scale-110"
                style={{ zIndex: 1 }}
              >
                <s.icon size={26} />
              </div>
              <h3 className="relative font-display text-lg md:text-xl font-bold mb-2 md:mb-3" style={{ zIndex: 1 }}>{s.title}</h3>
              <p className="relative text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto" style={{ zIndex: 1 }}>{s.desc}</p>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </div>
  </section>
);

export default HowItWorksSection;
