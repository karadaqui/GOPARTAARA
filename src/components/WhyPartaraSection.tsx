const COMPETITORS = ["GOPARTARA", "carpartscompare.uk", "whatpart.co.uk", "compare.parts"] as const;

type Cell = string | true | false;

const ROWS: { feature: string; values: [Cell, Cell, Cell, Cell] }[] = [
  { feature: "Suppliers searched", values: ["7 live", "3", "2", "4"] },
  { feature: "Photo search", values: [true, false, false, false] },
  { feature: "VIN search", values: [true, false, false, false] },
  { feature: "UK Reg plate", values: [true, true, true, false] },
  { feature: "Price alerts", values: [true, false, false, false] },
  { feature: "My Garage", values: [true, false, false, false] },
  { feature: "EU suppliers", values: [true, false, false, false] },
  { feature: "Free to use", values: [true, true, true, true] },
  { feature: "P2P Marketplace", values: [true, false, false, true] },
];

const renderCell = (value: Cell, isPartara: boolean, feature?: string) => {
  if (value === true) {
    return <span style={{ color: "#4ade80", fontSize: "18px", fontWeight: 700 }}>✓</span>;
  }
  if (value === false) {
    return <span style={{ color: "#3f3f46", fontSize: "18px" }}>✗</span>;
  }
  const isSuppliersGopartara = isPartara && feature === "Suppliers searched";
  return (
    <span
      style={{
        color: isSuppliersGopartara ? "#4ade80" : isPartara ? "#ffffff" : "#a1a1aa",
        fontSize: "14px",
        fontWeight: isPartara ? 700 : 500,
      }}
    >
      {value}
    </span>
  );
};

const WhyPartaraSection = () => {
  return (
    <section className="px-4 py-20 md:py-28">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <p
            style={{
              color: "#cc1111",
              fontSize: "13px",
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              marginBottom: "16px",
            }}
          >
            WHY GOPARTARA
          </p>
          <h2 className="text-4xl md:text-5xl font-extrabold text-foreground mb-4 tracking-tight">
            The only search that covers them all.
          </h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            While others search one site, we search seven simultaneously.
          </p>
        </div>

        {/* Table */}
        <div
          className="overflow-x-auto"
          style={{
            background: "#111111",
            border: "1px solid #1f1f1f",
            borderRadius: "16px",
          }}
        >
          <table className="w-full min-w-[680px]" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #1f1f1f", background: "#161616" }}>
                <th
                  className="text-left"
                  style={{
                    padding: "20px 24px",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#d4d4d8",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Feature
                </th>
                {COMPETITORS.map((name, idx) => {
                  const isPartara = idx === 0;
                  return (
                    <th
                      key={name}
                      className="text-center"
                      style={{
                        padding: "20px 16px",
                        fontSize: isPartara ? "14px" : "13px",
                        fontWeight: isPartara ? 700 : 500,
                        color: isPartara ? "#cc1111" : "#a1a1aa",
                        borderLeft: isPartara ? "2px solid #cc1111" : undefined,
                        background: isPartara ? "rgba(204,17,17,0.08)" : undefined,
                        letterSpacing: isPartara ? "0.02em" : undefined,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {name}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row, rowIdx) => {
                const rowBg = rowIdx % 2 === 0 ? "#111111" : "#0d0d0d";
                return (
                  <tr key={row.feature} style={{ background: rowBg }}>
                    <td
                      style={{
                        padding: "18px 24px",
                        fontSize: "14px",
                        fontWeight: 500,
                        color: "#ffffff",
                      }}
                    >
                      {row.feature}
                    </td>
                    {row.values.map((value, colIdx) => {
                      const isPartara = colIdx === 0;
                      return (
                        <td
                          key={`${row.feature}-${colIdx}`}
                          className="text-center"
                          style={{
                            padding: "18px 16px",
                            borderLeft: isPartara ? "2px solid #cc1111" : undefined,
                            background: isPartara ? "rgba(204,17,17,0.04)" : undefined,
                          }}
                        >
                          {renderCell(value, isPartara, row.feature)}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="text-center mt-8">
          <p
            style={{
              fontSize: "13px",
              color: "#a1a1aa",
              marginBottom: "12px",
            }}
          >
            GOPARTARA searches more suppliers than anyone. For free.
          </p>
          <a
            href="/search"
            className="inline-flex items-center justify-center transition-opacity hover:opacity-90"
            style={{
              background: "#cc1111",
              color: "#ffffff",
              fontSize: "14px",
              fontWeight: 600,
              padding: "12px 24px",
              borderRadius: "10px",
              textDecoration: "none",
            }}
          >
            Start Searching Free →
          </a>
        </div>

        <p
          className="text-center mt-6"
          style={{ fontSize: "12px", color: "#3f3f46" }}
        >
          Showing real features as of April 2026. We update this regularly.
        </p>
      </div>
    </section>
  );
};

export default WhyPartaraSection;
