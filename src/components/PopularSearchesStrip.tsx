import { useNavigate } from "react-router-dom";

const MAKES = [
  "BMW",
  "Ford",
  "Volkswagen",
  "Toyota",
  "Vauxhall",
  "Audi",
  "Mercedes-Benz",
  "Honda",
  "Nissan",
  "Peugeot",
  "Renault",
  "Hyundai",
];

const PopularSearchesStrip = () => {
  const navigate = useNavigate();

  const handleClick = (make: string) => {
    // Try to fill the homepage search input and scroll to it
    const input = document.querySelector<HTMLInputElement>(
      'input[type="search"], input[placeholder*="BMW" i], input[name="q"], input.search-input'
    );
    if (input) {
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value"
      )?.set;
      setter?.call(input, `${make} `);
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => input.focus(), 350);
      return;
    }
    // Fallback: navigate to search results
    navigate(`/search?q=${encodeURIComponent(make)}`);
  };

  return (
    <section className="px-4 mt-6 mb-10">
      <div className="max-w-4xl mx-auto">
        <h2
          style={{
            color: "#fafafa",
            fontSize: "20px",
            fontWeight: 700,
            marginBottom: "16px",
            letterSpacing: "-0.01em",
          }}
        >
          🚗 Search by Vehicle Make
        </h2>
        <div className="make-grid">
          {MAKES.map((make) => (
            <button
              key={make}
              type="button"
              onClick={() => handleClick(make)}
              className="make-card"
            >
              <span>{make}</span>
            </button>
          ))}
        </div>
      </div>
      <style>{`
        .make-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }
        @media (min-width: 640px) {
          .make-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
        }
        @media (min-width: 900px) {
          .make-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; }
        }
        .make-card {
          height: 120px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #111111;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 14px;
          color: #ffffff;
          font-size: 16px;
          font-weight: 700;
          letter-spacing: 0.01em;
          cursor: pointer;
          transition: border-color 180ms ease, transform 180ms ease, background-color 180ms ease, box-shadow 180ms ease;
        }
        .make-card:hover {
          border-color: #ef4444;
          background: #161616;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px -12px rgba(239,68,68,0.45);
        }
        .make-card:active { transform: translateY(0); }
      `}</style>
    </section>
  );
};

export default PopularSearchesStrip;
