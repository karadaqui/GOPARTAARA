import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";

const WIDTHS = ['175','185','195','205','215','225','235','245','255','265','275'];
const PROFILES = ['35','40','45','50','55','60','65','70'];
const RIMS = ['14','15','16','17','18','19','20','21','22'];

type Supplier = {
  name: string;
  flag: string;
  desc: string;
  color: string;
  url: (w: string, p: string, r: string) => string;
};

const SUPPLIERS: Supplier[] = [
  {
    name: 'mytyres.co.uk',
    flag: '🇬🇧',
    desc: 'UK — Free fitting at 34,000+ centres',
    color: 'bg-blue-600 hover:bg-blue-500',
    url: (w, p, r) =>
      `https://www.awin1.com/cread.php?awinmid=4118&awinaffid=2845282&clickref=partara&p=${encodeURIComponent(
        `https://www.mytyres.co.uk/tyres/?width=${w}&height=${p}&diameter=${r.replace('R', '')}`
      )}`,
  },
  {
    name: 'Tyres UK',
    flag: '🇬🇧',
    desc: 'UK — Available in 64 countries',
    color: 'bg-red-600 hover:bg-red-500',
    url: (w, p, r) =>
      `https://www.awin1.com/cread.php?awinmid=12715&awinaffid=2845282&clickref=partara&p=${encodeURIComponent(
        `https://www.tyres.net/tyres/?width=${w}&height=${p}&diameter=${r.replace('R', '')}`
      )}`,
  },
  {
    name: 'neumaticos-online.es',
    flag: '🇪🇸',
    desc: 'Spain — Delticom, 6.2M customers',
    color: 'bg-yellow-600 hover:bg-yellow-500',
    url: (w, p, r) =>
      `https://www.awin1.com/cread.php?awinmid=10499&awinaffid=2845282&clickref=partara&p=${encodeURIComponent(
        `https://www.neumaticos-online.es/tyres/?width=${w}&height=${p}&diameter=${r.replace('R', '')}`
      )}`,
  },
  {
    name: 'Pneumatici IT',
    flag: '🇮🇹',
    desc: 'Italy — 15.83% conversion rate',
    color: 'bg-green-600 hover:bg-green-500',
    url: () =>
      `https://www.awin1.com/cread.php?awinmid=12716&awinaffid=2845282&clickref=partara&p=${encodeURIComponent(
        'https://www.pneumatici.it/'
      )}`,
  },
  {
    name: 'ReifenDirekt EE',
    flag: '🇪🇪',
    desc: 'Estonia & Baltics',
    color: 'bg-zinc-600 hover:bg-zinc-500',
    url: () =>
      `https://www.awin1.com/cread.php?awinmid=10747&awinaffid=2845282&clickref=partara&p=${encodeURIComponent(
        'https://www.reifendirekt.ee/'
      )}`,
  },
];

const BENEFITS = [
  { icon: '💰', title: 'Best Prices', desc: 'Compare across 5+ trusted retailers' },
  { icon: '🔧', title: 'Free Fitting', desc: '34,000+ fitting centres UK-wide' },
  { icon: '🌍', title: 'UK & Europe', desc: 'Covering UK, Spain, Italy & more' },
];

const Tyres = () => {
  const [selectedWidth, setSelectedWidth] = useState('205');
  const [selectedProfile, setSelectedProfile] = useState('55');
  const [selectedRim, setSelectedRim] = useState('R16');

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead
        title="Tyres & Wheels — Compare Prices Across UK & Europe | PARTARA"
        description="Compare tyre prices from trusted UK & European retailers including mytyres.co.uk, Tyres UK, and more. Free fitting at 34,000+ centres nationwide."
      />
      <Navbar />

      <main className="flex-1 pt-16">
        <div className="text-center py-12 px-4">
          <p className="text-xs font-semibold tracking-widest uppercase text-red-500/60 mb-2">
            TYRES & WHEELS
          </p>
          <h1 className="text-3xl font-black text-white mb-3">
            Find the Best Tyre Prices
          </h1>
          <p className="text-zinc-500 text-sm max-w-xl mx-auto">
            Compare prices from trusted UK & European tyre retailers.
            Free fitting available at thousands of centres nationwide.
          </p>
        </div>

        <div className="max-w-2xl mx-auto px-4 mb-12">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <p className="text-white font-bold mb-4">Search by Tyre Size</p>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div>
                <label className="text-xs text-zinc-500 mb-1 block">Width</label>
                <select
                  value={selectedWidth}
                  onChange={(e) => setSelectedWidth(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-red-500"
                >
                  {WIDTHS.map((w) => (
                    <option key={w} value={w}>{w}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-zinc-500 mb-1 block">Profile</label>
                <select
                  value={selectedProfile}
                  onChange={(e) => setSelectedProfile(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-red-500"
                >
                  {PROFILES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-zinc-500 mb-1 block">Rim Size</label>
                <select
                  value={selectedRim}
                  onChange={(e) => setSelectedRim(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-red-500"
                >
                  {RIMS.map((r) => (
                    <option key={r} value={`R${r}`}>R{r}</option>
                  ))}
                </select>
              </div>
            </div>

            <p className="text-xs text-zinc-600 mb-4 text-center">
              You can find your tyre size on the sidewall of your current tyre
              e.g. <span className="text-zinc-400 font-mono">205/55 R16</span>
            </p>

            <div className="space-y-2">
              {SUPPLIERS.map((supplier) => (
                <a
                  key={supplier.name}
                  href={supplier.url(selectedWidth, selectedProfile, selectedRim)}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  className={`flex items-center justify-between w-full px-4 py-3 ${supplier.color} text-white rounded-xl transition-all group`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{supplier.flag}</span>
                    <div className="text-left">
                      <p className="text-sm font-bold">{supplier.name}</p>
                      <p className="text-xs opacity-70">{supplier.desc}</p>
                    </div>
                  </div>
                  <span className="text-sm group-hover:translate-x-0.5 transition-transform">
                    Search →
                  </span>
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 mb-16 grid grid-cols-3 gap-4">
          {BENEFITS.map((item) => (
            <div
              key={item.title}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center"
            >
              <div className="text-2xl mb-2">{item.icon}</div>
              <p className="text-white font-bold text-sm mb-1">{item.title}</p>
              <p className="text-zinc-500 text-xs">{item.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Tyres;
