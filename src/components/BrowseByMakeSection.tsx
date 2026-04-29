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
    <section className="px-4 mb-10 mt-10">
      <div className="max-w-4xl mx-auto">
        <div
          style={{
            fontFamily: '"DM Sans", system-ui, sans-serif',
            fontWeight: 600,
            fontSize: "11px",
            color: "#555555",
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            marginBottom: "20px",
          }}
        >
          Browse by Make
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
          {MAKES.map((make) => (
            <button
              key={make}
              type="button"
              onClick={() => navigate(`/search?q=${encodeURIComponent(`${make} parts`)}`)}
              className="make-card"
              style={{
                background: "#0f0f0f",
                border: "1px solid #1a1a1a",
                borderRadius: "4px",
                padding: "18px 20px",
                fontFamily: '"DM Sans", system-ui, sans-serif',
                fontSize: "14px",
                fontWeight: 600,
                color: "#e0e0e0",
                cursor: "pointer",
                transition: "all 0.15s ease",
                textAlign: "left",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "8px",
              }}
            >
              <span>{make}</span>
              <span className="make-arrow" aria-hidden="true">→</span>
            </button>
          ))}
        </div>
      </div>
      <style>{`
        .make-card .make-arrow {
          color: #cc1111;
          opacity: 0;
          transform: translateX(-4px);
          transition: opacity 0.15s ease, transform 0.15s ease;
        }
        .make-card:hover {
          border-color: #cc1111 !important;
          background: rgba(204,17,17,0.05) !important;
        }
        .make-card:hover .make-arrow {
          opacity: 1;
          transform: translateX(0);
        }
      `}</style>
    </section>
  );
};

export default BrowseByMakeSection;
