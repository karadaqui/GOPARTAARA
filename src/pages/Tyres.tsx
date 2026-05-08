// Tyres v4 - elite automotive redesign
import { useState, useMemo, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import SafeImage from "@/components/SafeImage";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  Truck,
  Heart,
  Scale,
  ChevronDown,
  Search as SearchIcon,
  Globe,
} from "lucide-react";

const WIDTHS = ['155','165','175','185','195','205','215','225','235','245','255','265','275','285','295','305','315','325','335','345','355'];
const PROFILES = ['30','35','40','45','50','55','60','65','70','75','80'];
const RIMS = ['13','14','15','16','17','18','19','20','21','22'];
const ITEMS_PER_PAGE = 24;

const POPULAR_SIZES: { w: string; p: string; r: string }[] = [
  { w: '205', p: '55', r: '16' },
  { w: '195', p: '65', r: '15' },
  { w: '225', p: '45', r: '17' },
  { w: '235', p: '35', r: '19' },
];

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

const BRAND_GRADIENTS: Record<string, string> = {
  michelin: 'linear-gradient(90deg,#0033a0,#1e88e5)',
  continental: 'linear-gradient(90deg,#000,#1a1a1a)',
  goodyear: 'linear-gradient(90deg,#fdd835,#fbc02d)',
  bridgestone: 'linear-gradient(90deg,#e30613,#b71c1c)',
  pirelli: 'linear-gradient(90deg,#ffc107,#ff8f00)',
  dunlop: 'linear-gradient(90deg,#ffd600,#ffab00)',
  hankook: 'linear-gradient(90deg,#ff6f00,#e65100)',
  kumho: 'linear-gradient(90deg,#1565c0,#0d47a1)',
  yokohama: 'linear-gradient(90deg,#c62828,#8e0000)',
  nokian: 'linear-gradient(90deg,#00897b,#004d40)',
  toyo: 'linear-gradient(90deg,#ef5350,#c62828)',
  falken: 'linear-gradient(90deg,#1e88e5,#0d47a1)',
  vredestein: 'linear-gradient(90deg,#ff7043,#bf360c)',
  uniroyal: 'linear-gradient(90deg,#1976d2,#0d47a1)',
  firestone: 'linear-gradient(90deg,#d32f2f,#7f0000)',
  bfgoodrich: 'linear-gradient(90deg,#212121,#424242)',
  general: 'linear-gradient(90deg,#37474f,#263238)',
  avon: 'linear-gradient(90deg,#1e88e5,#1565c0)',
};
const brandGradient = (brand?: string) => {
  const k = (brand || '').toLowerCase().split(/\s+/)[0];
  return BRAND_GRADIENTS[k] || 'linear-gradient(90deg,#dc2626,#7f1d1d)';
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
  supplier_name: string;
  advertiserId: string | number;
  url: string;
  image_url?: string;
}

const RED = '#dc2626';
const BG = '#0a0a0a';
const CARD = '#141414';
const CARD_2 = '#1a1a1a';
const BORDER = '#262626';
const BORDER_2 = '#2f2f2f';

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

  const [wishlist, setWishlist] = useState<Set<string>>(new Set());
  const [compare, setCompare] = useState<Set<string>>(new Set());

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

  const [serverPage, setServerPage] = useState(1);
  const [serverTotalPages, setServerTotalPages] = useState(1);
  const [serverTotal, setServerTotal] = useState(0);

  const fetchPage = async (pageNum: number) => {
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
        body: JSON.stringify({ width, profile, rim, page: pageNum }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setAllResults((data?.products || []) as Tyre[]);
      setServerPage(data?.page || 1);
      setServerTotalPages(data?.totalPages || 1);
      setServerTotal(data?.total || 0);
    } catch (e: any) {
      console.error(e);
      setAllResults([]);
      setSearchError('Search failed — please try again');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    setServerPage(1);
    await fetchPage(1);
  };

  const goToServerPage = async (n: number) => {
    if (n < 1 || n > serverTotalPages) return;
    await fetchPage(n);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const uniqueSuppliers = useMemo(() => {
    const byName = new Map<string, { id: string; name: string }>();
    allResults.forEach((t) => {
      const name = (t as any).supplier_name || (t as any).supplier || '';
      if (!name) return;
      if (!byName.has(name)) byName.set(name, { id: String(t.advertiserId), name });
    });
    return Array.from(byName.values());
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
    { value: 'all', label: 'All', icon: '🌐' },
    { value: 'summer', label: 'Summer', icon: '☀️' },
    { value: 'winter', label: 'Winter', icon: '❄️' },
    { value: 'allseason', label: '4 Season', icon: '🌤️' },
  ];

  const toggleSet = (set: Set<string>, key: string, setter: (s: Set<string>) => void) => {
    const next = new Set(set);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setter(next);
  };

  const initials = (name?: string) =>
    (name || '?').split(/\s+/).map((s) => s[0]).slice(0, 2).join('').toUpperCase();


  const applyPopular = (s: { w: string; p: string; r: string }) => {
    setWidth(s.w);
    setProfile(s.p);
    setRim(s.r);
  };

  const pageNumbers = useMemo(() => {
    const out: number[] = [];
    const start = Math.max(1, safePage - 2);
    const end = Math.min(totalPages, start + 4);
    for (let i = start; i <= end; i++) out.push(i);
    return out;
  }, [safePage, totalPages]);

  return (
    <div className="min-h-screen" style={{ background: BG, color: '#fff' }}>
      <SEOHead title="Tyre Search | GoPartara" description="Compare tyre prices from 5 trusted suppliers across UK & Europe." />
      <Navbar />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(60% 50% at 50% 0%, rgba(220,38,38,0.25) 0%, rgba(220,38,38,0.08) 35%, rgba(0,0,0,0) 70%)',
          }}
        />
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        <div className="relative max-w-7xl mx-auto px-4 pt-16 pb-16">
          <div className="grid grid-cols-1 gap-10 items-center">
            {/* LEFT: heading + search */}
            <div className="flex flex-col">
              <span
                className="self-start inline-block px-4 py-1 rounded-full text-xs font-bold tracking-[0.2em] uppercase mb-6"
                style={{ background: RED, color: '#fff', boxShadow: `0 8px 30px -10px ${RED}` }}
              >
                Tyres
              </span>
              <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[1.02] mb-5 text-white">
                Find Your <span style={{ color: RED }}>Perfect Tyres</span>
              </h1>
              <p className="text-lg text-zinc-300 mb-2 max-w-xl">
                Compare prices from UK & European tyre specialists. Rim not included — tyres only.
              </p>
              <p className="text-xs sm:text-sm text-zinc-500 mb-8">
                Compare prices from 5 tyre suppliers · Updated daily
              </p>

              <div
                className="rounded-3xl p-6 sm:p-7 backdrop-blur-xl"
                style={{
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))',
                  border: `1px solid ${BORDER_2}`,
                  boxShadow: '0 30px 80px -30px rgba(0,0,0,0.8)',
                }}
              >
                <div className="text-[10px] uppercase tracking-[0.25em] text-zinc-500 font-bold mb-4">
                  Enter your tyre size
                </div>
                <div className="flex items-end gap-2 sm:gap-3">
                  <div className="flex-1">
                    <label className="block text-[10px] uppercase tracking-[0.2em] text-zinc-400 mb-2 font-bold">Width</label>
                    <select
                      value={width}
                      onChange={(e) => setWidth(e.target.value)}
                      className="w-full rounded-xl px-3 py-3 text-white text-base sm:text-lg font-bold text-center focus:outline-none focus:ring-2 focus:ring-red-600"
                      style={{ background: BG, border: `1px solid ${BORDER}` }}
                    >
                      {WIDTHS.map((w) => <option key={w} value={w}>{w}</option>)}
                    </select>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-zinc-600 pb-3">/</div>
                  <div className="flex-1">
                    <label className="block text-[10px] uppercase tracking-[0.2em] text-zinc-400 mb-2 font-bold">Profile</label>
                    <select
                      value={profile}
                      onChange={(e) => setProfile(e.target.value)}
                      className="w-full rounded-xl px-3 py-3 text-white text-base sm:text-lg font-bold text-center focus:outline-none focus:ring-2 focus:ring-red-600"
                      style={{ background: BG, border: `1px solid ${BORDER}` }}
                    >
                      {PROFILES.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-zinc-600 pb-3">R</div>
                  <div className="flex-1">
                    <label className="block text-[10px] uppercase tracking-[0.2em] text-zinc-400 mb-2 font-bold">Rim</label>
                    <select
                      value={rim}
                      onChange={(e) => setRim(e.target.value)}
                      className="w-full rounded-xl px-3 py-3 text-white text-base sm:text-lg font-bold text-center focus:outline-none focus:ring-2 focus:ring-red-600"
                      style={{ background: BG, border: `1px solid ${BORDER}` }}
                    >
                      {RIMS.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleSearch}
                  disabled={loading}
                  className="mt-5 w-full rounded-xl px-6 py-4 font-bold text-white text-sm uppercase tracking-[0.2em] transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ background: RED, boxShadow: `0 12px 30px -10px ${RED}` }}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <SearchIcon className="h-4 w-4" />}
                  {loading ? 'Searching...' : 'Search Tyres'}
                </button>

                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <span className="text-[11px] uppercase tracking-wider text-zinc-500 mr-1">Popular:</span>
                  {POPULAR_SIZES.map((s) => {
                    const label = `${s.w}/${s.p} R${s.r}`;
                    const active = s.w === width && s.p === profile && s.r === rim;
                    return (
                      <button
                        key={label}
                        onClick={() => applyPopular(s)}
                        className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                        style={{
                          background: active ? RED : 'transparent',
                          color: active ? '#fff' : '#d4d4d8',
                          border: `1px solid ${active ? RED : BORDER_2}`,
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 pb-20">
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
            {/* Supplier strip */}
            {uniqueSuppliers.length > 0 && (
              <div className="mb-8">
                <div className="text-[10px] uppercase tracking-[0.25em] text-zinc-500 mb-3 text-center font-bold">
                  Prices from these trusted suppliers
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {uniqueSuppliers.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center gap-2 px-4 py-2 rounded-full"
                      style={{ background: CARD, border: `1px solid ${BORDER}` }}
                    >
                      <Flag id={s.id} size={16} />
                      <span className="text-sm text-zinc-200 font-medium">{s.name}</span>
                      <span className="flex items-center gap-1 text-[10px] text-green-400 font-bold uppercase tracking-wider">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
                        </span>
                        Live
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sticky filter bar */}
            <div
              className="sticky top-16 z-30 -mx-4 px-4 py-3 mb-6 backdrop-blur-xl"
              style={{
                background: 'rgba(10,10,10,0.85)',
                borderTop: `1px solid ${BORDER}`,
                borderBottom: `1px solid ${BORDER}`,
              }}
            >
              <div
                className="flex items-center gap-2 flex-nowrap overflow-x-auto rounded-xl px-3 py-2"
                style={{ background: CARD, border: `1px solid ${BORDER}` }}
              >
                <div className="flex items-center gap-1 shrink-0">
                  {SEASONS.map(({ value, label, icon }) => {
                    const active = season === value;
                    return (
                      <button
                        key={value}
                        onClick={() => { setSeason(value); resetPage(); }}
                        className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1"
                        style={{
                          background: active ? RED : 'transparent',
                          color: active ? '#fff' : '#d4d4d8',
                          border: `1px solid ${active ? RED : 'transparent'}`,
                        }}
                      >
                        {value !== 'all' && <span>{icon}</span>} {label}
                      </button>
                    );
                  })}
                </div>

                <div className="w-px h-6 bg-zinc-800 shrink-0" />

                <select
                  value={supplier}
                  onChange={(e) => { setSupplier(e.target.value); resetPage(); }}
                  className="rounded-lg px-3 py-1.5 text-xs font-semibold shrink-0 cursor-pointer bg-zinc-900 text-white"
                  style={{ border: `1px solid ${BORDER_2}`, backgroundColor: '#18181b', color: 'white', colorScheme: 'dark' }}
                >
                  <option value="all">All Suppliers</option>
                  {uniqueSuppliers.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>

                <select
                  value={brand}
                  onChange={(e) => { setBrand(e.target.value); resetPage(); }}
                  className="rounded-lg px-3 py-1.5 text-xs font-semibold shrink-0 cursor-pointer max-w-[140px] bg-zinc-900 text-white"
                  style={{ border: `1px solid ${BORDER_2}`, backgroundColor: '#18181b', color: 'white', colorScheme: 'dark' }}
                >
                  <option value="all">All Brands</option>
                  {uniqueBrands.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>

                <div className="flex items-center gap-1 shrink-0">
                  <input
                    type="number"
                    placeholder="£ Min"
                    value={minPrice}
                    onChange={(e) => { setMinPrice(e.target.value); resetPage(); }}
                    className="w-16 rounded-lg px-2 py-1.5 text-xs text-white placeholder-zinc-600"
                    style={{ background: 'transparent', border: `1px solid ${BORDER_2}` }}
                  />
                  <span className="text-zinc-600 text-xs">—</span>
                  <input
                    type="number"
                    placeholder="£ Max"
                    value={maxPrice}
                    onChange={(e) => { setMaxPrice(e.target.value); resetPage(); }}
                    className="w-16 rounded-lg px-2 py-1.5 text-xs text-white placeholder-zinc-600"
                    style={{ background: 'transparent', border: `1px solid ${BORDER_2}` }}
                  />
                </div>

                <div className="w-px h-6 bg-zinc-800 shrink-0" />

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => { setSort(sort === 'asc' ? 'none' : 'asc'); resetPage(); }}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={{
                      background: sort === 'asc' ? RED : 'transparent',
                      color: sort === 'asc' ? '#fff' : '#d4d4d8',
                      border: `1px solid ${sort === 'asc' ? RED : BORDER_2}`,
                    }}
                  >
                    ↑ Price
                  </button>
                  <button
                    onClick={() => { setSort(sort === 'desc' ? 'none' : 'desc'); resetPage(); }}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={{
                      background: sort === 'desc' ? RED : 'transparent',
                      color: sort === 'desc' ? '#fff' : '#d4d4d8',
                      border: `1px solid ${sort === 'desc' ? RED : BORDER_2}`,
                    }}
                  >
                    ↓ Price
                  </button>
                </div>

                <div className="ml-auto text-xs text-zinc-500 shrink-0 whitespace-nowrap pr-1">
                  Showing <span className="text-zinc-300 font-semibold">{displayed.length}</span> results
                </div>
              </div>
            </div>

            {/* Tyre grid */}
            <div
              key={`${season}-${supplier}-${brand}-${page}`}
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3"
            >
              {pageItems.map((t) => {
                const priceVal = parseFloat((t.price || '0').replace(/[^0-9.]/g, ''));
                const freeDelivery = priceVal >= 50;
                const cardKey = `${t.name}-${t.supplier_name}-${t.price}`;
                const isWish = wishlist.has(cardKey);
                const isCmp = compare.has(cardKey);
                const winter = isWinterTyre(t.name || '');
                const allSeason = isAllSeasonTyre(t.name || '');
                const cardSeason = winter ? '❄️ Winter' : allSeason ? '🌤️ All Season' : '☀️ Summer';
                const seasonStyle = winter
                  ? { background: 'rgba(59,130,246,0.15)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.4)' }
                  : allSeason
                  ? { background: 'rgba(22,163,74,0.15)', color: '#4ade80', border: '1px solid rgba(22,163,74,0.4)' }
                  : { background: 'rgba(249,115,22,0.15)', color: '#fb923c', border: '1px solid rgba(249,115,22,0.4)' };
                return (
                  <div
                    key={cardKey}
                    className="group rounded-xl overflow-hidden flex flex-col transition-all hover:-translate-y-1"
                    style={{
                      background: CARD,
                      border: `1px solid ${BORDER}`,
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLDivElement).style.borderColor = RED;
                      (e.currentTarget as HTMLDivElement).style.boxShadow = `0 20px 50px -20px ${RED}`;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.borderColor = BORDER;
                      (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                    }}
                  >
                    {/* Brand gradient bar */}
                    <div className="h-1 w-full" style={{ background: brandGradient(t.brand) }} />

                    <div className="relative aspect-square flex items-center justify-center p-3" style={{ background: CARD_2 }}>
                      {t.image_url ? (
                        <SafeImage src={t.image_url} alt={t.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform" />
                      ) : (
                        <div className="text-zinc-700 text-[10px]">No image</div>
                      )}
                    </div>

                    <div className="p-2.5 flex-1 flex flex-col gap-1.5">
                      <div className="text-[11px] font-black text-white uppercase tracking-wide truncate">
                        {t.brand || 'Unknown Brand'}
                      </div>
                      <h3 className="text-[11px] font-medium text-zinc-300 line-clamp-2 leading-snug min-h-[2rem]">{t.name}</h3>

                      <span
                        className="inline-flex self-start items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide"
                        style={seasonStyle}
                      >
                        {cardSeason}
                      </span>

                      <div className="text-lg font-black mt-0.5" style={{ color: RED }}>{t.price}</div>
                      <div className="text-[9px] text-zinc-500 uppercase tracking-wider">Tyre only</div>

                      <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-1.5 border-t border-zinc-800/60">
                        <div className="flex items-center gap-1">
                          <Flag id={String(t.advertiserId)} />
                          <span className="truncate max-w-[60px]">{t.supplier_name}</span>
                        </div>
                        {freeDelivery && (
                          <span className="flex items-center gap-0.5 text-green-400 font-semibold">
                            <Truck className="h-2.5 w-2.5" /> Free
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 mt-1.5">
                        <button
                          onClick={() => toggleSet(compare, cardKey, setCompare)}
                          aria-label="Compare"
                          className="p-1.5 rounded-md transition-all"
                          style={{
                            background: isCmp ? RED : 'transparent',
                            color: isCmp ? '#fff' : '#a1a1aa',
                            border: `1px solid ${isCmp ? RED : BORDER_2}`,
                          }}
                        >
                          <Scale className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => toggleSet(wishlist, cardKey, setWishlist)}
                          aria-label="Wishlist"
                          className="p-1.5 rounded-md transition-all"
                          style={{
                            background: isWish ? RED : 'transparent',
                            color: isWish ? '#fff' : '#a1a1aa',
                            border: `1px solid ${isWish ? RED : BORDER_2}`,
                          }}
                        >
                          <Heart className="h-3 w-3" fill={isWish ? '#fff' : 'none'} />
                        </button>
                        <a
                          href={t.url}
                          target="_blank"
                          rel="noopener noreferrer sponsored"
                          className="flex-1 inline-flex items-center justify-center px-2 py-1.5 rounded-md text-[11px] font-bold text-white transition-all hover:opacity-90"
                          style={{ background: RED, boxShadow: `0 6px 16px -6px ${RED}` }}
                        >
                          Buy →
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-12 flex-wrap">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  className="flex items-center gap-1 px-4 py-2 rounded-lg text-xs font-bold text-white disabled:opacity-30 transition-opacity"
                  style={{ background: CARD, border: `1px solid ${BORDER}` }}
                >
                  <ChevronLeft className="h-4 w-4" /> Previous
                </button>

                {pageNumbers.map((n) => {
                  const active = n === safePage;
                  return (
                    <button
                      key={n}
                      onClick={() => setPage(n)}
                      className="w-9 h-9 rounded-lg text-xs font-bold transition-all"
                      style={{
                        background: active ? RED : CARD,
                        color: '#fff',
                        border: `1px solid ${active ? RED : BORDER}`,
                      }}
                    >
                      {n}
                    </button>
                  );
                })}

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                  className="flex items-center gap-1 px-4 py-2 rounded-lg text-xs font-bold text-white disabled:opacity-30 transition-opacity"
                  style={{ background: CARD, border: `1px solid ${BORDER}` }}
                >
                  Next <ChevronRight className="h-4 w-4" />
                </button>

                <span className="w-full sm:w-auto text-center text-xs text-zinc-500 sm:ml-3">
                  Page <span className="text-white font-bold">{safePage}</span> of{' '}
                  <span className="text-white font-bold">{totalPages}</span>
                </span>
              </div>
            )}

            {serverTotalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6 flex-wrap">
                <button
                  onClick={() => goToServerPage(serverPage - 1)}
                  disabled={serverPage === 1 || loading}
                  className="flex items-center gap-1 px-4 py-2 rounded-lg text-xs font-bold text-white disabled:opacity-30"
                  style={{ background: CARD, border: `1px solid ${BORDER}` }}
                >
                  <ChevronLeft className="h-4 w-4" /> Prev batch
                </button>
                <span className="text-xs text-zinc-400">
                  Batch <span className="text-white font-bold">{serverPage}</span> of{' '}
                  <span className="text-white font-bold">{serverTotalPages}</span>
                  {' '}({serverTotal.toLocaleString()} total)
                </span>
                <button
                  onClick={() => goToServerPage(serverPage + 1)}
                  disabled={serverPage === serverTotalPages || loading}
                  className="flex items-center gap-1 px-4 py-2 rounded-lg text-xs font-bold text-white disabled:opacity-30"
                  style={{ background: CARD, border: `1px solid ${BORDER}` }}
                >
                  Next batch <ChevronRight className="h-4 w-4" />
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
