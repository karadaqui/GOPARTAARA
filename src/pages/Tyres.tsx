// Tyres v2.1 - filter fix - cache bust
import { useState, useMemo } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import SafeImage from "@/components/SafeImage";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";

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

const Flag = ({ id }: { id: string }) => {
  const code = FLAG_MAP[id] || '1f30d';
  return (
    <img
      src={`https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/${code}.png`}
      alt=""
      width={16}
      height={16}
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

const isWinter = (t: Tyre) => /winter|wintrac|wintercontact|ultragr|nordic|ice/i.test(t.name);
const isAllSeason = (t: Tyre) => /all.?season|4s |quadraxer|solus vier/i.test(t.name);
const priceNum = (p: string) => parseFloat((p || '0').replace(/[^0-9.]/g, '')) || 0;

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

  const handleSearch = async () => {
    setLoading(true);
    setSearched(true);
    setPage(1);
    try {
      const { data, error } = await supabase.functions.invoke('awin-tyre-feed', {
        body: { width, profile, rim },
      });
      if (error) throw error;
      setAllResults((data?.products || []) as Tyre[]);
    } catch (e) {
      console.error(e);
      setAllResults([]);
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
      displayed = [...displayed].sort((a, b) => {
        const aM = isWinterTyre(a.name || '');
        const bM = isWinterTyre(b.name || '');
        if (aM && !bM) return -1;
        if (!aM && bM) return 1;
        return 0;
      });
    } else if (season === 'summer') {
      displayed = [...displayed].sort((a, b) => {
        const aM = !isWinterTyre(a.name || '') && !isAllSeasonTyre(a.name || '');
        const bM = !isWinterTyre(b.name || '') && !isAllSeasonTyre(b.name || '');
        if (aM && !bM) return -1;
        if (!aM && bM) return 1;
        return 0;
      });
    } else if (season === 'allseason') {
      displayed = [...displayed].sort((a, b) => {
        const aM = isAllSeasonTyre(a.name || '');
        const bM = isAllSeasonTyre(b.name || '');
        if (aM && !bM) return -1;
        if (!aM && bM) return 1;
        return 0;
      });
    }
  }

  const totalPages = Math.max(1, Math.ceil(displayed.length / 24));
  const safePage = Math.min(page, totalPages);
  const pageItems = displayed.slice((safePage - 1) * 24, safePage * 24);

  const SeasonBtn = ({ value, label }: { value: typeof season; label: string }) => (
    <button
      onClick={() => {
        setSeason(value);
        setPage(1);
        if (value === 'summer') console.log('SET SUMMER');
        else if (value === 'winter') console.log('SET WINTER');
        else if (value === 'allseason') console.log('SET ALLSEASON');
        else console.log('SET ALL');
      }}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        season === value ? 'bg-primary text-primary-foreground' : 'bg-card text-foreground border border-border hover:bg-muted'
      }`}
    >
      {label}
    </button>
  );

  console.log('pageItems[0]:', pageItems[0]?.name);
  console.log('pageItems[1]:', pageItems[1]?.name);
  console.log('pageItems[2]:', pageItems[2]?.name);
  console.log('displayed.length:', displayed.length);
  console.log('season:', season);
  console.log('page:', page);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Tyre Search | GoPartara" description="Compare tyre prices across major suppliers." />
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 text-foreground">Find Tyres</h1>

        {/* Search */}
        <div className="bg-card border border-border rounded-2xl p-4 mb-6">
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Width</label>
              <select value={width} onChange={(e) => setWidth(e.target.value)} className="bg-background border border-border rounded-lg px-3 py-2 text-foreground">
                {WIDTHS.map((w) => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Profile</label>
              <select value={profile} onChange={(e) => setProfile(e.target.value)} className="bg-background border border-border rounded-lg px-3 py-2 text-foreground">
                {PROFILES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Rim</label>
              <select value={rim} onChange={(e) => setRim(e.target.value)} className="bg-background border border-border rounded-lg px-3 py-2 text-foreground">
                {RIMS.map((r) => <option key={r} value={r}>R{r}</option>)}
              </select>
            </div>
            <button
              onClick={handleSearch}
              disabled={loading}
              className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {!loading && searched && allResults.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">No tyres found for {width}/{profile} R{rim}.</div>
        )}

        {!loading && allResults.length > 0 && (
          <>
            {/* Filters */}
            <div className="bg-card border border-border rounded-2xl p-4 mb-6 space-y-4">
              <div className="flex flex-wrap gap-2">
                <SeasonBtn value="all" label="All Seasons" />
                <SeasonBtn value="summer" label="Summer" />
                <SeasonBtn value="winter" label="Winter" />
                <SeasonBtn value="allseason" label="4 Season" />
              </div>

              {uniqueSuppliers.length > 1 && (
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => { setSupplier('all'); resetPage(); }}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                      supplier === 'all' ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-foreground border-border hover:bg-muted'
                    }`}
                  >
                    All Suppliers
                  </button>
                  {uniqueSuppliers.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => { setSupplier(s.id); resetPage(); }}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border flex items-center gap-1.5 ${
                        supplier === s.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-foreground border-border hover:bg-muted'
                      }`}
                    >
                      <Flag id={s.id} /> {s.name}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap gap-3 items-center">
                <select
                  value={brand}
                  onChange={(e) => { setBrand(e.target.value); resetPage(); }}
                  className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                >
                  <option value="all">All Brands</option>
                  {uniqueBrands.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>

                <input
                  type="number"
                  placeholder="£ Min"
                  value={minPrice}
                  onChange={(e) => { setMinPrice(e.target.value); resetPage(); }}
                  className="w-24 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                />
                <span className="text-muted-foreground">—</span>
                <input
                  type="number"
                  placeholder="£ Max"
                  value={maxPrice}
                  onChange={(e) => { setMaxPrice(e.target.value); resetPage(); }}
                  className="w-24 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                />

                <div className="flex gap-2 ml-auto">
                  <button
                    onClick={() => { setSort('asc'); resetPage(); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
                      sort === 'asc' ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-foreground border-border hover:bg-muted'
                    }`}
                  >
                    Price ↑
                  </button>
                  <button
                    onClick={() => { setSort('desc'); resetPage(); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
                      sort === 'desc' ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-foreground border-border hover:bg-muted'
                    }`}
                  >
                    Price ↓
                  </button>
                </div>
              </div>
            </div>

            <div className="text-sm text-muted-foreground mb-4">
              Showing {pageItems.length} of {displayed.length} results
            </div>

            {(() => {
              console.log('FIRST 3 DISPLAYED:', displayed.slice(0,3).map(t => t.name).join(' | '));
              console.log('SEASON STATE:', season);
              console.log('WINTER TEST on first item:', /winter|wintrac|wintercontact|ultragr|nordic|ice/i.test(displayed[0]?.name || ''));
              return null;
            })()}
            <div key={`${season}-${supplier}-${brand}-${page}`} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {pageItems.map((t) => (
                <div key={`${t.name}-${t.supplier}-${t.price}`} className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col">
                  <div className="aspect-square bg-muted flex items-center justify-center">
                    {t.image_url ? (
                      <SafeImage src={t.image_url} alt={t.name} className="w-full h-full object-contain" />
                    ) : null}
                  </div>
                  <div className="p-4 flex-1 flex flex-col gap-2">
                    <h3 className="text-sm font-medium text-foreground line-clamp-2">{t.name}</h3>
                    <div className="text-lg font-bold text-foreground">{t.price}</div>
                    {t.brand && <div className="text-xs text-muted-foreground">{t.brand}</div>}
                    <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Flag id={String(t.advertiserId)} /> {t.supplier}
                    </div>
                    <a
                      href={t.url}
                      target="_blank"
                      rel="noopener noreferrer sponsored"
                      className="mt-auto inline-flex items-center justify-center bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90"
                    >
                      Buy →
                    </a>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-8">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  className="flex items-center gap-1 px-4 py-2 rounded-lg border border-border bg-card text-foreground disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" /> Previous
                </button>
                <span className="text-sm text-muted-foreground">Page {safePage} of {totalPages}</span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                  className="flex items-center gap-1 px-4 py-2 rounded-lg border border-border bg-card text-foreground disabled:opacity-40"
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
