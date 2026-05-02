import { Link } from "react-router-dom";

const ITEMS = [
  { part: "BMW Brake Pads", dealer: 127, ours: 42.78, off: 66 },
  { part: "VW Golf Clutch Kit", dealer: 340, ours: 112.5, off: 67 },
  { part: "Ford Focus Oil Filter", dealer: 28, ours: 4.99, off: 82 },
];

const fmt = (n: number) =>
  `£${n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function SavingsComparison() {
  return (
    <section className="px-4 py-16" style={{ background: "rgba(255,255,255,0.02)" }}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h2
            style={{ color: "#ffffff", fontSize: 32, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 8 }}
          >
            How much are dealers overcharging you?
          </h2>
          <p style={{ color: "#a1a1aa", fontSize: 16 }}>
            Real examples from our users this week
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {ITEMS.map((it) => {
            const saving = it.dealer - it.ours;
            return (
              <div
                key={it.part}
                className="rounded-xl p-5 transition-transform hover:-translate-y-0.5"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <div style={{ color: "#ffffff", fontSize: 16, fontWeight: 700, marginBottom: 14 }}>
                  {it.part}
                </div>

                <div className="flex items-center justify-between mb-2">
                  <span style={{ color: "#a1a1aa", fontSize: 13 }}>Dealer price</span>
                  <span
                    style={{
                      color: "#f87171",
                      fontSize: 16,
                      fontWeight: 600,
                      textDecoration: "line-through",
                    }}
                  >
                    {fmt(it.dealer)}
                  </span>
                </div>

                <div className="flex items-center justify-between mb-3">
                  <span style={{ color: "#a1a1aa", fontSize: 13 }}>GOPARTARA</span>
                  <span style={{ color: "#22c55e", fontSize: 22, fontWeight: 800 }}>
                    {fmt(it.ours)}
                  </span>
                </div>

                <div
                  className="flex items-center justify-between rounded-lg px-3 py-2"
                  style={{
                    background: "rgba(251,191,36,0.12)",
                    border: "1px solid rgba(251,191,36,0.3)",
                  }}
                >
                  <span style={{ color: "#fbbf24", fontSize: 13, fontWeight: 600 }}>
                    You save
                  </span>
                  <span style={{ color: "#fbbf24", fontSize: 15, fontWeight: 800 }}>
                    {fmt(saving)} ({it.off}% off)
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-8">
          <Link
            to="/search"
            className="inline-flex items-center gap-2 transition-opacity hover:opacity-90"
            style={{
              background: "#fbbf24",
              color: "#0a1628",
              padding: "12px 24px",
              borderRadius: 10,
              fontSize: 15,
              fontWeight: 700,
            }}
          >
            Find your part →
          </Link>
        </div>
      </div>
    </section>
  );
}
