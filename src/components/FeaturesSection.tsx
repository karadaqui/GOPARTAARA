import ScrollReveal from "@/components/ScrollReveal";

type Cell = {
  label: string;
  title: string;
  desc: string;
  colSpan: string;
};

const cells: Cell[] = [
  {
    label: "Photo Search",
    title: "Point. Snap. Find.",
    desc: "Upload a photo of any car part — we identify it instantly and find the cheapest price across 7 suppliers.",
    colSpan: "1 / 3",
  },
  {
    label: "UK Reg Plate",
    title: "Your car. Exact parts.",
    desc: "Enter your registration and instantly see only parts compatible with your specific vehicle.",
    colSpan: "3 / 4",
  },
  {
    label: "Price Alerts",
    title: "Never overpay again.",
    desc: "Set a target price. Get an email the moment any supplier drops below it.",
    colSpan: "1 / 2",
  },
  {
    label: "My Garage",
    title: "All your vehicles, one place.",
    desc: "Save your cars, filter searches by vehicle, track MOT and tax dates, and manage service history.",
    colSpan: "2 / 4",
  },
];

const FeaturesSection = () => {
  return (
    <section className="py-12 md:py-16">
      <div className="container px-6 md:px-4">
        <ScrollReveal className="text-center mb-16">
          <span
            className="inline-block uppercase"
            style={{
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.12em",
              color: "#cc1111",
              marginBottom: "12px",
            }}
          >
            Features
          </span>
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-5 tracking-tight">
            Everything You Need to Find the Right Part
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
            From search to purchase, GOPARTARA gives you the tools to find, compare, and buy car parts faster.
          </p>
        </ScrollReveal>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "1px",
            backgroundColor: "#1a1a1a",
            borderRadius: "16px",
            overflow: "hidden",
            maxWidth: "1200px",
            margin: "40px auto 0",
          }}
          className="features-bento-grid"
        >
          {cells.map((c) => (
            <div
              key={c.label}
              style={{
                background: "#0c0c0c",
                padding: "36px 40px",
                gridColumn: c.colSpan,
              }}
              className="features-bento-cell"
            >
              <p
                style={{
                  fontSize: "11px",
                  color: "#52525b",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  margin: 0,
                }}
              >
                {c.label}
              </p>
              <h3
                style={{
                  fontSize: "24px",
                  fontWeight: 700,
                  color: "white",
                  margin: "12px 0 8px",
                  letterSpacing: "-0.5px",
                }}
              >
                {c.title}
              </h3>
              <p style={{ fontSize: "14px", color: "#71717a", lineHeight: 1.7, margin: 0 }}>
                {c.desc}
              </p>
            </div>
          ))}
        </div>

        <style>{`
          @media (max-width: 768px) {
            .features-bento-grid {
              grid-template-columns: 1fr !important;
            }
            .features-bento-cell {
              grid-column: 1 / -1 !important;
              padding: 28px 24px !important;
            }
          }
        `}</style>
      </div>
    </section>
  );
};

export default FeaturesSection;
