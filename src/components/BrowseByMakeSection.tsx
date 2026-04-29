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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {MAKES.map((make) => (
            <button
              key={make}
              type="button"
              onClick={() => navigate(`/search?q=${encodeURIComponent(`${make} parts`)}`)}
              className="make-card"
              style={{
                background: "#0d0d0d",
                border: "1px solid #1f1f1f",
                borderRadius: "8px",
                padding: "14px 20px",
                fontSize: "14px",
                fontWeight: 600,
                color: "#a1a1aa",
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
          border-color: #333333 !important;
          color: #ffffff !important;
          background: #111111 !important;
        }
      `}</style>
    </section>
  );
};

export default BrowseByMakeSection;
