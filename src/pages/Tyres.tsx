import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";

const WIDTHS = ['155','165','175','185','195','205','215','225','235','245','255','265','275','285','295','305'];
const PROFILES = ['30','35','40','45','50','55','60','65','70','75'];
const RIMS = ['13','14','15','16','17','18','19','20','21','22'];

type TyreSupplier = {
  id: string;
  name: string;
  flag: string;
  country: string;
  ships: string;
  isGlobal: boolean;
  desc: string;
};

const TYRE_SUPPLIERS: TyreSupplier[] = [
  {
    id: '4118',
    name: 'mytyres.co.uk',
    flag: '🇬🇧',
    country: 'United Kingdom',
    ships: 'Ships to 35+ countries',
    isGlobal: true,
    desc: 'Free fitting · 34,000+ centres',
  },
  {
    id: '12715',
    name: 'Tyres UK',
    flag: '🇬🇧',
    country: 'United Kingdom',
    ships: 'Ships to 64 countries',
    isGlobal: true,
    desc: 'Global · Best prices',
  },
  {
    id: '10499',
    name: 'neumaticos-online.es',
    flag: '🇪🇸',
    country: 'Spain',
    ships: 'Ships within Spain',
    isGlobal: false,
    desc: '2,600+ fitting centres',
  },
  {
    id: '12716',
    name: 'Pneumatici IT',
    flag: '🇮🇹',
    country: 'Italy',
    ships: 'Ships within Italy',
    isGlobal: false,
    desc: 'Italy specialist',
  },
  {
    id: '10747',
    name: 'ReifenDirekt',
    flag: '🇩🇪',
    country: 'Germany',
    ships: 'Ships within Germany',
    isGlobal: false,
    desc: 'Germany specialist',
  },
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
  supplierMeta?: TyreSupplier;
};

const Tyres = () => {
  const [selectedWidth, setSelectedWidth] = useState('205');
  const [selectedProfile, setSelectedProfile] = useState('55');
  const [selectedRim, setSelectedRim] = useState('16');
  const [tyreProducts, setTyreProducts] = useState<TyreProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [countryFilter, setCountryFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 24;

  const searchTyres = async () => {
    console.log('searchTyres called', { selectedWidth, selectedProfile, selectedRim });
    setLoading(true);
    setSearched(true);
    setTyreProducts([]);
    setCountryFilter('all');
    setCurrentPage(1);

    try {
      const results = await Promise.allSettled(
        TYRE_SUPPLIERS.map((supplier) =>
          supabase.functions
            .invoke('awin-tyre-feed', {
              body: {
                width: selectedWidth,
                profile: selectedProfile,
                rim: selectedRim,
                advertiserId: supplier.id,
              },
            })
            .then(({ data, error }) => {
              console.log(`tyre feed [${supplier.name}]:`, { data, error });
              return ((data?.products as TyreProduct[]) || []).map((p) => ({
                ...p,
                supplierMeta: supplier,
              }));
            })
            .catch((err) => {
              console.warn(`tyre feed [${supplier.name}] failed:`, err);
              return [] as TyreProduct[];
            }),
        ),
      );

      const allProducts: TyreProduct[] = results
        .filter((r) => r.status === 'fulfilled')
        .flatMap((r) => (r as PromiseFulfilledResult<TyreProduct[]>).value);

      console.log('Total products found:', allProducts.length);
      setTyreProducts(allProducts);
    } catch (err) {
      console.error('searchTyres error:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts =
    countryFilter === 'all'
      ? tyreProducts
      : countryFilter === 'global'
        ? tyreProducts.filter((p) => p.supplierMeta?.isGlobal)
        : tyreProducts.filter((p) => p.supplierMeta?.id === countryFilter);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const handleCountryFilter = (id: string) => {
    setCountryFilter(id);
    setCurrentPage(1);
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
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Searching all suppliers...
                </span>
              ) : (
                `Search ${selectedWidth}/${selectedProfile} R${selectedRim} →`
              )}
            </button>
          </div>
        </div>

        {/* Country filter pills */}
        {tyreProducts.length > 0 && (
          <div className="max-w-6xl mx-auto px-4 mb-6">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
              <span className="text-zinc-600 text-xs flex-shrink-0">Filter:</span>
              <button
                onClick={() => handleCountryFilter('all')}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                  countryFilter === 'all'
                    ? 'bg-red-600 border-red-500 text-white'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600'
                }`}
              >
                All ({tyreProducts.length})
              </button>
              {tyreProducts.some((p) => p.supplierMeta?.isGlobal) && (
                <button
                  onClick={() => handleCountryFilter('global')}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                    countryFilter === 'global'
                      ? 'bg-red-600 border-red-500 text-white'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600'
                  }`}
                >
                  🌍 Global
                </button>
              )}
              {TYRE_SUPPLIERS.filter((s) =>
                tyreProducts.some((p) => p.supplierMeta?.id === s.id),
              ).map((s) => {
                const count = tyreProducts.filter((p) => p.supplierMeta?.id === s.id).length;
                return (
                  <button
                    key={s.id}
                    onClick={() => handleCountryFilter(s.id)}
                    className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                      countryFilter === s.id
                        ? 'bg-red-600 border-red-500 text-white'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600'
                    }`}
                  >
                    <span>{s.flag}</span>
                    <span>{s.name}</span>
                    <span className="opacity-50">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Results grid */}
        {tyreProducts.length > 0 && (
          <div className="max-w-6xl mx-auto px-4 mb-16">
            <p className="text-zinc-600 text-xs mb-4">
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredProducts.length)} of{' '}
              {filteredProducts.length} tyres
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
                      <span className="text-xs">{product.supplierMeta?.flag}</span>
                    </div>
                    {product.supplierMeta?.isGlobal && (
                      <div className="absolute top-2 left-2 bg-red-600/80 backdrop-blur-sm rounded-full px-2 py-0.5">
                        <span className="text-[9px] text-white font-bold">GLOBAL</span>
                      </div>
                    )}
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
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs">{product.supplierMeta?.flag}</span>
                      <span className="text-[10px] text-zinc-500">
                        {product.supplierMeta?.country}
                      </span>
                      {product.supplierMeta?.isGlobal && (
                        <span className="text-[9px] text-red-400 ml-auto">🌍 Global</span>
                      )}
                    </div>
                    <div className="mt-2 w-full text-center py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl transition-colors">
                      View →
                    </div>
                  </div>
                </a>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8 mb-4 flex-wrap">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-600 disabled:opacity-30 disabled:cursor-not-allowed text-white text-sm rounded-xl transition-all"
                >
                  ← Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(
                    (p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1,
                  )
                  .reduce((acc, p, i, arr) => {
                    if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('...');
                    acc.push(p);
                    return acc;
                  }, [] as (number | string)[])
                  .map((p, i) =>
                    p === '...' ? (
                      <span key={`e-${i}`} className="text-zinc-600 px-1">
                        ...
                      </span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setCurrentPage(p as number)}
                        className={`w-9 h-9 rounded-xl text-sm font-semibold transition-all ${
                          currentPage === p
                            ? 'bg-red-600 text-white'
                            : 'bg-zinc-900 border border-zinc-800 hover:border-zinc-600 text-zinc-400'
                        }`}
                      >
                        {p}
                      </button>
                    ),
                  )}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-600 disabled:opacity-30 disabled:cursor-not-allowed text-white text-sm rounded-xl transition-all"
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
              Try a different size. Most common sizes: 205/55 R16, 225/45 R17, 195/65 R15
            </p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Tyres;
