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
      <div className="max-w-4xl mx-auto">
        <p
          style={{
            color: "#cc1111",
            fontSize: "12px",
            fontWeight: 700,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            marginBottom: "14px",
          }}
        >
          BROWSE BY MAKE
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {MAKES.map((make) => (
            <button
              key={make}
              type="button"
              onClick={() => navigate(`/search?q=${encodeURIComponent(`${make} parts`)}`)}
              className="make-card text-left"
              style={{
                background: "#111111",
                border: "1px solid #1f1f1f",
                borderRadius: "10px",
                padding: "12px 16px",
                fontSize: "14px",
                fontWeight: 600,
                color: "#a1a1aa",
                cursor: "pointer",
                transition: "border-color 150ms, color 150ms",
              }}
            >
              {make}
            </button>
          ))}
        </div>
      </div>
      <style>{`
        .make-card:hover {
          border-color: #2a2a2a !important;
          color: #ffffff !important;
        }
      `}</style>
    </section>
  );
};

export default BrowseByMakeSection;
