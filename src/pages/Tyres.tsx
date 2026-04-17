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
  desc: string;
  awinmid: string;
};

const TYRE_SUPPLIERS: TyreSupplier[] = [
  { id: '4118', name: 'mytyres.co.uk', flag: '🇬🇧', country: 'United Kingdom', desc: 'Free fitting · 34,000+ centres', awinmid: '4118' },
  { id: '12715', name: 'Tyres UK', flag: '🇬🇧', country: 'United Kingdom', desc: '64 countries · Best prices', awinmid: '12715' },
  { id: '10499', name: 'neumaticos-online.es', flag: '🇪🇸', country: 'Spain', desc: '2,600+ fitting centres', awinmid: '10499' },
  { id: '12716', name: 'Pneumatici IT', flag: '🇮🇹', country: 'Italy', desc: '15% conversion rate', awinmid: '12716' },
  { id: '10747', name: 'ReifenDirekt', flag: '🇩🇪', country: 'Germany', desc: 'Top EPC · Best performer', awinmid: '10747' },
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

  const sizeLabel = `${selectedWidth}/${selectedProfile} R${selectedRim}`;

  const searchTyres = async () => {
    setLoading(true);
    setSearched(true);
    setTyreProducts([]);
    setCountryFilter('all');

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
            .then(({ data }) =>
              ((data?.products as TyreProduct[]) || []).map((p) => ({
                ...p,
                supplierMeta: supplier,
              })),
            ),
        ),
      );

      const allProducts: TyreProduct[] = results
        .filter((r) => r.status === 'fulfilled')
        .flatMap((r) => (r as PromiseFulfilledResult<TyreProduct[]>).value);

      setTyreProducts(allProducts);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts =
    countryFilter === 'all'
      ? tyreProducts
      : tyreProducts.filter((p) => p.supplierMeta?.id === countryFilter);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead
        title="Tyres & Wheels — Compare Prices Across UK & Europe | PARTARA"
        description="Compare tyre prices from trusted UK & European retailers including mytyres.co.uk, Tyres UK, ReifenDirekt and more. Free fitting at 34,000+ centres."
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

            <button
              onClick={searchTyres}
              disabled={loading}
              className="w-full py-3 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold rounded-xl transition-all text-sm tracking-wide"
            >
              {loading ? '⏳ Searching all suppliers...' : `Search ${sizeLabel} →`}
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
            {/* Country filter pills */}
            <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide pb-1 justify-center">
              <button
                onClick={() => setCountryFilter('all')}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  countryFilter === 'all'
                    ? 'bg-red-600 border-red-500 text-white'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                All ({tyreProducts.length})
              </button>
              {TYRE_SUPPLIERS.filter((s) =>
                tyreProducts.some((p) => p.supplierMeta?.id === s.id),
              ).map((s) => {
                const count = tyreProducts.filter((p) => p.supplierMeta?.id === s.id).length;
                return (
                  <button
                    key={s.id}
                    onClick={() => setCountryFilter(s.id)}
                    className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      countryFilter === s.id
                        ? 'bg-red-600 border-red-500 text-white'
                        : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'
                    }`}
                  >
                    <span>{s.flag}</span>
                    <span>{s.name}</span>
                    <span className="text-zinc-500">({count})</span>
                  </button>
                );
              })}
            </div>

            <p className="text-zinc-600 text-xs mb-4 text-center">
              {filteredProducts.length} results for{' '}
              <span className="text-white font-mono font-bold">{sizeLabel}</span>
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {filteredProducts.map((product) => (
                <a
                  key={`${product.supplierMeta?.id}-${product.id}`}
                  href={product.url}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  className="bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-2xl overflow-hidden transition-all hover:-translate-y-0.5 group"
                >
                  <div className="relative aspect-square bg-zinc-800 flex items-center justify-center overflow-hidden">
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
                    {product.supplierMeta && (
                      <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded-full px-2 py-0.5">
                        <span className="text-xs">{product.supplierMeta.flag}</span>
                        <span className="text-[9px] text-zinc-300">
                          {product.supplierMeta.country}
                        </span>
                      </div>
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
              Try a different size — we searched all suppliers
            </p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Tyres;
