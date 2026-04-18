import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";

const WIDTHS = ['155','165','175','185','195','205','215','225','235','245','255','265','275','285','295','305'];
const PROFILES = ['30','35','40','45','50','55','60','65','70','75'];
const RIMS = ['13','14','15','16','17','18','19','20','21','22'];

type TyreProduct = {
  id: string;
  title: string;
  price: string;
  image: string;
  url: string;
  brand: string;
  shipping: string;
  supplierName: string;
  advertiserId: string;
};

const Tyres = () => {
  const [selectedWidth, setSelectedWidth] = useState('205');
  const [selectedProfile, setSelectedProfile] = useState('55');
  const [selectedRim, setSelectedRim] = useState('16');
  const [tyreProducts, setTyreProducts] = useState<TyreProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 24;

  const fetchTyres = async (pageNum: number) => {
    setLoading(true);
    setTyreProducts([]);

    try {
      const { data } = await supabase.functions.invoke('awin-tyre-feed', {
        body: {
          width: selectedWidth,
          profile: selectedProfile,
          rim: selectedRim,
          offset: (pageNum - 1) * ITEMS_PER_PAGE,
        },
      });
      setTyreProducts((data?.products as TyreProduct[]) || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const searchTyres = async () => {
    setSearched(true);
    setPage(1);
    await fetchTyres(1);
  };

  const goToPage = async (newPage: number) => {
    setPage(newPage);
    await fetchTyres(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const paginatedProducts = tyreProducts.slice(0, ITEMS_PER_PAGE);
  const hasNextPage = tyreProducts.length >= ITEMS_PER_PAGE;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead
        title="Tyres & Wheels — Compare Prices Across UK & Europe | PARTARA"
        description="Compare tyre prices from trusted UK & European retailers. Free fitting at 34,000+ centres."
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
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Searching...
                </span>
              ) : (
                `Search ${selectedWidth}/${selectedProfile} R${selectedRim} →`
              )}
            </button>
          </div>
        </div>

        {/* Results grid */}
        {tyreProducts.length > 0 && (
          <div className="max-w-6xl mx-auto px-4 mb-16">
            <p className="text-zinc-600 text-xs mb-4">
              Showing {tyreProducts.length} tyres · Page {page}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {paginatedProducts.map((product, i) => (
                <a
                  key={product.id || i}
                  href={product.url}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  className="bg-zinc-900 border border-zinc-800/80 hover:border-zinc-600 rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/50 group block"
                >
                  <div className="aspect-square bg-zinc-800/50 relative overflow-hidden flex items-center justify-center p-4">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.title}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <span className="text-5xl opacity-20">○</span>
                    )}
                    <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/70 backdrop-blur-sm rounded-full px-2 py-1">
                      <span className="text-xs">🇬🇧</span>
                    </div>
                  </div>

                  <div className="p-3">
                    <p className="text-xs font-semibold text-white line-clamp-2 mb-1 leading-snug group-hover:text-red-400 transition-colors">
                      {product.title}
                    </p>
                    {product.brand && (
                      <p className="text-[10px] text-zinc-600 mb-2">{product.brand}</p>
                    )}
                    <div className="flex items-end justify-between mb-2">
                      <p className="text-xl font-black text-white">{product.price}</p>
                    </div>
                    <p className="text-[10px] text-zinc-600 mb-3">🚚 {product.shipping}</p>
                    <p className="text-[10px] text-zinc-500">{product.supplierName}</p>
                    <div className="mt-2 w-full text-center py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl transition-colors">
                      View →
                    </div>
                  </div>
                </a>
              ))}
            </div>

            {(page > 1 || hasNextPage) && (
              <div className="flex gap-2 justify-center mt-6">
                <button
                  onClick={() => goToPage(page - 1)}
                  disabled={page === 1 || loading}
                  className="px-4 py-2 bg-zinc-800 rounded-xl text-white disabled:opacity-30"
                >
                  ← Prev
                </button>
                <span className="px-4 py-2 text-zinc-400">Page {page}</span>
                <button
                  onClick={() => goToPage(page + 1)}
                  disabled={!hasNextPage || loading}
                  className="px-4 py-2 bg-zinc-800 rounded-xl text-white disabled:opacity-30"
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        )}

        {/* No results */}
        {searched && !loading && tyreProducts.length === 0 && (
          <div className="text-center py-20 px-4">
            <div className="w-20 h-20 rounded-full border-4 border-zinc-800 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">○</span>
            </div>
            <p className="text-white font-bold text-lg mb-2">No tyres found</p>
            <p className="text-zinc-500 text-sm max-w-xs mx-auto">
              Try a different size. Most common: 205/55 R16, 225/45 R17, 195/65 R15
            </p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Tyres;
