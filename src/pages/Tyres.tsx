// Tyres v3 - premium dark redesign
import { useState, useMemo, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import SafeImage from "@/components/SafeImage";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ChevronLeft, ChevronRight, Truck } from "lucide-react";

const WIDTHS = ['155','165','175','185','195','205','215','225','235','245','255','265','275','285','295','305','315','325','335','345','355'];
const PROFILES = ['30','35','40','45','50','55','60','65','70','75','80'];
const RIMS = ['13','14','15','16','17','18','19','20','21','22'];
const ITEMS_PER_PAGE = 24;

const FLAG_MAP: Record<string, string> = {
  '4118': '1f1ec-1f1e7',
  '12641': '1f1ec-1f1e7',
  '12715': '1f30d',
  '93988': '1f30d',
  '10499': '1f1ea-1f1f8',
  '23179': '1f1ea-1f1f8',
  '12716': '1f1ee-1f1f9',
  '93986': '1f1ee-1f1f9',
  '10747': '1f1ea-1f1ea',
  '66605': '1f1ea-1f1ea',
};

const Flag = ({ id, size = 16 }: { id: string; size?: number }) => {
  const code = FLAG_MAP[id] || '1f30d';
  return (
    <img
      src={`https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/${code}.png`}
      alt=""
      width={size}
      height={size}
      className="inline-block"
      loading="lazy"
    />
  );
};

interface Tyre {
  id: string;
  name: string;
  price: string;
  brand?: string;
  supplier: string;
  advertiserId: string | number;
  url: string;
  image_url?: string;
}

const Tyres = () => {
  const [width, setWidth] = useState('205');
  const [profile, setProfile] = useState('55');
  const [rim, setRim] = useState('16');

  const [allResults, setAllResults] = useState<Tyre[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [season, setSeason] = useState<'all' | 'summer' | 'winter' | 'allseason'>('all');
  const [supplier, setSupplier] = useState<string>('all');
  const [brand, setBrand] = useState<string>('all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sort, setSort] = useState<'none' | 'asc' | 'desc'>('none');
  const [page, setPage] = useState(1);

  const resetPage = () => setPage(1);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/awin-tyre-feed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ warmup: true }),
    }).catch(() => {});
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    setSearched(true);
    setSearchError(null);
    setPage(1);
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/awin-tyre-feed`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ width, profile, rim }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setAllResults((data?.products || []) as Tyre[]);
    } catch (e: any) {
      console.error(e);
      setAllResults([]);
      setSearchError('Search failed — please try again');
    } finally {
      setLoading(false);
    }
  };

  const uniqueSuppliers = useMemo(() => {
    const map = new Map<string, string>();
    allResults.forEach((t) => {
      const id = String(t.advertiserId);
      if (!map.has(id)) map.set(id, t.supplier);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [allResults]);

  const uniqueBrands = useMemo(
    () => [...new Set(allResults.map((t) => t.brand).filter(Boolean) as string[])].sort(),
    [allResults]
  );

  const isWinterTyre = (name: string) => /winter|wintrac|wintercontact|ultragr|nordisk|nordic|ice/i.test(name);
  const isAllSeasonTyre = (name: string) => /all.?season|allseason|all season|4 season|4-season|4s |quadraxer|solus vier/i.test(name);

  let displayed = [...allResults];

  if (season === 'winter') {
    displayed = displayed.filter(t => isWinterTyre(t.name || ''));
  } else if (season === 'summer') {
    displayed = displayed.filter(t => !isWinterTyre(t.name || '') && !isAllSeasonTyre(t.name || ''));
  } else if (season === 'allseason') {
    displayed = displayed.filter(t => isAllSeasonTyre(t.name || ''));
  }

  if (supplier !== 'all' && supplier !== '') {
    displayed = displayed.filter(t => String(t.advertiserId) === String(supplier));
  }

  if (brand !== 'all' && brand !== '') {
    displayed = displayed.filter(t => (t.brand || '').toLowerCase() === brand.toLowerCase());
  }

  if (minPrice) {
    displayed = displayed.filter(t => parseFloat((t.price || '0').replace(/[^0-9.]/g, '')) >= parseFloat(minPrice));
  }

  if (maxPrice) {
    displayed = displayed.filter(t => parseFloat((t.price || '0').replace(/[^0-9.]/g, '')) <= parseFloat(maxPrice));
  }

  if (sort === 'asc') {
    displayed = [...displayed].sort((a, b) => parseFloat((a.price || '0').replace(/[^0-9.]/g, '')) - parseFloat((b.price || '0').replace(/[^0-9.]/g, '')));
  } else if (sort === 'desc') {
    displayed = [...displayed].sort((a, b) => parseFloat((b.price || '0').replace(/[^0-9.]/g, '')) - parseFloat((a.price || '0').replace(/[^0-9.]/g, '')));
  }

  if (sort === 'none') {
    if (season === 'winter') {
      displayed = [...displayed].sort((a, b) => Number(isWinterTyre(b.name || '')) - Number(isWinterTyre(a.name || '')));
    } else if (season === 'summer') {
      displayed = [...displayed].sort((a, b) => {
        const aM = !isWinterTyre(a.name || '') && !isAllSeasonTyre(a.name || '');
        const bM = !isWinterTyre(b.name || '') && !isAllSeasonTyre(b.name || '');
        return Number(bM) - Number(aM);
      });
    } else if (season === 'allseason') {
      displayed = [...displayed].sort((a, b) => Number(isAllSeasonTyre(b.name || '')) - Number(isAllSeasonTyre(a.name || '')));
    }
  }

  const totalPages = Math.max(1, Math.ceil(displayed.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const pageItems = displayed.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  const SEASONS: { value: typeof season; label: string; icon: string }[] = [
    { value: 'all', label: 'All Seasons', icon: '🌐' },
    { value: 'summer', label: 'Summer', icon: '☀️' },
    { value: 'winter', label: 'Winter', icon: '❄️' },
    { value: 'allseason', label: '4 Season', icon: '🌤️' },
  ];

  const RED = '#dc2626';
  const BG = '#0a0a0a';
  const CARD = '#141414';
  const BORDER = '#262626';

  return (
    <div className="min-h-screen" style={{ background: BG, color: '#fff' }}>
      <SEOHead title="Tyre Search | GoPartara" description="Compare tyre prices from 5 trusted suppliers across UK & Europe." />
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-4 text-white">
            Find Your <span style={{ color: RED }}>Perfect Tyre</span>
          </h1>
          <p className="text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto">
            Compare prices from 5 trusted suppliers across UK & Europe
          </p>
        </div>

        {/* Search card */}
        <div
          className="rounded-2xl p-6 mb-10 shadow-2xl"
          style={{ background: CARD, border: `1px solid ${BORDER}` }}
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-end">
            <div>
              <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-2 font-medium">Width</label>
              <select
                value={width}
                onChange={(e) => setWidth(e.target.value)}
                className="w-full rounded-lg px-3 py-3 text-white text-sm focus:outline-none focus:ring-2"
                style={{ background: BG, border: `1px solid ${BORDER}` }}
              >
                {WIDTHS.map((w) => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-2 font-medium">Profile</label>
              <select
                value={profile}
                onChange={(e) => setProfile(e.target.value)}
                className="w-full rounded-lg px-3 py-3 text-white text-sm focus:outline-none"
                style={{ background: BG, border: `1px solid ${BORDER}` }}
              >
                {PROFILES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-2 font-medium">Rim</label>
              <select
                value={rim}
                onChange={(e) => setRim(e.target.value)}
                className="w-full rounded-lg px-3 py-3 text-white text-sm focus:outline-none"
                style={{ background: BG, border: `1px solid ${BORDER}` }}
              >
                {RIMS.map((r) => <option key={r} value={r}>R{r}</option>)}
              </select>
            </div>
            <button
              onClick={handleSearch}
              disabled={loading}
              className="w-full rounded-lg px-6 py-3 font-semibold text-white text-sm uppercase tracking-wider transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
              style={{ background: RED, boxShadow: `0 8px 24px -8px ${RED}` }}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? 'Searching...' : 'Search Tyres'}
            </button>
          </div>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="h-10 w-10 animate-spin" style={{ color: RED }} />
            <p className="text-zinc-500 text-sm">Searching across all suppliers...</p>
          </div>
        )}

        {!loading && searchError && (
          <div className="text-center py-20" style={{ color: RED }}>{searchError}</div>
        )}

        {!loading && !searchError && searched && allResults.length === 0 && (
          <div className="text-center py-20 text-zinc-500">No tyres found for {width}/{profile} R{rim}.</div>
        )}

        {!loading && allResults.length > 0 && (
          <>
            {/* Supplier LIVE strip */}
            {uniqueSuppliers.length > 0 && (
              <div
                className="rounded-2xl p-4 mb-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-3"
                style={{ background: CARD, border: `1px solid ${BORDER}` }}
              >
                {uniqueSuppliers.map((s) => (
                  <div key={s.id} className="flex items-center gap-2 text-sm">
                    <Flag id={s.id} size={18} />
                    <span className="text-zinc-300 font-medium">{s.name}</span>
                    <span className="flex items-center gap-1 text-xs text-green-400 font-semibold">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                      </span>
                      LIVE
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Season filter pills */}
            <div className="flex flex-wrap gap-2 mb-4">
              {SEASONS.map(({ value, label, icon }) => {
                const active = season === value;
                return (
                  <button
                    key={value}
                    onClick={() => { setSeason(value); resetPage(); }}
                    className="px-5 py-2.5 rounded-full text-sm font-semibold transition-all flex items-center gap-2"
                    style={{
                      background: active ? RED : 'transparent',
                      color: active ? '#fff' : '#d4d4d8',
                      border: `1px solid ${active ? RED : BORDER}`,
                    }}
                  >
                    <span>{icon}</span> {label}
                  </button>
                );
              })}
            </div>

            {/* Supplier filter pills */}
            {uniqueSuppliers.length > 1 && (
              <div className="flex flex-wrap gap-2 mb-6">
                <button
                  onClick={() => { setSupplier('all'); resetPage(); }}
                  className="px-4 py-2 rounded-full text-xs font-semibold transition-all"
                  style={{
                    background: supplier === 'all' ? RED : 'transparent',
                    color: supplier === 'all' ? '#fff' : '#d4d4d8',
                    border: `1px solid ${supplier === 'all' ? RED : BORDER}`,
                  }}
                >
                  All Suppliers
                </button>
                {uniqueSuppliers.map((s) => {
                  const active = supplier === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => { setSupplier(s.id); resetPage(); }}
                      className="px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all"
                      style={{
                        background: active ? RED : 'transparent',
                        color: active ? '#fff' : '#d4d4d8',
                        border: `1px solid ${active ? RED : BORDER}`,
                      }}
                    >
                      <Flag id={s.id} /> {s.name}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Results header row */}
            <div
              className="rounded-2xl p-4 mb-6 flex flex-wrap gap-3 items-center"
              style={{ background: CARD, border: `1px solid ${BORDER}` }}
            >
              <div className="text-sm text-zinc-300 font-medium mr-auto">
                Showing <span className="text-white font-bold">{pageItems.length}</span> of{' '}
                <span className="text-white font-bold">{displayed.length}</span> results
              </div>

              <select
                value={brand}
                onChange={(e) => { setBrand(e.target.value); resetPage(); }}
                className="rounded-lg px-3 py-2 text-sm text-white"
                style={{ background: BG, border: `1px solid ${BORDER}` }}
              >
                <option value="all">All Brands</option>
                {uniqueBrands.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>

              <input
                type="number"
                placeholder="Min £"
                value={minPrice}
                onChange={(e) => { setMinPrice(e.target.value); resetPage(); }}
                className="w-24 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600"
                style={{ background: BG, border: `1px solid ${BORDER}` }}
              />
              <input
                type="number"
                placeholder="Max £"
                value={maxPrice}
                onChange={(e) => { setMaxPrice(e.target.value); resetPage(); }}
                className="w-24 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600"
                style={{ background: BG, border: `1px solid ${BORDER}` }}
              />

              <button
                onClick={() => { setSort(sort === 'asc' ? 'none' : 'asc'); resetPage(); }}
                className="px-3 py-2 rounded-lg text-xs font-semibold transition-all"
                style={{
                  background: sort === 'asc' ? RED : 'transparent',
                  color: sort === 'asc' ? '#fff' : '#d4d4d8',
                  border: `1px solid ${sort === 'asc' ? RED : BORDER}`,
                }}
              >
                Price ↑
              </button>
              <button
                onClick={() => { setSort(sort === 'desc' ? 'none' : 'desc'); resetPage(); }}
                className="px-3 py-2 rounded-lg text-xs font-semibold transition-all"
                style={{
                  background: sort === 'desc' ? RED : 'transparent',
                  color: sort === 'desc' ? '#fff' : '#d4d4d8',
                  border: `1px solid ${sort === 'desc' ? RED : BORDER}`,
                }}
              >
                Price ↓
              </button>
            </div>

            {/* Tyre grid */}
            <div
              key={`${season}-${supplier}-${brand}-${page}`}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
            >
              {pageItems.map((t) => {
                const priceVal = parseFloat((t.price || '0').replace(/[^0-9.]/g, ''));
                const freeDelivery = priceVal >= 50;
                return (
                  <div
                    key={`${t.name}-${t.supplier}-${t.price}`}
                    className="rounded-2xl overflow-hidden flex flex-col group transition-all hover:-translate-y-1"
                    style={{
                      background: CARD,
                      border: `1px solid ${BORDER}`,
                    }}
                  >
                    <div className="aspect-square flex items-center justify-center p-6" style={{ background: '#1a1a1a' }}>
                      {t.image_url ? (
                        <SafeImage src={t.image_url} alt={t.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform" />
                      ) : (
                        <div className="text-zinc-700 text-xs">No image</div>
                      )}
                    </div>
                    <div className="p-5 flex-1 flex flex-col gap-2">
                      <h3 className="text-sm font-bold text-white line-clamp-2 leading-snug min-h-[2.5rem]">{t.name}</h3>
                      {t.brand && <div className="text-xs text-zinc-500 uppercase tracking-wide">{t.brand}</div>}
                      <div className="text-2xl font-bold mt-1" style={{ color: RED }}>{t.price}</div>
                      <div className="flex items-center justify-between text-xs text-zinc-400 pt-1">
                        <div className="flex items-center gap-1.5">
                          <Flag id={String(t.advertiserId)} /> {t.supplier}
                        </div>
                        {freeDelivery && (
                          <span className="flex items-center gap-1 text-green-400 font-semibold">
                            <Truck className="h-3 w-3" /> Free delivery
                          </span>
                        )}
                      </div>
                      <a
                        href={t.url}
                        target="_blank"
                        rel="noopener noreferrer sponsored"
                        className="mt-3 inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-bold text-white transition-all hover:opacity-90"
                        style={{ background: RED, boxShadow: `0 4px 14px -4px ${RED}` }}
                      >
                        Buy Now →
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-10">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  className="flex items-center gap-1 px-5 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-30 transition-opacity"
                  style={{ background: CARD, border: `1px solid ${BORDER}` }}
                >
                  <ChevronLeft className="h-4 w-4" /> Previous
                </button>
                <span className="text-sm text-zinc-400 px-4">
                  Page <span className="text-white font-bold">{safePage}</span> of <span className="text-white font-bold">{totalPages}</span>
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                  className="flex items-center gap-1 px-5 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-30 transition-opacity"
                  style={{ background: CARD, border: `1px solid ${BORDER}` }}
                >
                  Next <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Tyres;
