import { useNavigate } from "react-router-dom";

const MAKES = [
  "BMW",
  "Ford",
  "Volkswagen",
  "Vauxhall",
  "Toyota",
  "Honda",
  "Audi",
  "Mercedes",
  "Peugeot",
  "Renault",
];

const BrowseByMakeSection = () => {
  const navigate = useNavigate();

  return (
    <section className="px-4 mb-10">
      <div className="max-w-5xl mx-auto">
        <p
          style={{
            color: "#52525b",
            fontSize: "12px",
            fontWeight: 600,
            letterSpacing: "0.04em",
            marginBottom: "20px",
          }}
        >
          03 — Browse by make
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {MAKES.map((make) => (
            <button
              key={make}
              type="button"
              onClick={() => navigate(`/search?q=${encodeURIComponent(`${make} parts`)}`)}
              className="make-card text-left"
              style={{
                background: "#0d0d0d",
                border: "1px solid #1a1a1a",
                borderRadius: "12px",
                padding: "16px 20px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "14px",
                transition: "border-color 200ms, background-color 200ms",
              }}
            >
              <span
                className="make-monogram"
                style={{
                  background: "#151515",
                  border: "1px solid #222222",
                  borderRadius: "8px",
                  width: "44px",
                  height: "44px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                  fontSize: "20px",
                  fontWeight: 900,
                  flexShrink: 0,
                  letterSpacing: "-0.02em",
                  transition: "background-color 200ms, border-color 200ms, color 200ms",
                }}
              >
                {make[0]}
              </span>
              <span style={{ display: "flex", flexDirection: "column", gap: "2px", minWidth: 0 }}>
                <span
                  style={{
                    color: "#ffffff",
                    fontSize: "15px",
                    fontWeight: 700,
                    letterSpacing: "-0.01em",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {make}
                </span>
                <span style={{ color: "#52525b", fontSize: "12px", fontWeight: 500 }}>
                  View parts →
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>
      <style>{`
        .make-card:hover {
          border-color: #cc1111 !important;
          background: #101010 !important;
        }
        .make-card:hover .make-monogram {
          background: rgba(204,17,17,0.1) !important;
          border-color: rgba(204,17,17,0.3) !important;
          color: #ffffff !important;
        }
      `}</style>
    </section>
  );
};

export default BrowseByMakeSection;
