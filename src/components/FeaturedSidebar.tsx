import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import SafeImage from "@/components/SafeImage";

interface FeaturedListing {
  id: string;
  title: string;
  price: number | null;
  currency: string;
  photos: string[];
}

const currencySymbol = (c: string) =>
  c === "GBP" ? "£" : c === "EUR" ? "€" : c === "USD" ? "$" : `${c} `;

const Card = ({ l, onClick }: { l: FeaturedListing; onClick: () => void }) => (
  <div
    onClick={onClick}
    style={{
      background: "#111111",
      border: "1px solid #1f1f1f",
      borderRadius: 8,
      padding: 8,
      marginBottom: 8,
      cursor: "pointer",
      transition: "border-color 0.2s",
    }}
    onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#cc1111")}
    onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#1f1f1f")}
  >
    {l.photos?.[0] && (
      <SafeImage
        src={l.photos[0]}
        alt={l.title}
        style={{
          width: "100%",
          height: 80,
          objectFit: "cover",
          borderRadius: 6,
          marginBottom: 6,
          display: "block",
        }}
      />
    )}
    <div
      style={{
        fontSize: 11,
        fontWeight: 600,
        color: "white",
        lineHeight: 1.3,
        display: "-webkit-box",
        WebkitLineClamp: 2,
        WebkitBoxOrient: "vertical",
        overflow: "hidden",
      }}
    >
      {l.title}
    </div>
    {l.price != null && (
      <div style={{ fontSize: 13, fontWeight: 700, color: "#cc1111", marginTop: 4 }}>
        {currencySymbol(l.currency)}
        {Number(l.price).toFixed(2)}
      </div>
    )}
    <div style={{ fontSize: 9, color: "#f5c842", marginTop: 2 }}>Featured ⭐</div>
  </div>
);

const SidebarColumn = ({
  side,
  listings,
  onClick,
}: {
  side: "left" | "right";
  listings: FeaturedListing[];
  onClick: (id: string) => void;
}) => (
  <aside
    className="featured-sidebar hidden xl:block"
    style={{
      position: "fixed",
      [side]: 8,
      top: 80,
      width: 160,
      maxHeight: "80vh",
      overflowY: "auto",
      scrollbarWidth: "none",
      msOverflowStyle: "none",
      zIndex: 30,
      animation: "fadeInSidebar 0.4s ease-out",
    } as React.CSSProperties}
  >
    <div
      style={{
        fontSize: 11,
        fontWeight: 700,
        color: "#f5c842",
        letterSpacing: 1,
        textTransform: "uppercase",
        marginBottom: 8,
      }}
    >
      ⭐ Featured
    </div>
    {listings.map((l) => (
      <Card key={l.id} l={l} onClick={() => onClick(l.id)} />
    ))}
  </aside>
);

const FeaturedSidebar = () => {
  const [listings, setListings] = useState<FeaturedListing[]>([]);
  const [loaded, setLoaded] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase
          .from("seller_listings")
          .select("id, title, price, currency, photos")
          .eq("featured", true)
          .eq("active", true)
          .eq("approval_status", "approved")
          .gt("featured_until", new Date().toISOString())
          .order("featured_until", { ascending: false })
          .limit(4);
        setListings(((data as any[]) || []) as FeaturedListing[]);
      } catch {}
      setLoaded(true);
    })();
  }, []);

  if (!loaded || listings.length === 0) return null;

  const left = listings.slice(0, 2);
  const right = listings.length >= 3 ? listings.slice(2, 4) : [];
  const handleClick = (id: string) => navigate(`/listing/${id}`);

  return (
    <>
      <style>{`
        @keyframes fadeInSidebar {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .featured-sidebar::-webkit-scrollbar { display: none; }
        @media (max-width: 1300px) {
          .featured-sidebar { display: none !important; }
        }
      `}</style>
      <SidebarColumn side="left" listings={left} onClick={handleClick} />
      {right.length > 0 && (
        <SidebarColumn side="right" listings={right} onClick={handleClick} />
      )}
    </>
  );
};

export default FeaturedSidebar;
