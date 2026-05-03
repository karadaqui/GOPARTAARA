import React, { useState, useMemo } from "react";
import { Heart, Bell, ChevronLeft, ChevronRight, Scale } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { CompareBar, type CompareItem } from "@/components/PartsComparison";
import { TyreCompareModal, type TyreCompareItem } from "@/components/TyreCompareModal";

const FlagImg = ({ advertiserId }: { advertiserId: string }) => {
  const flagMap: Record<string, string> = {
    '4118':  '1f1ec-1f1e7', // 🇬🇧 GB
    '12715': '1f30d',       // 🌍 Globe
    '10499': '1f1ea-1f1f8', // 🇪🇸 ES
    '12716': '1f1ee-1f1f9', // 🇮🇹 IT
    '10747': '1f1ea-1f1ea', // 🇪🇪 EE
    'all':   '1f30d',       // 🌍 Globe
  }
  const code = flagMap[advertiserId] || '1f30d'
  return (
    <img 
      src={`https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/${code}.png`}
      alt="flag"
      width={20}
      height={20}
      className="inline-block"
      loading="lazy"
      decoding="async"
    />
  )
}

const WIDTHS = ['155','165','175','185','195','205','215','225','235','245','255','265','275','285','295','305'];
const PROFILES = ['30','35','40','45','50','55','60','65','70','75'];
const RIMS = ['13','14','15','16','17','18','19','20','21','22'];

const ITEMS_PER_PAGE = 20;

const SUPPLIERS = [
  {
    id: 'all',
    siteName: 'All Results',
    shipsTo: 'All suppliers',
  },
  {
    id: '12715',
    siteName: 'Tyres UK (Tyres.net)',
    shipsTo: 'Ships to 64 countries',
  },
  {
    id: '4118',
    siteName: 'mytyres.co.uk',
    shipsTo: 'Ships to UK + 35 countries',
  },
  {
    id: '10499',
    siteName: 'neumaticos-online.es',
    shipsTo: 'Ships within Spain',
  },
  {
    id: '12716',
    siteName: 'Pneumatici IT',
    shipsTo: 'Ships within Italy',
  },
  {
    id: '10747',
    siteName: 'ReifenDirekt EE',
    shipsTo: 'Ships to Estonia, Latvia, Lithuania',
  },
];

type SupplierMeta = {
  id: string;
  siteName: string;
  shipsTo: string;
};

type TyreProduct = {
  id: string;
  name?: string;
  title: string;
  price: string;
  image: string;
  image_url?: string;
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

const matchesSeason = (product: any, season: 'all'|'summer'|'winter'|'allseason'): boolean => {
  const name = `${product.name || product.title || ''}`
  if (season === 'summer') return /summer/i.test(name)
  if (season === 'winter') return /winter|wintrac|wintercontact|ultragr|nordic/i.test(name)
  if (season === 'allseason') return /all.?season|4s |quadraxer|solus vier/i.test(name)
  return true
}

// kept for TyreCompareModal compatibility
const detectSeason = (title: string): 'summer' | 'winter' | 'allseason' | 'unknown' => {
  const t = title.toLowerCase()
  if (/all[-\s]?season|4\s?season|crossclimate|vector|quatrac/.test(t)) return 'allseason'
  if (/winter|blizzak|winguard|alpin|snow|inverno|hiver/.test(t)) return 'winter'
  if (/summer|sport|potenza|primacy|turanza|cinturato/.test(t)) return 'summer'
  return 'unknown'
}

const Tyres = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [selectedWidth, setSelectedWidth] = useState('205');
  const [selectedProfile, setSelectedProfile] = useState('55');
  const [selectedRim, setSelectedRim] = useState('16');
  const [tyreProducts, setTyreProducts] = useState<TyreProduct[]>([]);
  const [allResults, setAllResults] = React.useState<TyreProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [countryFilter, setCountryFilter] = useState('all');
  const [brandFilter, setBrandFilter] = useState('all');
  const [seasonFilter, setSeasonFilter] = React.useState<'all'|'summer'|'winter'|'allseason'>('all');
  const [sortBy, setSortBy] = React.useState<'none'|'asc'|'desc'>('none');
  const [priceTier, setPriceTier] = useState<'all'|'budget'|'mid'|'premium'>('all');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [compareList, setCompareList] = useState<TyreProduct[]>([]);
  const [showLabelHelp, setShowLabelHelp] = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const toggleCompare = (product: TyreProduct) => {
    setCompareList(prev =>
      prev.find(p => p.id === product.id)
        ? prev.filter(p => p.id !== product.id)
        : prev.length < 3 ? [...prev, product] : prev
    );
  };

  // Items for the floating CompareBar (uses shared CompareItem shape)
  const compareItems: CompareItem[] = compareList.map(p => ({
    id: p.id,
    title: p.title,
    price: parseFloat((p.price || '0').replace(/[^0-9.]/g, '')) || null,
    sellerName: p.supplierName,
    shipping: p.shipping,
    freeShipping: /free/i.test(p.shipping || ''),
    url: p.url,
    imageUrl: p.image,
    source: 'ebay',
  }));

  // Items for the tyre-specific compare modal (real data only)
  const tyreCompareItems: TyreCompareItem[] = compareList.map(p => ({
    id: p.id,
    title: p.title,
    price: p.price, // already includes £ or € symbol
    image: p.image,
    url: p.url,
    brand: p.brand,
    shipping: p.shipping,
    supplierName: p.supplierMeta?.siteName || p.supplierName,
    advertiserId: p.advertiserId,
    season: detectSeason(p.title),
  }));

  const searchTyres = async () => {
    console.log('searchTyres called', { selectedWidth, selectedProfile, selectedRim })
    setLoading(true)
    setSearched(true)
    setTyreProducts([])
    setAllResults([])
    setCurrentPage(1)
    // Preserve user-selected seasonFilter across searches
    setSortBy('none')
    const ids = ['4118', '10499', '10747', '12716', '12715']

    try {
      const settled = await Promise.allSettled(
        ids.map((id) =>
          supabase.functions.invoke('awin-tyre-feed', {
            body: {
              width: selectedWidth,
              profile: selectedProfile,
              rim: selectedRim,
              advertiserId: id,
            },
          }).then(({ data, error }) => {
            if (error) throw error
            const supplier = SUPPLIERS.find((s) => s.id === id);
            return {
              warming: !!data?.warming,
              products: (data?.products || []).map((p: any) => ({
                ...p,
                supplierMeta: supplier as SupplierMeta | undefined,
                advertiserId: id,
              })),
            }
          })
        )
      )

      const all: any[] = []
      let anyWarming = false
      settled.forEach((result) => {
        if (result.status === 'fulfilled') {
          if (result.value.warming) anyWarming = true
          all.push(...result.value.products)
        }
      })
      if (all.length === 0 && anyWarming) {
        toast({
          title: "Suppliers are loading",
          description: "Suppliers are loading for the first time, please search again in 30 seconds.",
        })
      }
      setTyreProducts(all)
      setAllResults(all)
      ;(window as any)._tyreData = all
    } catch (err) {
      console.error('searchTyres error:', err)
    } finally {
      setLoading(false)
    }
  }

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

  const displayedTyres = (() => {
    const all = allResults;
    const isWinter = (t: any) => /winter|wintrac|wintercontact|ultragr|nordic|ice/i.test(t.name || '');
    const isAllSeason = (t: any) => /all.?season|4s |quadraxer|solus vier/i.test(t.name || '');
    if (seasonFilter === 'summer') return all.filter((t: any) => !isWinter(t) && !isAllSeason(t));
    if (seasonFilter === 'winter') return all.filter(isWinter);
    if (seasonFilter === 'allseason') return all.filter(isAllSeason);
    return all;
  })();

  const displayed = [...displayedTyres].sort((a, b) => {
    const pa = parseFloat((a.price || '0').replace(/[^0-9.]/g, ''));
    const pb = parseFloat((b.price || '0').replace(/[^0-9.]/g, ''));
    if (sortBy === 'asc') return pa - pb;
    if (sortBy === 'desc') return pb - pa;
    return 0;
  });

  const totalPages = Math.max(1, Math.ceil(displayed.length / ITEMS_PER_PAGE));

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead
        title="Compare Tyre Prices UK & Europe — GOPARTARA"
        description="Compare tyre prices from mytyres.co.uk, Tyres UK, Pneumatici IT and more. Find the cheapest tyres for your car size. Free comparison tool."
        path="/tyres"
      />
      <Navbar />

      <main className="flex-1 pt-16">
        {/* Hero */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-red-950/20 to-transparent pointer-events-none" />
          <div className="text-center pt-16 pb-10 px-4 relative">
            <div className="inline-flex items-center gap-2 bg-red-600/10 border border-red-600/20 rounded-full px-4 py-1.5 mb-6">
              <span className="text-red-400 text-xs font-semibold tracking-widest uppercase">
                Tyres
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-3">
              Find Your Perfect Tyres
            </h1>
            <p className="text-zinc-500 text-sm max-w-md mx-auto mb-3">
              Compare prices from UK & European tyre specialists.
              Rim not included — tyres only.
            </p>
            <p className="text-zinc-500 text-[13px]">
              Compare prices from <span className="text-zinc-300 font-semibold">5 tyre suppliers</span> · Updated daily
            </p>
          </div>
        </div>

        {/* Search Card */}
        <div className="max-w-2xl mx-auto px-4 mb-6">
          <div className="bg-zinc-900/80 backdrop-blur border border-zinc-800 rounded-3xl p-6 shadow-2xl shadow-black/40">
            <div className="flex items-center justify-between mb-5">
              <p className="text-white font-bold text-sm">Tyre Size</p>
              <p className="text-zinc-600 text-xs">Found on your tyre sidewall</p>
            </div>

            <div className="flex items-start gap-5">
              {/* Visual tyre diagram */}
              <div className="hidden sm:flex flex-shrink-0 flex-col items-center pt-1">
                <svg width="92" height="120" viewBox="0 0 92 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  {/* Tyre side profile (cross-section) */}
                  <rect x="22" y="12" width="48" height="96" rx="6" stroke="#52525b" strokeWidth="1.5" fill="none" />
                  {/* Sidewall */}
                  <rect x="22" y="12" width="48" height="22" stroke="#cc1111" strokeWidth="1.5" fill="rgba(204,17,17,0.08)" />
                  <rect x="22" y="86" width="48" height="22" stroke="#cc1111" strokeWidth="1.5" fill="rgba(204,17,17,0.08)" />
                  {/* Tread pattern */}
                  <line x1="30" y1="40" x2="30" y2="80" stroke="#71717a" strokeWidth="1" />
                  <line x1="38" y1="40" x2="38" y2="80" stroke="#71717a" strokeWidth="1" />
                  <line x1="46" y1="40" x2="46" y2="80" stroke="#71717a" strokeWidth="1" />
                  <line x1="54" y1="40" x2="54" y2="80" stroke="#71717a" strokeWidth="1" />
                  <line x1="62" y1="40" x2="62" y2="80" stroke="#71717a" strokeWidth="1" />
                  {/* Rim */}
                  <line x1="22" y1="60" x2="70" y2="60" stroke="#a1a1aa" strokeWidth="1" strokeDasharray="2 2" />
                  {/* Width arrow (top) */}
                  <line x1="22" y1="6" x2="70" y2="6" stroke="#a1a1aa" strokeWidth="1" />
                  <polygon points="22,6 26,4 26,8" fill="#a1a1aa" />
                  <polygon points="70,6 66,4 66,8" fill="#a1a1aa" />
                  <text x="46" y="3" fontSize="6" fill="#a1a1aa" textAnchor="middle" fontFamily="monospace">WIDTH</text>
                  {/* Profile (sidewall height) */}
                  <line x1="78" y1="12" x2="78" y2="34" stroke="#cc1111" strokeWidth="1" />
                  <polygon points="78,12 76,16 80,16" fill="#cc1111" />
                  <polygon points="78,34 76,30 80,30" fill="#cc1111" />
                  <text x="84" y="26" fontSize="6" fill="#cc1111" fontFamily="monospace">PROF</text>
                  {/* Rim diameter */}
                  <line x1="78" y1="40" x2="78" y2="80" stroke="#a1a1aa" strokeWidth="1" />
                  <polygon points="78,40 76,44 80,44" fill="#a1a1aa" />
                  <polygon points="78,80 76,76 80,76" fill="#a1a1aa" />
                  <text x="84" y="62" fontSize="6" fill="#a1a1aa" fontFamily="monospace">RIM</text>
                </svg>
                <p className="text-[9px] text-zinc-600 mt-1 font-mono">{selectedWidth}/{selectedProfile} R{selectedRim}</p>
              </div>

              {/* Inputs */}
              <div className="flex-1 min-w-0">
                <div className="grid grid-cols-3 gap-2 mb-3 items-end">
                  <div className="flex flex-col gap-1.5" title="Tyre width in millimetres (sidewall to sidewall)">
                    <label className="text-[10px] text-zinc-600 text-center uppercase tracking-widest cursor-help">Width (mm)</label>
                    <select
                      value={selectedWidth}
                      onChange={(e) => setSelectedWidth(e.target.value)}
                      style={{ height: 52 }}
                      className="bg-zinc-800 border border-zinc-700 hover:border-zinc-600 rounded-xl px-2 text-white text-[18px] font-bold font-mono text-center focus:border-red-500 focus:ring-1 focus:ring-red-500/30 outline-none transition-colors cursor-pointer"
                    >
                      {WIDTHS.map((w) => <option key={w}>{w}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5" title="Aspect ratio: sidewall height as a % of width">
                    <label className="text-[10px] text-zinc-600 text-center uppercase tracking-widest cursor-help">Profile (%)</label>
                    <div className="flex items-center gap-1">
                      <select
                        value={selectedProfile}
                        onChange={(e) => setSelectedProfile(e.target.value)}
                        style={{ height: 52 }}
                        className="flex-1 bg-zinc-800 border border-zinc-700 hover:border-zinc-600 rounded-xl px-2 text-white text-[18px] font-bold font-mono text-center focus:border-red-500 focus:ring-1 focus:ring-red-500/30 outline-none transition-colors cursor-pointer"
                      >
                        {PROFILES.map((p) => <option key={p}>{p}</option>)}
                      </select>
                      <span className="text-zinc-600 font-bold text-lg">/</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5" title="Rim diameter in inches">
                    <label className="text-[10px] text-zinc-600 text-center uppercase tracking-widest cursor-help">Rim (in)</label>
                    <select
                      value={selectedRim}
                      onChange={(e) => setSelectedRim(e.target.value)}
                      style={{ height: 52 }}
                      className="bg-zinc-800 border border-zinc-700 hover:border-zinc-600 rounded-xl px-2 text-white text-[18px] font-bold font-mono text-center focus:border-red-500 focus:ring-1 focus:ring-red-500/30 outline-none transition-colors cursor-pointer"
                    >
                      {RIMS.map((r) => <option key={r} value={r}>R{r}</option>)}
                    </select>
                  </div>
                </div>

                <p className="text-zinc-500 text-[12px] leading-relaxed mb-4">
                  <span className="text-zinc-400 font-semibold">Reading your tyre:</span>{' '}
                  <span className="font-mono text-zinc-300">{selectedWidth}/{selectedProfile} R{selectedRim}</span> means{' '}
                  <span className="text-zinc-400">{selectedWidth}mm wide</span>,{' '}
                  <span className="text-zinc-400">sidewall is {selectedProfile}% of width</span>,{' '}
                  fits a <span className="text-zinc-400">{selectedRim}″ rim</span>.
                </p>
              </div>
            </div>

            {/* Tyre Type selector */}
            <div className="mt-4 mb-3">
              <label className="block text-[11px] font-semibold tracking-[0.12em] uppercase text-zinc-500 mb-2">
                Tyre Type
              </label>
              <div className="grid grid-cols-4 gap-2">
                {([
                  { id: 'all', label: '🔍 All' },
                  { id: 'summer', label: '☀️ Summer' },
                  { id: 'winter', label: '❄️ Winter' },
                  { id: 'allseason', label: '🌤️ All-Season' },
                ] as const).map((t) => {
                  const active = seasonFilter === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSeasonFilter(t.id)}
                      aria-pressed={active}
                      className={`rounded-full border px-3 py-2 text-[13px] font-semibold transition-colors ${
                        active
                          ? 'border-red-500 bg-red-600/15 text-red-300'
                          : 'border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
                      }`}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={searchTyres}
              disabled={loading}
              className="w-full py-4 bg-red-600 hover:bg-red-500 active:scale-[0.98] disabled:opacity-50 text-white font-black rounded-2xl transition-[colors,transform] text-sm tracking-wide shadow-lg shadow-red-900/30"
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
              All prices are for tyres only · Rim/wheel not included
            </p>
          </div>

          {/* Popular sizes */}
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="text-zinc-500 text-[13px] font-semibold mr-1">Popular sizes:</span>
            {[
              { w: '205', p: '55', r: '16' },
              { w: '195', p: '65', r: '15' },
              { w: '225', p: '45', r: '17' },
              { w: '235', p: '35', r: '19' },
            ].map((s) => {
              const active = selectedWidth === s.w && selectedProfile === s.p && selectedRim === s.r;
              return (
                <button
                  key={`${s.w}-${s.p}-${s.r}`}
                  type="button"
                  onClick={() => {
                    setSelectedWidth(s.w);
                    setSelectedProfile(s.p);
                    setSelectedRim(s.r);
                  }}
                  className={`rounded-full border px-3 py-1.5 text-[13px] font-mono transition-colors ${
                    active
                      ? 'border-red-500 bg-red-600/15 text-red-300'
                      : 'border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
                  }`}
                >
                  {s.w}/{s.p} R{s.r}
                </button>
              );
            })}
          </div>
        </div>

        {/* Best tyres for your budget */}
        <div className="max-w-2xl mx-auto px-4 mt-8 mb-2">
          <h2 className="text-white text-lg font-bold mb-1">Best tyres for your budget</h2>
          <p className="text-zinc-500 text-[13px] mb-4">Pick a price tier and we'll filter the results</p>
          <div className="grid gap-3">
            {([
              { tier: 'budget', icon: '💚', label: 'Budget', desc: 'Under £50 per tyre · Great value everyday driving', color: '#22c55e' },
              { tier: 'mid', icon: '💛', label: 'Mid-Range', desc: '£50–£100 per tyre · Balanced performance and value', color: '#fbbf24' },
              { tier: 'premium', icon: '❤️', label: 'Premium', desc: '£100+ per tyre · Top brands: Michelin, Continental, Bridgestone', color: '#ef4444' },
            ] as const).map((t) => {
              const active = priceTier === t.tier;
              return (
                <div
                  key={t.tier}
                  className="flex items-center gap-4 rounded-xl px-4 py-4 transition-colors"
                  style={{
                    background: '#111111',
                    border: '1px solid ' + (active ? t.color : '#27272a'),
                    borderLeft: `4px solid ${t.color}`,
                  }}
                >
                  <div className="text-2xl shrink-0" aria-hidden>{t.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-bold text-[15px]">{t.label}</div>
                    <div className="text-zinc-400 text-[13px]">{t.desc}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPriceTier(t.tier);
                      setCurrentPage(1);
                      if (!searched) {
                        toast({ title: 'Pick a tyre size', description: 'Select width, profile, and rim above, then tap a tier.' });
                      }
                    }}
                    className="shrink-0 rounded-lg px-3 py-2 text-[13px] font-semibold transition-colors"
                    style={{
                      background: active ? t.color : 'transparent',
                      color: active ? '#0a0a0a' : '#e4e4e7',
                      border: `1px solid ${active ? t.color : '#3f3f46'}`,
                    }}
                  >
                    {active ? 'Filtering ✓' : 'Search this tier →'}
                  </button>
                </div>
              );
            })}
            {priceTier !== 'all' && (
              <button
                type="button"
                onClick={() => { setPriceTier('all'); setCurrentPage(1); }}
                className="text-zinc-500 hover:text-zinc-300 text-[12px] text-center mt-1"
              >
                Clear price filter
              </button>
            )}
          </div>
        </div>

        {/* EU Tyre Label explainer */}
        <div className="max-w-2xl mx-auto px-4 mb-8">
          <button
            type="button"
            onClick={() => setShowLabelHelp((s) => !s)}
            aria-expanded={showLabelHelp}
            className="w-full flex items-center justify-between rounded-xl px-4 py-3 transition-colors"
            style={{
              background: "#111111",
              border: "1px solid #27272a",
              color: "#e4e4e7",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            <span>📋 How to read tyre size & EU label</span>
            <span
              aria-hidden
              style={{
                color: "#a1a1aa",
                transform: showLabelHelp ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 200ms",
                display: "inline-block",
              }}
            >
              ▼
            </span>
          </button>

          {showLabelHelp && (
            <div
              style={{
                marginTop: 8,
                background: "#0f0f0f",
                border: "1px solid #27272a",
                borderRadius: 12,
                padding: "16px 18px",
                color: "#a1a1aa",
                fontSize: 13,
                lineHeight: 1.6,
              }}
            >
              {/* Tyre size */}
              <h3 style={{ color: "#ffffff", fontSize: 13, fontWeight: 700, marginBottom: 8, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                Tyre size — e.g. 205/55 R16
              </h3>
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 16px 0", display: "grid", gap: 4 }}>
                <li><span style={{ color: "#cc1111", fontWeight: 700, fontFamily: "monospace" }}>205</span> — width in mm (sidewall to sidewall)</li>
                <li><span style={{ color: "#cc1111", fontWeight: 700, fontFamily: "monospace" }}>55</span> — profile: sidewall height as % of width</li>
                <li><span style={{ color: "#cc1111", fontWeight: 700, fontFamily: "monospace" }}>R</span> — Radial construction</li>
                <li><span style={{ color: "#cc1111", fontWeight: 700, fontFamily: "monospace" }}>16</span> — rim diameter in inches</li>
              </ul>

              {/* Sidewall diagram */}
              <h3 style={{ color: "#ffffff", fontSize: 13, fontWeight: 700, marginBottom: 8, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                Where to find it on your tyre
              </h3>
              <div
                style={{
                  background: "#1a1a1a",
                  border: "1px solid #27272a",
                  borderRadius: 10,
                  padding: "14px 16px",
                  marginBottom: 16,
                  fontFamily: "monospace",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 22, marginBottom: 6 }} aria-hidden>⬛⬛⬛⬛⬛</div>
                <div style={{ color: "#fbbf24", fontWeight: 700, fontSize: 14, letterSpacing: "0.08em" }}>
                  205/55&nbsp;R16&nbsp;91V
                </div>
                <div style={{ color: "#71717a", fontSize: 11, marginTop: 4 }}>
                  ↑ moulded into the tyre sidewall
                </div>
              </div>

              {/* EU label */}
              <h3 style={{ color: "#ffffff", fontSize: 13, fontWeight: 700, marginBottom: 8, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                EU label ratings
              </h3>
              <div style={{ display: "grid", gap: 8 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 18 }} aria-hidden>⛽</span>
                  <div>
                    <strong style={{ color: "#ffffff" }}>Fuel efficiency (A–G)</strong>
                    <div style={{ fontSize: 12, color: "#71717a" }}>A = lowest rolling resistance, best fuel economy.</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 18 }} aria-hidden>💧</span>
                  <div>
                    <strong style={{ color: "#ffffff" }}>Wet grip (A–G)</strong>
                    <div style={{ fontSize: 12, color: "#71717a" }}>A = shortest braking distance on wet roads.</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 18 }} aria-hidden>🔊</span>
                  <div>
                    <strong style={{ color: "#ffffff" }}>External noise (dB)</strong>
                    <div style={{ fontSize: 12, color: "#71717a" }}>Lower dB = quieter. Class A (quietest) to C (loudest).</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Supplier strip */}
        <div className="max-w-2xl mx-auto px-4 mb-12">
          <p className="text-zinc-500 text-[12px] uppercase tracking-widest font-semibold mb-3">
            Prices from these trusted suppliers
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              { id: '4118', name: 'mytyres.co.uk' },
              { id: '12715', name: 'Tyres UK' },
              { id: '10499', name: 'neumaticos-online.es' },
              { id: '12716', name: 'Pneumatici IT' },
              { id: '10747', name: 'ReifenDirekt EE' },
            ].map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-2 bg-zinc-900/60 border border-zinc-800 rounded-full px-3 py-1.5"
              >
                <FlagImg advertiserId={s.id} />
                <span className="text-zinc-300 text-[12px] font-medium">{s.name}</span>
                <span className="flex items-center gap-1 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Filters + Results */}
        {tyreProducts.length > 0 && (
          <div className="max-w-6xl mx-auto mb-16">
            {/* Supplier pills */}
            <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-4 px-4">
              {SUPPLIERS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { setCountryFilter(s.id); setCurrentPage(1); }}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                    countryFilter === s.id
                      ? 'bg-red-600 border-red-500 text-white'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600'
                  }`}
                  title={s.shipsTo}
                >
                  <FlagImg advertiserId={s.id} />
                  <span>{s.siteName}</span>
                </button>
              ))}
            </div>

            {/* Season pills */}
            <div className="flex gap-2 overflow-x-auto px-4 pb-2">
              {[
                { id: 'all', label: '🔍 All' },
                { id: 'summer', label: '☀️ Summer' },
                { id: 'winter', label: '❄️ Winter' },
                { id: 'allseason', label: '🌦️ 4 Season' },
              ].map(s => (
                <button
                  key={s.id}
                  onClick={() => setSeasonFilter(s.id as 'all'|'summer'|'winter'|'allseason')}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                    seasonFilter === s.id
                      ? 'bg-red-600 border-red-500 text-white'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Brand + Sort dropdowns */}
            <div className="flex items-center gap-3 px-4 mb-4 flex-wrap">
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
              <button
                type="button"
                onClick={() => setSortBy('asc')}
                className={`rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${
                  sortBy === 'asc'
                    ? 'bg-red-600 border-red-500 text-white'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600'
                }`}
              >
                Price: Low→High
              </button>
              <button
                type="button"
                onClick={() => setSortBy('desc')}
                className={`rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${
                  sortBy === 'desc'
                    ? 'bg-red-600 border-red-500 text-white'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600'
                }`}
              >
                Price: High→Low
              </button>
              <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded-xl px-2 py-1">
                <span className="text-zinc-500 text-xs">£</span>
                <input
                  type="number"
                  min="0"
                  placeholder="Min"
                  value={minPrice}
                  onChange={e => { setMinPrice(e.target.value); setCurrentPage(1); }}
                  className="w-16 bg-transparent text-sm text-white outline-none placeholder:text-zinc-600"
                />
                <span className="text-zinc-600 text-xs">—</span>
                <span className="text-zinc-500 text-xs">£</span>
                <input
                  type="number"
                  min="0"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={e => { setMaxPrice(e.target.value); setCurrentPage(1); }}
                  className="w-16 bg-transparent text-sm text-white outline-none placeholder:text-zinc-600"
                />
                {(minPrice || maxPrice) && (
                  <button
                    type="button"
                    onClick={() => { setMinPrice(''); setMaxPrice(''); }}
                    className="text-zinc-500 hover:text-white text-xs px-1"
                    aria-label="Clear price range"
                  >
                    ✕
                  </button>
                )}
              </div>
              <p className="text-zinc-600 text-xs">Showing {displayed.length} results</p>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 px-4">
            {displayed.map((product, i) => {
                const imageUrl = product.image_url || product.image || '';
                const currency = getCurrency(product.advertiserId || product.supplierMeta?.id || '4118');
                const displayPrice = product.price.replace(/[£€]/, currency.symbol);
                const searchedSize = `${selectedWidth}/${selectedProfile} R${selectedRim.replace('R', '')}`;
                const displayTitle = product.title.includes(selectedWidth)
                  ? product.title
                  : `${searchedSize} — ${product.title}`;

                // Brand-based gradient + initials fallback (so each card looks visually different)
                const brandKey = (product.brand || product.title.split(' ')[0] || 'Tyre').trim();
                const BRAND_GRADIENTS: Record<string, string> = {
                  Michelin: 'linear-gradient(135deg,#003d7a 0%,#0066cc 100%)',
                  Continental: 'linear-gradient(135deg,#ea7600 0%,#ffb000 100%)',
                  Bridgestone: 'linear-gradient(135deg,#c8102e 0%,#ff4d4d 100%)',
                  Pirelli: 'linear-gradient(135deg,#ffcc00 0%,#ffeb66 100%)',
                  Goodyear: 'linear-gradient(135deg,#003478 0%,#0055aa 100%)',
                  Dunlop: 'linear-gradient(135deg,#fdb913 0%,#ffd966 100%)',
                  Hankook: 'linear-gradient(135deg,#e60012 0%,#ff5566 100%)',
                  Yokohama: 'linear-gradient(135deg,#003366 0%,#0066aa 100%)',
                  Falken: 'linear-gradient(135deg,#1a1a1a 0%,#4a4a4a 100%)',
                  Toyo: 'linear-gradient(135deg,#cc0000 0%,#ff4444 100%)',
                  Nokian: 'linear-gradient(135deg,#0078d4 0%,#40a0e8 100%)',
                  Kumho: 'linear-gradient(135deg,#e30613 0%,#ff5060 100%)',
                  Nexen: 'linear-gradient(135deg,#005baa 0%,#338ed4 100%)',
                  Maxxis: 'linear-gradient(135deg,#cf0a2c 0%,#ff4060 100%)',
                  Vredestein: 'linear-gradient(135deg,#e87722 0%,#ffaa55 100%)',
                  Avon: 'linear-gradient(135deg,#004990 0%,#3377bb 100%)',
                  Uniroyal: 'linear-gradient(135deg,#003087 0%,#3360b8 100%)',
                  BFGoodrich: 'linear-gradient(135deg,#cc0000 0%,#1a1a1a 100%)',
                  Firestone: 'linear-gradient(135deg,#e4002b 0%,#ff4d6b 100%)',
                };
                let brandGradient = BRAND_GRADIENTS[brandKey];
                if (!brandGradient) {
                  let hash = 0;
                  for (let j = 0; j < brandKey.length; j++) hash = brandKey.charCodeAt(j) + ((hash << 5) - hash);
                  const hue = Math.abs(hash) % 360;
                  brandGradient = `linear-gradient(135deg, hsl(${hue} 65% 30%) 0%, hsl(${(hue + 30) % 360} 70% 50%) 100%)`;
                }
                const initials = brandKey.slice(0, 2).toUpperCase();

                return (
                  <div
                    key={`${product.supplierMeta?.id || ''}-${product.id || i}`}
                    className="bg-zinc-900 border border-zinc-800/80 hover:border-zinc-600 rounded-2xl overflow-hidden transition-[colors,transform] hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/50 group flex flex-col"
                  >
                    <a
                      href={product.url}
                      target="_blank"
                      rel="noopener noreferrer sponsored"
                      className="block"
                    >
                      <div className="aspect-square bg-zinc-800/50 relative overflow-hidden flex items-center justify-center p-4">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={product.title}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              const img = e.currentTarget;
                              img.style.display = 'none';
                              const fb = img.nextElementSibling as HTMLElement | null;
                              if (fb) fb.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div
                          className="w-full h-full flex-col items-center justify-center text-white"
                          style={{
                            display: imageUrl ? 'none' : 'flex',
                            background: brandGradient,
                          }}
                        >
                          <span className="text-3xl mb-1 opacity-90">🛞</span>
                          <span className="text-lg font-black tracking-wider drop-shadow-md">{initials}</span>
                          <span className="text-[10px] uppercase tracking-widest opacity-70 mt-0.5">{brandKey}</span>
                        </div>
                        <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/70 backdrop-blur-sm rounded-full px-2 py-1">
                          <FlagImg advertiserId={product.advertiserId || product.supplierMeta?.id || 'all'} />
                        </div>
                      </div>
                    </a>

                    <div className="p-3 flex flex-col flex-1">
                      <a href={product.url} target="_blank" rel="noopener noreferrer sponsored">
                        <p className="text-xs font-semibold text-white line-clamp-2 mb-1 leading-snug group-hover:text-red-400 transition-colors">
                          {displayTitle}
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
                      <div className="flex items-center gap-1 mt-1">
                        <FlagImg advertiserId={product.advertiserId || product.supplierMeta?.id || 'all'} />
                        <span className="text-[10px] text-zinc-500 truncate">
                          {product.supplierMeta?.siteName || product.supplierName}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-700">
                        {product.supplierMeta?.shipsTo || 'Ships to UK + 35 countries'}
                      </p>

                      {/free/i.test(product.shipping || '') && (
                        <span className="inline-flex items-center gap-1 mt-1.5 self-start bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          🚚 Free delivery
                        </span>
                      )}

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
                          className="min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 sm:p-1.5 flex items-center justify-center rounded-lg hover:bg-zinc-800 transition-colors"
                          title="Save"
                          aria-label="Save this part"
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
                          className="min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 sm:p-1.5 flex items-center justify-center rounded-lg hover:bg-zinc-800 transition-colors"
                          title="Price alert"
                          aria-label="Set price alert"
                        >
                          <Bell className="w-3.5 h-3.5 text-zinc-500 hover:text-yellow-400" />
                        </button>
                        <button
                          onClick={(e) => { e.preventDefault(); toggleCompare(product); }}
                          title="Compare"
                          aria-label="Compare this part"
                          className={`min-w-[44px] min-h-[44px] sm:w-9 sm:h-9 sm:min-w-0 sm:min-h-0 rounded-xl border flex items-center justify-center transition-colors ${
                            compareList.find(p => p.id === product.id)
                              ? 'border-red-500 bg-red-600/20 text-red-400'
                              : 'border-white/[0.06] bg-[#1a1a1a] hover:bg-[#222] text-zinc-400 hover:text-white'
                          }`}
                        >
                          <Scale size={14} />
                        </button>
                        <a
                          href={product.url}
                          target="_blank"
                          rel="noopener noreferrer sponsored"
                          className="ml-auto px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg transition-colors"
                        >
                          Buy →
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

        {/* Trust section */}
        <section className="max-w-4xl mx-auto px-4 pb-16">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { icon: '🛡️', label: 'OEM Approved' },
              { icon: '🚚', label: 'Free Delivery Available' },
              { icon: '⭐', label: '4.8/5 Customer Rating' },
            ].map((t) => (
              <div
                key={t.label}
                className="flex items-center justify-center gap-2 bg-zinc-900/60 border border-zinc-800 rounded-2xl px-4 py-4"
              >
                <span className="text-xl" aria-hidden="true">{t.icon}</span>
                <span className="text-zinc-200 text-sm font-semibold">{t.label}</span>
              </div>
            ))}
          </div>
        </section>
      </main>

      <CompareBar
        items={compareItems}
        onOpen={() => setShowCompareModal(true)}
        onClear={() => setCompareList([])}
      />
      {showCompareModal && (
        <TyreCompareModal
          items={tyreCompareItems}
          onRemove={(id) => setCompareList(prev => prev.filter(p => p.id !== id))}
          onClose={() => setShowCompareModal(false)}
        />
      )}

      <Footer />
    </div>
  );
};

export default Tyres;
