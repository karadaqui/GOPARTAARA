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
  "Mini",
  "Nissan",
];

const BrowseByMakeSection = () => {
  const navigate = useNavigate();

  return (
    <section
      style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "40px 40px",
      }}
    >
      <p
        style={{
          fontSize: "12px",
          color: "#52525b",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          marginBottom: "16px",
        }}
      >
        Browse by make
      </p>
      <div
        className="make-row"
        style={{
          display: "flex",
          gap: "8px",
          overflowX: "auto",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          WebkitOverflowScrolling: "touch",
          paddingBottom: "4px",
        }}
      >
        {MAKES.map((make) => (
          <button
            key={make}
            type="button"
            onClick={() =>
              navigate(`/search?q=${encodeURIComponent(`${make} parts`)}`)
            }
            className="make-card"
            style={{
              background: "#0a0a0a",
              border: "1px solid #1a1a1a",
              borderRadius: "8px",
              padding: "10px 20px",
              whiteSpace: "nowrap",
              fontSize: "14px",
              fontWeight: 600,
              color: "#a1a1aa",
              cursor: "pointer",
              transition: "all 0.15s",
              flexShrink: 0,
            }}
          >
            {make}
          </button>
        ))}
      </div>
      <style>{`
        .make-row::-webkit-scrollbar { display: none; }
        .make-card:hover {
          border-color: #333333 !important;
          color: #ffffff !important;
        }
      `}</style>
    </section>
  );
};

export default BrowseByMakeSection;
