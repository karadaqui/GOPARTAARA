import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";

interface EvProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  affiliate_url: string;
  category: string;
  in_stock: boolean;
}

const SkeletonCard = () => {
  const shimmer = {
    background: "linear-gradient(90deg, #111 0%, #1e1e1e 50%, #111 100%)",
    backgroundSize: "200% 100%",
    animation: "shimmer 1.5s ease-in-out infinite",
  } as const;
  return (
    <div
      style={{
        background: "#111111",
        border: "1px solid #1a1a1a",
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      <div style={{ width: "100%", height: 200, ...shimmer }} />
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ width: "70%", height: 16, borderRadius: 4, ...shimmer }} />
        <div style={{ width: "40%", height: 20, borderRadius: 4, ...shimmer }} />
        <div style={{ width: "100%", height: 36, borderRadius: 8, ...shimmer }} />
      </div>
    </div>
  );
};

const ProductCard = ({ p }: { p: EvProduct }) => {
  const [imgErr, setImgErr] = useState(false);
  return (
    <div
      style={{
        background: "#111111",
        border: "1px solid #1a1a1a",
        borderRadius: 12,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ width: "100%", height: 200, background: "#1a1a1a" }}>
        {p.image_url && !imgErr ? (
          <img
            src={p.image_url}
            alt={p.name}
            loading="lazy"
            onError={() => setImgErr(true)}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : null}
      </div>
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
        <h3
          style={{
            color: "#fff",
            fontSize: 15,
            fontWeight: 600,
            lineHeight: 1.35,
            margin: 0,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            minHeight: 40,
          }}
        >
          {p.name}
        </h3>
        <div style={{ color: "#cc1111", fontWeight: 700, fontSize: 18 }}>
          £{p.price.toFixed(2)}
        </div>
        <a
          href={p.affiliate_url}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="ev-cta"
          style={{
            marginTop: "auto",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            border: "1px solid #cc1111",
            color: "#cc1111",
            background: "transparent",
            padding: "10px 14px",
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 600,
            textDecoration: "none",
            transition: "background 0.15s, color 0.15s",
          }}
        >
          View on EV King →
        </a>
      </div>
    </div>
  );
};

export default function EvCharging() {
  const [products, setProducts] = useState<EvProduct[] | null>(null);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error: fnErr } = await supabase.functions.invoke(
          "fetch-ev-king-products",
        );
        if (cancelled) return;
        if (fnErr || !Array.isArray(data)) {
          setError(true);
          setProducts([]);
          return;
        }
        setProducts(data as EvProduct[]);
      } catch {
        if (!cancelled) {
          setError(true);
          setProducts([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    if (!products) return [];
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.name.toLowerCase().includes(q));
  }, [products, query]);

  return (
    <div className="min-h-screen bg-[#080808] flex flex-col">
      <SEOHead
        title="EV Charging Cables & Accessories | GOPARTARA"
        description="Find the right EV charging cable for your electric car. All major EV models covered. Powered by EV King."
        path="/ev-charging"
      />
      <style>{`
        .ev-cta:hover { background: #cc1111 !important; color: #fff !important; }
      `}</style>
      <Navbar />

      <main className="flex-1" style={{ padding: "96px 24px 64px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          {/* Header */}
          <div style={{ marginBottom: 32 }}>
            <div
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 600,
                fontSize: 11,
                color: "#cc1111",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                marginBottom: 16,
              }}
            >
              EV Charging
            </div>
            <h1
              style={{
                color: "#fff",
                fontSize: 40,
                fontWeight: 800,
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
                margin: 0,
                marginBottom: 12,
              }}
            >
              EV Charging Cables &amp; Accessories
            </h1>
            <p style={{ color: "#888", fontSize: 16, lineHeight: 1.5, maxWidth: 640, margin: 0 }}>
              Find the right charging cable for your electric car. All major EV models covered.
            </p>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                marginTop: 16,
                padding: "6px 12px",
                border: "1px solid #1a1a1a",
                borderRadius: 999,
                background: "#111",
                color: "#aaa",
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: 999, background: "#cc1111" }} />
              Powered by EV King
            </div>
          </div>

          {/* Search */}
          <div style={{ marginBottom: 28 }}>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search EV charging products..."
              style={{
                width: "100%",
                maxWidth: 480,
                height: 48,
                padding: "0 16px",
                background: "#111",
                border: "1px solid #1a1a1a",
                borderRadius: 12,
                color: "#fff",
                fontSize: 14,
                outline: "none",
              }}
            />
          </div>

          {/* Grid */}
          {products === null ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: 20,
              }}
            >
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : error ? (
            <div
              style={{
                padding: 32,
                background: "#111",
                border: "1px solid #1a1a1a",
                borderRadius: 12,
                textAlign: "center",
                color: "#aaa",
              }}
            >
              Unable to load products right now.{" "}
              <a
                href="https://www.evcableshop.co.uk"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#cc1111", fontWeight: 600 }}
              >
                Visit EV King directly →
              </a>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ color: "#888", padding: "48px 0", textAlign: "center" }}>
              No products match your search.
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: 20,
              }}
            >
              {filtered.map((p) => <ProductCard key={p.id} p={p} />)}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
