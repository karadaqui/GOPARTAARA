import { useNavigate } from "react-router-dom";
import { useState } from "react";

const LOGOS = [
  
  { name: "Green Spark Plug", domain: "gsparkplug.com" },
  { name: "mytyres", domain: "mytyres.co.uk" },
  { name: "Tyres UK", domain: "tyres.net" },
  { name: "EV King", domain: "ev-king.com" },
  { name: "Amazon UK", domain: "amazon.co.uk" },
  { name: "Maxpeedingrods", domain: "maxpeedingrods.com" },
  { name: "Pneumatici", domain: "pneumatici.it" },
  { name: "Kohl Automobile", domain: "kohl-automobile.de" },
  { name: "Tirendo", domain: "tirendo.no" },
];

function LogoTile({ name, domain }: { name: string; domain: string }) {
  const [error, setError] = useState(false);
  if (error) {
    return (
      <div className="h-10 px-3 flex items-center justify-center rounded bg-white/5 text-xs font-semibold text-zinc-300 whitespace-nowrap">
        {name}
      </div>
    );
  }
  return (
    <img
      src={`https://logo.clearbit.com/${domain}`}
      alt={`${name} logo`}
      onError={() => setError(true)}
      className="h-10 w-auto object-contain bg-white rounded p-1 opacity-90 hover:opacity-100 transition"
      loading="lazy"
    />
  );
}

export default function TrustedSuppliersBar() {
  const navigate = useNavigate();
  return (
    <section className="py-8 border-y border-white/5">
      <div className="container">
        <div className="text-center text-xs uppercase tracking-widest text-zinc-500 mb-4">
          Trusted Suppliers
        </div>
        <button
          onClick={() => navigate("/suppliers")}
          className="w-full flex flex-wrap items-center justify-center gap-4 md:gap-6"
          aria-label="View all suppliers"
        >
          {LOGOS.map((l) => (
            <LogoTile key={l.domain} {...l} />
          ))}
        </button>
      </div>
    </section>
  );
}
