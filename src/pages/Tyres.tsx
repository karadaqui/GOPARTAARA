import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";

const WIDTHS = ['155','165','175','185','195','205','215','225','235','245','255','265','275','285','295','305'];
const PROFILES = ['30','35','40','45','50','55','60','65','70','75'];
const RIMS = ['13','14','15','16','17','18','19','20','21','22'];

const TYRE_SUPPLIERS = [
  { id: '4118', label: 'mytyres', flag: '🇬🇧' },
  { id: '12715', label: 'Tyres UK', flag: '🇬🇧' },
  { id: '10499', label: 'Spain', flag: '🇪🇸' },
  { id: '12716', label: 'Italy', flag: '🇮🇹' },
  { id: '10747', label: 'Estonia', flag: '🇪🇪' },
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
  const [selectedRim, setSelectedRim] = useState('16');
  const [activeSupplier, setActiveSupplier] = useState('4118');
  const [tyreProducts, setTyreProducts] = useState<TyreProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const sizeLabel = `${selectedWidth}/${selectedProfile} R${selectedRim}`;

  const searchTyres = async () => {
    setLoading(true);
    setSearched(true);
    setTyreProducts([]);

    try {
      const { data } = await supabase.functions.invoke('awin-tyre-feed', {
        body: {
          width: selectedWidth,
          profile: selectedProfile,
          rim: selectedRim,
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
        {/* Header */}
        <div className="text-center pt-12 pb-8 px-4">
          <h1 className="text-4xl font-black text-white tracking-tight mb-2">
            🏎️ Find Your Tyres
          </h1>
          <p className="text-zinc-500 text-sm">
            Compare prices from UK & European tyre specialists
          </p>
        </div>

        {/* Search box */}
        <div className="max-w-lg mx-auto px-4 mb-8">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <p className="text-xs text-zinc-500 mb-3 text-center">
              Your tyre size is on the sidewall — e.g.
              <span className="text-white font-mono ml-1">205/55 R16</span>
            </p>

            <div className="flex items-center gap-2 mb-4">
              <select
                value={selectedWidth}
                onChange={(e) => setSelectedWidth(e.target.value)}
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-3 text-white text-sm font-mono text-center focus:border-red-500 outline-none"
              >
                {WIDTHS.map((w) => (
                  <option key={w}>{w}</option>
                ))}
              </select>
              <span className="text-zinc-600 font-bold">/</span>
              <select
                value={selectedProfile}
                onChange={(e) => setSelectedProfile(e.target.value)}
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-3 text-white text-sm font-mono text-center focus:border-red-500 outline-none"
              >
                {PROFILES.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
              <span className="text-zinc-600 font-bold">R</span>
              <select
                value={selectedRim}
                onChange={(e) => setSelectedRim(e.target.value)}
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-3 text-white text-sm font-mono text-center focus:border-red-500 outline-none"
              >
                {RIMS.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </div>

            {/* Supplier tabs */}
            <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide pb-1">
              {TYRE_SUPPLIERS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActiveSupplier(s.id)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                    activeSupplier === s.id
                      ? 'bg-red-600 border-red-500 text-white'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  <span>{s.flag}</span>
                  <span>{s.label}</span>
                </button>
              ))}
            </div>

            <button
              onClick={searchTyres}
              disabled={loading}
              className="w-full py-3 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold rounded-xl transition-all text-sm tracking-wide"
            >
              {loading ? '⏳ Searching...' : `Search ${sizeLabel} →`}
            </button>
          </div>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="max-w-6xl mx-auto px-4 mb-12">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="bg-zinc-900 border border-zinc-800 rounded-2xl h-72 animate-pulse"
                />
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {!loading && tyreProducts.length > 0 && (
          <div className="max-w-6xl mx-auto px-4 mb-12">
            <p className="text-zinc-600 text-xs mb-4 text-center">
              {tyreProducts.length} results for{' '}
              <span className="text-white font-mono font-bold">{sizeLabel}</span>
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {tyreProducts.map((product) => (
                <a
                  key={product.id}
                  href={product.url}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  className="bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-2xl overflow-hidden transition-all hover:-translate-y-0.5 group"
                >
                  <div className="aspect-square bg-zinc-800 flex items-center justify-center overflow-hidden">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.title}
                        className="w-full h-full object-contain p-3"
                        onError={(e) => (e.currentTarget.style.display = 'none')}
                      />
                    ) : (
                      <span className="text-4xl">🏎️</span>
                    )}
                  </div>

                  <div className="p-3">
                    <p className="text-xs font-semibold text-white line-clamp-2 mb-1 group-hover:text-red-400 transition-colors leading-snug">
                      {product.title}
                    </p>
                    {product.brand && (
                      <p className="text-[10px] text-zinc-600 mb-2">
                        {product.brand}
                      </p>
                    )}
                    <p className="text-lg font-black text-white mb-1">
                      {product.price}
                    </p>
                    <p className="text-[10px] text-zinc-500 mb-3">
                      🚚 {product.shipping}
                    </p>
                    <div className="w-full text-center py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl">
                      View →
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {searched && !loading && tyreProducts.length === 0 && (
          <div className="text-center py-16 px-4">
            <p className="text-3xl mb-3">🔍</p>
            <p className="text-white font-bold mb-1">No results found</p>
            <p className="text-zinc-500 text-sm">
              Try a different size or switch supplier tab
            </p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Tyres;
