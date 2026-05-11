import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const STATS = [
  { value: "4,000,000+", label: "Parts" },
  { value: "17", label: "Markets" },
  { value: "30-Day", label: "Returns" },
  { value: "2013", label: "Founded" },
];

const CATEGORIES = [
  { icon: "🛑", name: "Brake Parts", desc: "Pads, discs, calipers", q: "brake pads" },
  { icon: "⚙️", name: "Engine Parts", desc: "Filters, belts, gaskets", q: "engine parts" },
  { icon: "🔧", name: "Suspension", desc: "Shocks, springs, arms", q: "suspension" },
  { icon: "🔍", name: "Filters", desc: "Oil, air, fuel, cabin", q: "filters" },
  { icon: "💡", name: "Ignition", desc: "Spark plugs, coils, sensors", q: "spark plugs" },
  { icon: "🔩", name: "Steering & Exhaust", desc: "Racks, pipes, mufflers", q: "steering exhaust" },
];

const INFO = [
  { icon: "🌍", label: "Ships to", value: "Europe, UK, USA, Australia & worldwide" },
  { icon: "📦", label: "Delivery", value: "DHL Express" },
  { icon: "🔄", label: "Returns", value: "30-day guarantee" },
  { icon: "✅", label: "Trustpilot", value: "4,000+ verified reviews" },
  { icon: "🏷️", label: "Brands", value: "Bosch, Brembo, Febi Bilstein, SKF, Monroe, Meyle & more" },
];

export default function SuppliersTrodo() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return navigate("/search?supplier=trodo");
    navigate(`/search?q=${encodeURIComponent(q)}&supplier=trodo`);
  };

  return (
    <div className="min-h-screen bg-[#080808] text-white">
      <SEOHead
        title="Trodo — Elite Supplier | GOPARTARA"
        description="Trodo is an Elite Supplier on GOPARTARA. 4M+ car parts, 17 markets, fast DHL delivery. Compare prices on Bosch, Brembo, Febi & more."
        canonicalUrl="https://gopartara.com/suppliers/trodo"
      />
      <Navbar />

      <main className="pt-20">
        {/* HERO */}
        <section className="container py-16 md:py-24 text-center">
          <div className="text-5xl md:text-7xl font-black tracking-tight mb-6">TRODO</div>
          <div
            className="inline-block px-4 py-1.5 rounded-full mb-6"
            style={{
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "0.05em",
              color: "#fbbf24",
              background: "rgba(251,191,36,0.1)",
              border: "1px solid rgba(251,191,36,0.3)",
            }}
          >
            ⭐ Elite Supplier — Verified Partner
          </div>
          <h1 className="text-2xl md:text-4xl font-semibold text-zinc-100 max-w-3xl mx-auto mb-8">
            4 Million+ Car Parts. Europe's Trusted Auto Parts Specialist.
          </h1>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={() => navigate("/search?supplier=trodo")}
              className="bg-[#cc1111] hover:bg-[#a50e0e] text-white h-11 px-6"
            >
              Search Trodo Parts →
            </Button>
            <a
              href="https://www.trodo.com"
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="inline-flex items-center justify-center h-11 px-6 rounded-md border border-zinc-700 hover:border-zinc-500 text-zinc-100 transition-colors"
            >
              Visit trodo.com →
            </a>
          </div>
        </section>

        {/* STATS */}
        <section className="border-y border-zinc-900 bg-zinc-950/40">
          <div className="container py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-white">{s.value}</div>
                <div className="text-xs md:text-sm text-zinc-400 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ABOUT */}
        <section className="container py-16 grid md:grid-cols-2 gap-10">
          <div className="space-y-4 text-zinc-300 leading-relaxed">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">About Trodo</h2>
            <p>
              Trodo is one of Europe's leading online car parts retailers, founded in 2013 in Norway by automotive
              enthusiasts. With over 4 million parts and accessories across 17 markets, Trodo specialises in European
              vehicle parts with fast DHL delivery worldwide.
            </p>
            <p>
              From brake pads and engine parts to filters, suspension, and oil — Trodo stocks top brands including
              Bosch, Brembo, ATE, Denso, Mann-Filter, Monroe, Lemförder, Febi Bilstein, SKF and Meyle.
            </p>
            <p>
              Trodo is an official partner of GOPARTARA. Their products appear directly in GOPARTARA search results so
              you can compare prices instantly.
            </p>
          </div>
          <div
            className="rounded-xl p-6"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <h3 className="text-lg font-semibold text-white mb-4">Quick Facts</h3>
            <ul className="space-y-3">
              {INFO.map((i) => (
                <li key={i.label} className="flex gap-3 text-sm">
                  <span className="text-xl flex-shrink-0">{i.icon}</span>
                  <span className="text-zinc-300">
                    <span className="font-medium text-white">{i.label}:</span> {i.value}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* CATEGORIES */}
        <section className="container py-12">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-8 text-center">Top Categories</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {CATEGORIES.map((c) => (
              <button
                key={c.name}
                onClick={() => navigate(`/search?q=${encodeURIComponent(c.q + " trodo")}`)}
                className="text-left rounded-xl p-5 transition-all hover:-translate-y-0.5"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(204,17,17,0.5)")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
              >
                <div className="text-3xl mb-3">{c.icon}</div>
                <div className="text-white font-semibold mb-1">{c.name}</div>
                <div className="text-sm text-zinc-400">{c.desc}</div>
              </button>
            ))}
          </div>
        </section>

        {/* SEARCH */}
        <section className="container py-12">
          <div
            className="max-w-2xl mx-auto rounded-2xl p-8 text-center"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <h2 className="text-xl md:text-2xl font-bold text-white mb-5">Search Trodo parts on GOPARTARA</h2>
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. brake pads BMW E46"
                className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500 h-11"
              />
              <Button type="submit" className="bg-[#cc1111] hover:bg-[#a50e0e] text-white h-11 px-6">
                Search →
              </Button>
            </form>
          </div>
        </section>

        {/* DISCLAIMER */}
        <section className="container py-10">
          <p className="text-xs text-zinc-500 text-center max-w-2xl mx-auto leading-relaxed">
            Trodo is an affiliate partner of GOPARTARA. GOPARTARA may earn a commission when you purchase through
            links on this page. Prices and availability are updated daily.
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
}
