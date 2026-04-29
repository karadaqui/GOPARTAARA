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
    <section className="px-4 mb-10 mt-6">
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-3 md:grid-cols-5 gap-2.5">
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
                padding: "18px 24px",
                fontFamily: '"DM Sans", system-ui, sans-serif',
                fontSize: "14px",
                fontWeight: 600,
                color: "#e0e0e0",
                cursor: "pointer",
                transition: "all 0.15s ease",
                textAlign: "left",
              }}
            >
              {make}
            </button>
          ))}
        </div>
      </div>
      <style>{`
        .make-card:hover {
          border-color: #cc1111 !important;
          background: rgba(204,17,17,0.05) !important;
        }
      `}</style>
    </section>
  );
};

export default BrowseByMakeSection;
