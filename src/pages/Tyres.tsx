import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";

const WIDTHS = ['155','165','175','185','195','205','215','225','235','245','255','265','275','285','295','305'];
const PROFILES = ['30','35','40','45','50','55','60','65','70','75'];
const RIMS = ['13','14','15','16','17','18','19','20','21','22'];

type SupplierCard = {
  id: string;
  supplier: string;
  flag: string;
  country: string;
  isGlobal: boolean;
  ships: string;
  fitting: string;
  url: string;
};

const Tyres = () => {
  const [selectedWidth, setSelectedWidth] = useState('205');
  const [selectedProfile, setSelectedProfile] = useState('55');
  const [selectedRim, setSelectedRim] = useState('16');
  const [supplierCards, setSupplierCards] = useState<SupplierCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const searchTyres = async () => {
    setLoading(true);
    setSearched(true);

    const rimNum = selectedRim.replace(/^r/i, '');
    const w = selectedWidth;
    const p = selectedProfile;

    const cards: SupplierCard[] = [
      {
        id: '1',
        supplier: 'mytyres.co.uk',
        flag: '🇬🇧',
        country: 'United Kingdom',
        isGlobal: true,
        ships: 'Ships to 35+ countries',
        fitting: '34,000+ fitting centres',
        url: `https://www.awin1.com/cread.php?awinmid=4118&awinaffid=2845282&clickref=partara-tyres&p=${encodeURIComponent(`https://www.mytyres.co.uk/tyres/car/?width=${w}&height=${p}&diameter=${rimNum}`)}`,
      },
      {
        id: '2',
        supplier: 'Tyres UK',
        flag: '🇬🇧',
        country: 'United Kingdom',
        isGlobal: true,
        ships: 'Ships to 64 countries',
        fitting: 'Nationwide fitting',
        url: `https://www.awin1.com/cread.php?awinmid=12715&awinaffid=2845282&clickref=partara-tyres&p=${encodeURIComponent(`https://www.tyres.net/tyres/?width=${w}&height=${p}&diameter=${rimNum}`)}`,
      },
      {
        id: '3',
        supplier: 'neumaticos-online.es',
        flag: '🇪🇸',
        country: 'Spain',
        isGlobal: false,
        ships: 'Ships within Spain',
        fitting: '2,600+ fitting centres',
        url: `https://www.awin1.com/cread.php?awinmid=10499&awinaffid=2845282&clickref=partara-tyres&p=${encodeURIComponent(`https://www.neumaticos-online.es/tyres/?width=${w}&height=${p}&diameter=${rimNum}`)}`,
      },
      {
        id: '4',
        supplier: 'Pneumatici IT',
        flag: '🇮🇹',
        country: 'Italy',
        isGlobal: false,
        ships: 'Ships within Italy',
        fitting: 'Italy specialist',
        url: `https://www.awin1.com/cread.php?awinmid=12716&awinaffid=2845282&clickref=partara-tyres&p=${encodeURIComponent(`https://www.pneumatici.it/ricerca-pneumatici/?width=${w}&height=${p}&diameter=${rimNum}`)}`,
      },
      {
        id: '5',
        supplier: 'ReifenDirekt',
        flag: '🇩🇪',
        country: 'Germany',
        isGlobal: false,
        ships: 'Ships within Germany',
        fitting: 'Germany specialist',
        url: `https://www.awin1.com/cread.php?awinmid=10747&awinaffid=2845282&clickref=partara-tyres&p=${encodeURIComponent(`https://www.reifendirekt.de/reifen/?width=${w}&height=${p}&diameter=${rimNum}`)}`,
      },
    ];

    setSupplierCards(cards);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead
        title="Tyres & Wheels — Compare Prices Across UK & Europe | PARTARA"
        description="Compare tyre prices from trusted UK & European retailers including mytyres.co.uk, Tyres UK, ReifenDirekt and more. Free fitting at 34,000+ centres."
      />
      <Navbar />

      <main className="flex-1 pt-16">
        {/* Hero */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-red-950/20 to-transparent pointer-events-none" />
          <div className="text-center pt-16 pb-10 px-4 relative">
            <div className="inline-flex items-center gap-2 bg-red-600/10 border border-red-600/20 rounded-full px-4 py-1.5 mb-6">
              <span className="text-red-400 text-xs font-semibold tracking-widest uppercase">
                Tyres & Wheels
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-3">
              Find Your Perfect Tyres
            </h1>
            <p className="text-zinc-500 text-sm max-w-md mx-auto">
              Compare prices from UK & European specialists. Free fitting available nationwide.
            </p>
          </div>
        </div>

        {/* Search Card */}
        <div className="max-w-md mx-auto px-4 mb-10">
          <div className="bg-zinc-900/80 backdrop-blur border border-zinc-800 rounded-3xl p-6 shadow-2xl shadow-black/40">
            <div className="flex items-center justify-between mb-4">
              <p className="text-white font-bold text-sm">Tyre Size</p>
              <p className="text-zinc-600 text-xs">Found on your tyre sidewall</p>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-2">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-zinc-600 text-center uppercase tracking-widest">
                  Width
                </label>
                <select
                  value={selectedWidth}
                  onChange={(e) => setSelectedWidth(e.target.value)}
                  className="bg-zinc-800 border border-zinc-700 hover:border-zinc-600 rounded-xl px-2 py-3 text-white text-sm font-mono text-center focus:border-red-500 focus:ring-1 focus:ring-red-500/30 outline-none transition-colors cursor-pointer"
                >
                  {WIDTHS.map((w) => (
                    <option key={w}>{w}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-zinc-600 text-center uppercase tracking-widest">
                  Profile
                </label>
                <select
                  value={selectedProfile}
                  onChange={(e) => setSelectedProfile(e.target.value)}
                  className="bg-zinc-800 border border-zinc-700 hover:border-zinc-600 rounded-xl px-2 py-3 text-white text-sm font-mono text-center focus:border-red-500 focus:ring-1 focus:ring-red-500/30 outline-none transition-colors cursor-pointer"
                >
                  {PROFILES.map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-zinc-600 text-center uppercase tracking-widest">
                  Rim
                </label>
                <select
                  value={selectedRim}
                  onChange={(e) => setSelectedRim(e.target.value)}
                  className="bg-zinc-800 border border-zinc-700 hover:border-zinc-600 rounded-xl px-2 py-3 text-white text-sm font-mono text-center focus:border-red-500 focus:ring-1 focus:ring-red-500/30 outline-none transition-colors cursor-pointer"
                >
                  {RIMS.map((r) => (
                    <option key={r} value={r}>R{r}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="text-center mb-5">
              <span className="text-zinc-600 text-xs">Searching for </span>
              <span className="text-white font-mono text-sm font-bold">
                {selectedWidth}/{selectedProfile} R{selectedRim}
              </span>
            </div>

            <button
              onClick={searchTyres}
              disabled={loading}
              className="w-full py-4 bg-red-600 hover:bg-red-500 active:scale-[0.98] disabled:opacity-50 text-white font-black rounded-2xl transition-all text-sm tracking-wide shadow-lg shadow-red-900/30"
            >
              {loading ? 'Loading suppliers...' : `Compare ${selectedWidth}/${selectedProfile} R${selectedRim} →`}
            </button>
          </div>
        </div>

        {/* Supplier cards */}
        {supplierCards.length > 0 && (
          <div className="max-w-2xl mx-auto px-4 mt-6 mb-16 space-y-3">
            <div className="text-center mb-6">
              <p className="text-zinc-500 text-sm">Showing results for</p>
              <p className="text-white font-black text-2xl font-mono">
                {selectedWidth}/{selectedProfile} R{selectedRim}
              </p>
            </div>

            {supplierCards.map((card) => (
              <a
                key={card.id}
                href={card.url}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="flex items-center gap-4 p-4 bg-zinc-900 border border-zinc-800 hover:border-red-600/50 rounded-2xl transition-all group hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/30"
              >
                <div className="flex-shrink-0 w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center text-2xl">
                  {card.flag}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-bold text-white text-sm truncate">{card.supplier}</p>
                    {card.isGlobal && (
                      <span className="text-[9px] bg-red-600/20 border border-red-600/30 text-red-400 rounded-full px-1.5 py-0.5 font-bold flex-shrink-0">
                        GLOBAL
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500">{card.ships}</p>
                  <p className="text-xs text-zinc-600">{card.fitting}</p>
                </div>

                <div className="flex-shrink-0 text-right">
                  <p className="text-xs text-zinc-600 mb-1">{card.country}</p>
                  <div className="flex items-center gap-1 text-red-400 group-hover:text-red-300 transition-colors">
                    <span className="text-xs font-bold">See prices</span>
                    <span className="text-xs group-hover:translate-x-0.5 transition-transform">→</span>
                  </div>
                </div>
              </a>
            ))}

            <p className="text-center text-zinc-700 text-xs pt-4">
              Clicking opens the supplier's website · Affiliate links
            </p>
          </div>
        )}

        {/* No results */}
        {searched && !loading && supplierCards.length === 0 && (
          <div className="text-center py-20 px-4">
            <div className="w-20 h-20 rounded-full border-4 border-zinc-800 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">○</span>
            </div>
            <p className="text-white font-bold text-lg mb-2">No suppliers available</p>
            <p className="text-zinc-500 text-sm max-w-xs mx-auto">
              Please try a different size.
            </p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Tyres;
