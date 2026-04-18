import { useState, useMemo } from "react";
import { Heart, Bell, ChevronLeft, ChevronRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

const WIDTHS = ['155','165','175','185','195','205','215','225','235','245','255','265','275','285','295','305'];
const PROFILES = ['30','35','40','45','50','55','60','65','70','75'];
const RIMS = ['13','14','15','16','17','18','19','20','21','22'];

const ITEMS_PER_PAGE = 20;

const SUPPLIERS = [
  { id: 'all', flag: '🌍', label: 'All Results', ships: 'All suppliers' },
  { id: '12715', flag: '🌍', label: 'Tyres UK', ships: 'Ships to 64 countries' },
  { id: '4118', flag: '🇬🇧', label: 'mytyres.co.uk', ships: 'UK + 35 countries' },
  { id: '10499', flag: '🇪🇸', label: 'neumaticos-online.es', ships: 'Spain only' },
  { id: '12716', flag: '🇮🇹', label: 'Pneumatici IT', ships: 'Italy only' },
  { id: '10747', flag: '🇪🇪', label: 'ReifenDirekt EE', ships: 'Estonia, Latvia, Lithuania' },
];

type SupplierMeta = {
  name: string;
  flag: string;
  country: string;
  ships: string;
  fitting: string;
  advertiserId: string;
  id?: string;
};

type TyreProduct = {
  id: string;
  title: string;
  price: string;
  image: string;
  url: string;
  brand: string;
  shipping: string;
  supplierName: string;
  supplierMeta?: SupplierMeta;
  advertiserId?: string;
};

const getCurrency = (supplierId: string) => {
  if (supplierId === '4118' || supplierId === '12715') return { symbol: '£', code: 'GBP' };
  return { symbol: '€', code: 'EUR' };
};

const Tyres = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [selectedWidth, setSelectedWidth] = useState('205');
  const [selectedProfile, setSelectedProfile] = useState('55');
  const [selectedRim, setSelectedRim] = useState('16');
  const [tyreProducts, setTyreProducts] = useState<TyreProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [countryFilter, setCountryFilter] = useState('all');
  const [brandFilter, setBrandFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const searchTyres = async () => {
    setLoading(true);
    setSearched(true);
    setTyreProducts([]);
    setCountryFilter('all');
    setBrandFilter('all');
    setCurrentPage(1);

    const supplierIds = ['4118', '12715', '10499', '12716', '10747'];

    try {
      const results = await Promise.allSettled(
        supplierIds.map((advertiserId) =>
          supabase.functions.invoke('awin-tyre-feed', {
            body: {
              width: selectedWidth,
              profile: selectedProfile,
              rim: selectedRim,
              advertiserId,
              offset: 0,
              tyreType: 'all',
            },
          }).then((res) => ({ advertiserId, products: (res.data?.products as TyreProduct[]) || [] }))
        )
      );

      const all: TyreProduct[] = [];
      for (const r of results) {
        if (r.status === 'fulfilled') {
          const meta = SUPPLIERS.find((s) => s.id === r.value.advertiserId);
          for (const p of r.value.products) {
            all.push({
              ...p,
              advertiserId: r.value.advertiserId,
              supplierMeta: meta
                ? {
                    name: meta.label,
                    flag: meta.flag,
                    country: meta.label,
                    ships: meta.ships,
                    fitting: '',
                    advertiserId: r.value.advertiserId,
                    id: r.value.advertiserId,
                  }
                : p.supplierMeta,
            });
          }
        }
      }
      setTyreProducts(all);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePart = async (item: { title: string; price: string; image: string; url: string; supplier: string }) => {
    if (!user) { navigate("/auth"); return; }
    try {
      const priceNum = parseFloat(item.price.replace(/[^0-9.]/g, '')) || null;
      await supabase.from("saved_parts").insert({
        user_id: user.id,
        part_name: item.title,
        price: priceNum,
        supplier: item.supplier,
        url: item.url,
        image_url: item.image,
      });
      toast({ title: "Tyre saved!" });
    } catch (e) {
      console.error(e);
      toast({ title: "Could not save", variant: "destructive" });
    }
  };

  const handleSetAlert = async (item: { title: string; price: string; url: string }) => {
    if (!user) { navigate("/auth"); return; }
    try {
      const priceNum = parseFloat(item.price.replace(/[^0-9.]/g, ''));
      if (!priceNum) { toast({ title: "Invalid price", variant: "destructive" }); return; }
      await supabase.from("price_alerts").insert({
        user_id: user.id,
        email: user.email || '',
        part_name: item.title,
        target_price: priceNum * 0.9,
        current_price: priceNum,
        url: item.url,
        supplier: 'mytyres',
      });
      toast({ title: "Alert set!", description: "We'll email you when the price drops 10%." });
    } catch (e) {
      console.error(e);
      toast({ title: "Could not set alert", variant: "destructive" });
    }
  };

  const brands = useMemo(() => {
    const set = new Set(tyreProducts.map(p => p.brand).filter(Boolean));
    return ['all', ...Array.from(set).sort()];
  }, [tyreProducts]);

  const filteredProducts = useMemo(() => {
    return tyreProducts.filter(p => {
      const matchCountry = countryFilter === 'all' ||
        p.advertiserId === countryFilter ||
        p.supplierMeta?.advertiserId === countryFilter ||
        p.supplierMeta?.id === countryFilter;
      const matchBrand = brandFilter === 'all' ||
        p.brand?.toLowerCase() === brandFilter.toLowerCase();
      return matchCountry && matchBrand;
    });
  }, [tyreProducts, countryFilter, brandFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));
  const pagedProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

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
              Compare tyre prices from UK & European specialists.
              Rim not included — tyres only.
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
                <label className="text-[10px] text-zinc-600 text-center uppercase tracking-widest">Width</label>
                <select
                  value={selectedWidth}
                  onChange={(e) => setSelectedWidth(e.target.value)}
                  className="bg-zinc-800 border border-zinc-700 hover:border-zinc-600 rounded-xl px-2 py-3 text-white text-sm font-mono text-center focus:border-red-500 focus:ring-1 focus:ring-red-500/30 outline-none transition-colors cursor-pointer"
                >
                  {WIDTHS.map((w) => <option key={w}>{w}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-zinc-600 text-center uppercase tracking-widest">Profile</label>
                <select
                  value={selectedProfile}
                  onChange={(e) => setSelectedProfile(e.target.value)}
                  className="bg-zinc-800 border border-zinc-700 hover:border-zinc-600 rounded-xl px-2 py-3 text-white text-sm font-mono text-center focus:border-red-500 focus:ring-1 focus:ring-red-500/30 outline-none transition-colors cursor-pointer"
                >
                  {PROFILES.map((p) => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-zinc-600 text-center uppercase tracking-widest">Rim</label>
                <select
                  value={selectedRim}
                  onChange={(e) => setSelectedRim(e.target.value)}
                  className="bg-zinc-800 border border-zinc-700 hover:border-zinc-600 rounded-xl px-2 py-3 text-white text-sm font-mono text-center focus:border-red-500 focus:ring-1 focus:ring-red-500/30 outline-none transition-colors cursor-pointer"
                >
                  {RIMS.map((r) => <option key={r} value={r}>R{r}</option>)}
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
            <p className="text-xs text-zinc-600 text-center mt-2">
              All prices are for tyres only · Rim/wheel not included ·
              "Rim protection" is a tyre sidewall safety feature
            </p>
          </div>
        </div>

        {/* Filters + Results */}
        {tyreProducts.length > 0 && (
          <div className="max-w-6xl mx-auto mb-16">
            {/* Country pills */}
            <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-4 px-4">
              {COUNTRY_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => { setCountryFilter(opt.id); setCurrentPage(1); }}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    countryFilter === opt.id
                      ? 'bg-red-600 border-red-500 text-white'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600'
                  }`}
                  title={opt.ships}
                >
                  <span>{opt.flag}</span>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>

            {/* Brand dropdown */}
            <div className="flex items-center gap-3 px-4 mb-4">
              <select
                value={brandFilter}
                onChange={e => { setBrandFilter(e.target.value); setCurrentPage(1); }}
                className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white outline-none hover:border-zinc-600 focus:border-red-500"
              >
                {brands.map(b => (
                  <option key={b} value={b}>
                    {b === 'all' ? '🏷️ All Brands' : b}
                  </option>
                ))}
              </select>
              <p className="text-zinc-600 text-xs">{filteredProducts.length} tyres found</p>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 px-4">
              {pagedProducts.map((product, i) => {
                const currency = getCurrency(product.advertiserId || product.supplierMeta?.advertiserId || '4118');
                const displayPrice = product.price.replace(/[£€]/, currency.symbol);
                return (
                  <div
                    key={`${product.supplierMeta?.advertiserId || ''}-${product.id || i}`}
                    className="bg-zinc-900 border border-zinc-800/80 hover:border-zinc-600 rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/50 group flex flex-col"
                  >
                    <a
                      href={product.url}
                      target="_blank"
                      rel="noopener noreferrer sponsored"
                      className="block"
                    >
                      <div className="aspect-square bg-zinc-800/50 relative overflow-hidden flex items-center justify-center p-4">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.title}
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        ) : (
                          <span className="text-5xl opacity-20">○</span>
                        )}
                        <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/70 backdrop-blur-sm rounded-full px-2 py-1">
                          <span className="text-xs">{product.supplierMeta?.flag || '🇬🇧'}</span>
                        </div>
                      </div>
                    </a>

                    <div className="p-3 flex flex-col flex-1">
                      <a href={product.url} target="_blank" rel="noopener noreferrer sponsored">
                        <p className="text-xs font-semibold text-white line-clamp-2 mb-1 leading-snug group-hover:text-red-400 transition-colors">
                          {product.title}
                        </p>
                      </a>
                      {product.brand && (
                        <p className="text-[10px] text-zinc-600 mb-2">{product.brand}</p>
                      )}
                      <div className="flex items-end justify-between mb-1">
                        <p className="text-xl font-black text-white">{displayPrice}</p>
                        <span className="text-xs text-zinc-600">{currency.code}</span>
                      </div>
                      <p className="text-[10px] text-zinc-700">Tyre only · Rim not included</p>

                      {/* Supplier info */}
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[10px] text-zinc-600 flex items-center gap-1">
                          <span>{product.supplierMeta?.flag || '🇬🇧'}</span>
                          <span>{product.supplierName}</span>
                        </span>
                        <span className="text-[10px] text-zinc-700 truncate ml-1">
                          {product.supplierMeta?.ships || 'UK + 35 countries'}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-1 mt-2">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            handleSavePart({
                              title: product.title,
                              price: displayPrice,
                              image: product.image,
                              url: product.url,
                              supplier: product.supplierName,
                            });
                          }}
                          className="p-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
                          title="Save"
                        >
                          <Heart className="w-3.5 h-3.5 text-zinc-500 hover:text-red-400" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            handleSetAlert({
                              title: product.title,
                              price: displayPrice,
                              url: product.url,
                            });
                          }}
                          className="p-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
                          title="Price alert"
                        >
                          <Bell className="w-3.5 h-3.5 text-zinc-500 hover:text-yellow-400" />
                        </button>
                        <a
                          href={product.url}
                          target="_blank"
                          rel="noopener noreferrer sponsored"
                          className="ml-auto px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg transition-colors"
                        >
                          View →
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8 px-4">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:border-zinc-600 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-zinc-500 text-sm font-mono px-3">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:border-zinc-600 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
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
