// Featured Supplier Spotlight — The Green Spark Plug Co. (Awin affiliate)

const AFFILIATE_URL =
  "https://www.awin1.com/cread.php?awinmid=4200&awinaffid=2845282";

const FeaturedSupplierSpotlight = () => {
  return (
    <section className="px-4 py-8" aria-label="Featured supplier spotlight">
      <div
        className="max-w-5xl mx-auto"
        style={{
          background: "linear-gradient(135deg, rgba(251,191,36,0.06) 0%, rgba(255,255,255,0.03) 100%)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderLeft: "4px solid #fbbf24",
          borderRadius: 16,
          padding: "20px 22px",
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#fbbf24",
            }}
          >
            ★ Featured Supplier Spotlight
          </span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center gap-5">
          {/* Logo + name */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div
              className="flex items-center justify-center"
              style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                background: "rgba(251,191,36,0.12)",
                border: "1px solid rgba(251,191,36,0.25)",
                fontSize: 28,
              }}
              aria-hidden="true"
            >
              🔩
            </div>
            <div>
              <h3
                className="font-display"
                style={{ color: "#ffffff", fontSize: 18, fontWeight: 700, letterSpacing: "-0.01em", margin: 0 }}
              >
                The Green Spark Plug Co.
              </h3>
              <span
                className="inline-flex items-center gap-1 mt-1"
                style={{
                  background: "rgba(0,182,122,0.12)",
                  border: "1px solid rgba(0,182,122,0.35)",
                  color: "#22c55e",
                  fontSize: 11,
                  fontWeight: 600,
                  padding: "3px 10px",
                  borderRadius: 999,
                }}
              >
                🚚 Free UK delivery on orders £59+
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="flex-1 min-w-0">
            <p style={{ color: "#e4e4e7", fontSize: 14, fontWeight: 500, margin: 0, marginBottom: 4 }}>
              Classic and specialist car parts from one of the UK's most trusted independent suppliers.
            </p>
            <p style={{ color: "#a1a1aa", fontSize: 12, margin: 0 }}>
              25,000+ products · Ships worldwide · Est. 1980 · NGK · Bosch · Denso · Valeo
            </p>
          </div>

          {/* CTA */}
          <div className="flex-shrink-0">
            <a
              href={AFFILIATE_URL}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="inline-flex items-center gap-2 transition-transform hover:translate-x-0.5"
              style={{
                background: "#fbbf24",
                color: "#0a1628",
                fontSize: 13,
                fontWeight: 700,
                padding: "10px 18px",
                borderRadius: 10,
                whiteSpace: "nowrap",
                boxShadow: "0 4px 14px rgba(251,191,36,0.25)",
              }}
            >
              Shop Green Spark Plug Co. →
            </a>
          </div>
        </div>

        <p
          style={{
            color: "#52525b",
            fontSize: 10,
            marginTop: 12,
            marginBottom: 0,
            textAlign: "center",
          }}
        >
          Affiliate partnership · GOPARTARA may earn a commission on qualifying orders
        </p>
      </div>
    </section>
  );
};

export default FeaturedSupplierSpotlight;
