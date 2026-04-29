import { useNavigate } from "react-router-dom";

const POPULAR = [
  "BMW brake pads",
  "Ford Focus clutch",
  "VW Golf timing belt",
  "Vauxhall Astra oil filter",
  "Toyota Yaris tyres",
  "Honda Civic discs",
  "Audi A4 spark plugs",
  "Mini Cooper radiator",
];

const PopularSearchesStrip = () => {
  const navigate = useNavigate();

  return (
    <section className="px-4 mt-4 mb-6">
      <div className="max-w-4xl mx-auto">
        <div
          className="flex items-center gap-2 overflow-x-auto"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            WebkitOverflowScrolling: "touch",
          }}
        >
          <span
            style={{
              color: "#71717a",
              fontSize: "13px",
              fontWeight: 500,
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            Popular:
          </span>
          {POPULAR.map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => navigate(`/search?q=${encodeURIComponent(term)}`)}
              className="popular-chip"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#71717a",
                fontSize: "13px",
                padding: "6px 12px",
                borderRadius: "6px",
                whiteSpace: "nowrap",
                flexShrink: 0,
                cursor: "pointer",
                transition: "background-color 150ms, color 150ms",
              }}
            >
              {term}
            </button>
          ))}
        </div>
      </div>
      <style>{`
        .popular-chip:hover {
          background: rgba(255,255,255,0.08) !important;
          color: #a1a1aa !important;
        }
      `}</style>
    </section>
  );
};

export default PopularSearchesStrip;
