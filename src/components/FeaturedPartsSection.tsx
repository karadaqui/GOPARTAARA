import { Link } from "react-router-dom";

const FeaturedPartsSection = () => {
  return (
    <section className="py-10 px-4 bg-background">
      <div className="max-w-6xl mx-auto text-center">
        <Link
          to="/deals"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-opacity hover:opacity-90"
          style={{ background: "#fbbf24", color: "#0a1628" }}
        >
          Browse Today's Deals →
        </Link>
      </div>
    </section>
  );
};

export default FeaturedPartsSection;
