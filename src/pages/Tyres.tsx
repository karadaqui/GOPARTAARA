import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import SafeImage from "@/components/SafeImage";
import { supabase } from "@/integrations/supabase/client";

const WIDTHS = ['175','185','195','205','215','225','235','245','255','265','275'];
const PROFILES = ['35','40','45','50','55','60','65','70'];
const RIMS = ['14','15','16','17','18','19','20','21','22'];

const TYRE_SUPPLIERS = [
  { id: '4118', name: 'mytyres.co.uk', flag: '🇬🇧', desc: 'UK · 34,000+ fitting centres' },
  { id: '12715', name: 'Tyres UK', flag: '🇬🇧', desc: 'UK · 64 countries' },
  { id: '10499', name: 'neumaticos-online.es', flag: '🇪🇸', desc: 'Spain' },
  { id: '12716', name: 'Pneumatici IT', flag: '🇮🇹', desc: 'Italy' },
  { id: '10747', name: 'ReifenDirekt EE', flag: '🇪🇪', desc: 'Estonia & Baltics' },
];

const BENEFITS = [
  { icon: '💰', title: 'Best Prices', desc: 'Compare across 5+ trusted retailers' },
  { icon: '🔧', title: 'Free Fitting', desc: '34,000+ fitting centres UK-wide' },
  { icon: '🌍', title: 'UK & Europe', desc: 'Covering UK, Spain, Italy & more' },
];

type TyreProduct = {
  id: string;
  title: string;
  price: string;
  image: string;
  url: string;
  brand: string;
  shipping: string;
  supplierName: string;
};

const Tyres = () => {
  const [selectedWidth, setSelectedWidth] = useState('205');
  const [selectedProfile, setSelectedProfile] = useState('55');
  const [selectedRim, setSelectedRim] = useState('R16');
  const [activeSupplier, setActiveSupplier] = useState('4118');
  const [tyreProducts, setTyreProducts] = useState<TyreProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const rimNum = selectedRim.replace('R', '');
  const sizeLabel = `${selectedWidth}/${selectedProfile} R${rimNum}`;

  const searchTyres = async () => {
    setLoading(true);
    setSearched(true);
    setTyreProducts([]);

    try {
      const { data } = await supabase.functions.invoke('awin-tyre-feed', {
        body: {
          width: selectedWidth,
          profile: selectedProfile,
          rim: rimNum,
          advertiserId: activeSupplier,
        },
      });
      setTyreProducts(data?.products || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

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

        <div className="max-w-2xl mx-auto px-4 mb-8">
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

            {/* Supplier tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-1 px-1">
              {TYRE_SUPPLIERS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActiveSupplier(s.id)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all border ${
                    activeSupplier === s.id
                      ? 'bg-red-600 border-red-500 text-white'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  <span>{s.flag}</span>
                  <span>{s.name}</span>
                </button>
              ))}
            </div>

            <button
              onClick={searchTyres}
              disabled={loading}
              className="w-full px-4 py-3 bg-red-600 hover:bg-red-500 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold transition-all"
            >
              {loading ? 'Searching...' : `Search ${sizeLabel} →`}
            </button>
          </div>
        </div>

        {/* Results */}
        {searched && (
          <div className="max-w-5xl mx-auto px-4 mb-12">
            {loading && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-zinc-900 border border-zinc-800 rounded-2xl h-72 animate-pulse"
                  />
                ))}
              </div>
            )}

            {!loading && tyreProducts.length === 0 && (
              <div className="text-center py-12">
                <p className="text-zinc-400 text-sm mb-1">
                  No tyres found for {sizeLabel}
                </p>
                <p className="text-zinc-600 text-xs">
                  Try a different size or supplier
                </p>
              </div>
            )}

            {!loading && tyreProducts.length > 0 && (
              <>
                <p className="text-zinc-400 text-sm mb-4">
                  {tyreProducts.length} tyres found for{' '}
                  <span className="text-white font-semibold">{sizeLabel}</span>
                </p>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {tyreProducts.map((product) => (
                    <a
                      key={product.id}
                      href={product.url}
                      target="_blank"
                      rel="noopener noreferrer sponsored"
                      className="bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-2xl overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/30 group flex flex-col"
                    >
                      <div className="relative aspect-square bg-zinc-950 overflow-hidden">
                        <SafeImage
                          src={product.image}
                          alt={product.title}
                          className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute top-2 left-2">
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-black/70 text-white backdrop-blur">
                            {product.supplierName}
                          </span>
                        </div>
                      </div>

                      <div className="p-3 flex flex-col flex-1">
                        <p className="text-xs text-white font-medium line-clamp-2 mb-1 min-h-[2rem]">
                          {product.title}
                        </p>

                        {product.brand && (
                          <p className="text-[10px] text-zinc-500 uppercase tracking-wide mb-1">
                            {product.brand}
                          </p>
                        )}

                        <p className="text-lg font-black text-white mb-1">
                          {product.price}
                        </p>

                        <p className="text-[11px] text-zinc-500 flex items-center gap-1 mb-2">
                          <span>🚚</span>
                          {product.shipping}
                        </p>

                        <span className="mt-auto text-[11px] text-red-400 font-semibold group-hover:text-red-300">
                          View →
                        </span>
                      </div>
                    </a>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

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
