import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import SafeImage from "@/components/SafeImage";

interface FeaturedListing {
  id: string;
  title: string;
  price: number;
  currency: string | null;
  photos: string[] | null;
  seller_id: string;
  seller_name?: string | null;
}

const FeaturedParts = () => {
  const [items, setItems] = useState<FeaturedListing[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("seller_listings")
          .select("id, title, price, currency, photos, seller_id")
          .eq("active", true)
          .eq("approval_status", "approved")
          .eq("featured", true)
          .gt("featured_until", new Date().toISOString())
          .order("featured_until", { ascending: false })
          .limit(8);
        if (cancelled) return;
        if (error) {
          setItems([]);
          return;
        }
        setItems((data as FeaturedListing[]) ?? []);
      } catch {
        if (!cancelled) setItems([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Hide section entirely if fewer than 2 featured listings
  if (items === null || items.length < 2) return null;

  const display = items.slice(0, 4);
  const fmt = (n: number, c: string | null) => {
    const symbol = c === "EUR" ? "€" : c === "USD" ? "$" : "£";
    return `${symbol}${Number(n).toFixed(2)}`;
  };

  return (
    <section
      style={{
        padding: "48px 24px",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div style={{ maxWidth: "1180px", margin: "0 auto" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            marginBottom: "28px",
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <p
              style={{
                fontFamily: '"DM Sans", sans-serif',
                fontWeight: 600,
                fontSize: "11px",
                color: "var(--red)",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                margin: "0 0 8px",
              }}
            >
              Featured parts
            </p>
            <h2
              style={{
                fontFamily: '"Barlow Condensed", sans-serif',
                fontWeight: 700,
                fontSize: "32px",
                color: "#ffffff",
                margin: 0,
                lineHeight: 1.05,
                letterSpacing: "-0.01em",
              }}
            >
              Boosted by sellers
            </h2>
          </div>
          <Link
            to="/marketplace"
            style={{
              fontFamily: '"DM Sans", sans-serif',
              fontWeight: 500,
              fontSize: "13px",
              color: "var(--red)",
              textDecoration: "none",
            }}
          >
            View all →
          </Link>
        </div>

        {/* Grid */}
        <div
          className="featured-parts-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "12px",
          }}
        >
          {display.map((item) => (
            <Link
              key={item.id}
              to={`/listing/${item.id}`}
              className="fp-card"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-lg)",
                overflow: "hidden",
                cursor: "pointer",
                textDecoration: "none",
                color: "inherit",
                display: "block",
                transition: "border-color 0.15s ease, transform 0.15s ease",
              }}
            >
              <div
                style={{
                  background: "#111",
                  height: "130px",
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                <SafeImage
                  src={item.photos?.[0] || ""}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
                <span
                  style={{
                    position: "absolute",
                    top: "10px",
                    left: "10px",
                    background: "rgba(204,17,17,0.15)",
                    border: "1px solid rgba(204,17,17,0.3)",
                    borderRadius: "var(--radius-sm)",
                    padding: "3px 8px",
                    fontFamily: '"DM Sans", sans-serif',
                    fontWeight: 600,
                    fontSize: "10px",
                    color: "var(--red)",
                    letterSpacing: "0.06em",
                  }}
                >
                  FEATURED
                </span>
              </div>
              <div style={{ padding: "14px" }}>
                <div
                  style={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontWeight: 500,
                    fontSize: "12px",
                    color: "#888",
                    lineHeight: 1.5,
                    marginBottom: "8px",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {item.title}
                </div>
                <div
                  style={{
                    fontFamily: '"Barlow Condensed", sans-serif',
                    fontWeight: 700,
                    fontSize: "22px",
                    color: "var(--red)",
                    lineHeight: 1,
                  }}
                >
                  {fmt(item.price, item.currency)}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
      <style>{`
        .fp-card:hover { border-color: var(--red) !important; transform: translateY(-2px); }
        @media (max-width: 1024px) { .featured-parts-grid { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (max-width: 540px) { .featured-parts-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </section>
  );
};

export default FeaturedParts;
