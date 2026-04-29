const SUPPLIERS = [
  { name: "eBay" },
  { name: "mytyres.co.uk" },
  { name: "Tyres UK" },
  { name: "Autodoc" },
  { name: "Amazon" },
  { name: "Euro Car Parts" },
  { name: "GSF Car Parts" },
];

const LiveSuppliers = () => (
  <section
    style={{
      padding: "60px 0",
      background: "#0d0d0d",
      borderTop: "1px solid #1a1a1a",
      borderBottom: "1px solid #1a1a1a",
    }}
  >
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 24px" }}>
      <div
        style={{
          fontFamily: '"DM Sans", system-ui, sans-serif',
          fontWeight: 600,
          fontSize: "11px",
          color: "#555555",
          letterSpacing: "0.25em",
          marginBottom: "24px",
          textTransform: "uppercase",
        }}
      >
        Live Suppliers
      </div>
      <div
        style={{
          display: "flex",
          flexWrap: "nowrap",
          overflowX: "auto",
          gap: "8px",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          WebkitOverflowScrolling: "touch",
          paddingBottom: "4px",
        }}
        className="suppliers-scroll"
      >
        {SUPPLIERS.map((s) => (
          <div
            key={s.name}
            style={{
              background: "#111111",
              border: "1px solid #242424",
              borderRadius: "3px",
              padding: "10px 20px",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontFamily: '"DM Sans", system-ui, sans-serif',
                fontWeight: 500,
                fontSize: "13px",
                color: "#888888",
              }}
            >
              {s.name}
            </span>
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "#22c55e",
                boxShadow: "0 0 6px rgba(34,197,94,0.6)",
              }}
            />
          </div>
        ))}
        <div
          style={{
            background: "transparent",
            border: "1px dashed #242424",
            borderRadius: "3px",
            padding: "10px 20px",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            flexShrink: 0,
            color: "#333333",
            fontFamily: '"DM Sans", system-ui, sans-serif',
            fontWeight: 500,
            fontSize: "13px",
          }}
        >
          + more coming soon
        </div>
      </div>
    </div>
    <style>{`
      .suppliers-scroll::-webkit-scrollbar { display: none; }
    `}</style>
  </section>
);

export default LiveSuppliers;
