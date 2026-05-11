import { useNavigate } from "react-router-dom";
import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";

type Partner = {
  name: string;
  domain: string;
  flag: string;
  ships: string;
  description: string;
  supplierParam: string;
};

const partners: Partner[] = [
  { name: "Green Spark Plug Co.", domain: "gsparkplug.com", flag: "🇬🇧", ships: "Ships worldwide", description: "Classic & vintage ignition specialists. 25,000+ parts. Est. 1980.", supplierParam: "greensparkplug" },
  { name: "mytyres.co.uk", domain: "mytyres.co.uk", flag: "🇬🇧", ships: "UK only", description: "UK's leading online tyre retailer.", supplierParam: "mytyres" },
  { name: "Tyres UK", domain: "tyres.net", flag: "🇬🇧", ships: "UK only", description: "Competitive tyre prices with UK-wide fitting.", supplierParam: "tyresuk" },
  { name: "EV King", domain: "ev-king.com", flag: "🇬🇧", ships: "UK + EU", description: "EV charging, accessories and components.", supplierParam: "evking" },
  { name: "Amazon UK", domain: "amazon.co.uk", flag: "🇬🇧", ships: "UK + EU", description: "Millions of car parts from trusted sellers.", supplierParam: "amazon" },
  { name: "Maxpeedingrods", domain: "maxpeedingrods.com", flag: "🌍", ships: "Ships worldwide", description: "Performance & aftermarket parts worldwide.", supplierParam: "maxpeedingrods" },
  { name: "Pneumatici IT", domain: "pneumatici.it", flag: "🇮🇹", ships: "Italy + EU", description: "Leading Italian tyre & parts retailer.", supplierParam: "pneumatici" },
  { name: "neumaticos-online.es", domain: "neumaticos-online.es", flag: "🇪🇸", ships: "Spain + EU", description: "Spain's top online tyre specialist.", supplierParam: "neumaticosonline" },
  { name: "ReifenDirekt EE", domain: "reifendirekt.ee", flag: "🇩🇪", ships: "Germany + EU", description: "German quality tyres at great prices.", supplierParam: "reifendirekt" },
  { name: "autobandenmarkt", domain: "autobandenmarkt.be", flag: "🇧🇪", ships: "Belgium + EU", description: "Belgium's trusted tyre marketplace.", supplierParam: "autobandenmarkt" },
  { name: "Kohl Automobile", domain: "kohl-automobile.de", flag: "🇩🇪", ships: "Germany + EU", description: "German auto parts specialist.", supplierParam: "kohl" },
  { name: "Tirendo", domain: "tirendo.no", flag: "🇳🇴", ships: "Norway only", description: "Norway's leading tyre retailer.", supplierParam: "tirendo" },
  { name: "Dunford Inc", domain: "dunford.com", flag: "🇺🇸", ships: "US only", description: "US specialist auto parts supplier.", supplierParam: "dunford" },
];

function LogoOrInitial({ domain, name }: { domain?: string; name: string }) {
  const [error, setError] = useState(!domain);
  if (error || !domain) {
    return (
      <div
        className="flex items-center justify-center rounded-lg text-2xl font-black text-white"
        style={{ width: 56, height: 56, background: "linear-gradient(135deg,#1a1a1a,#2a2a2a)", border: "1px solid #333" }}
      >
        {name.charAt(0)}
      </div>
    );
  }
  return (
    <img
      src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
      alt={`${name} logo`}
      width={56}
      height={56}
      onError={() => setError(true)}
      className="rounded-lg bg-white p-2 object-contain"
      style={{ width: 56, height: 56 }}
    />
  );
}

export default function Suppliers() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#080808] text-white flex flex-col">
      <SEOHead
        title="Our Suppliers — Verified Global Partners | GOPARTARA"
        description="GOPARTARA compares prices from verified global suppliers — all in one search. Browse our Elite, Verified and Marketplace partners."
        path="/suppliers"
      />
      <Navbar />

      <main className="pt-20 flex-1">
        <section className="container py-12 text-center">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-3">Our Suppliers</h1>
          <p className="text-zinc-400 max-w-2xl mx-auto">
            GOPARTARA compares prices from verified global suppliers — all in one search.
          </p>
        </section>

        {/* Verified */}
        <section className="container pb-12">
          <h2 className="text-xl font-bold mb-4">✅ Verified Partners</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {partners.map((p) => (
              <div
                key={p.name}
                className="rounded-xl p-5 flex flex-col"
                style={{ background: "#111", border: "1px solid #222" }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <LogoOrInitial domain={p.domain} name={p.name} />
                  <div className="min-w-0">
                    <div className="font-bold truncate">{p.name}</div>
                    <div className="text-xs text-zinc-500">{p.flag} · {p.ships}</div>
                  </div>
                </div>
                <p className="text-sm text-zinc-400 mb-4 flex-1">{p.description}</p>
                <button
                  onClick={() => navigate(`/search?q=&supplier=${encodeURIComponent(p.supplierParam)}`)}
                  className="text-sm font-semibold text-[#cc1111] hover:text-[#ff3333] text-left"
                >
                  Search their parts →
                </button>
              </div>
            ))}
          </div>
        </section>


        <section className="container pb-16">
          <p className="text-xs text-zinc-500 text-center max-w-2xl mx-auto">
            All suppliers are verified partners. GOPARTARA may earn a commission on purchases. Prices updated daily.
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
}
