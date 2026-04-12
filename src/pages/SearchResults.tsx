import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { X } from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { sanitizeInput, checkRateLimit, getCachedSearch, setCachedSearch } from "@/lib/sanitize";
import { useScaleSERP } from "@/lib/featureFlags";
import SafeImage from "@/components/SafeImage";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import {
  Search, ExternalLink, Loader2, Camera, Car, Scale, Star,
  Truck, Bookmark, BookmarkCheck, Clock,
  Heart, AlertCircle, Zap,
  ChevronLeft, ChevronRight, ChevronDown, Pencil, Calendar, Palette, Fuel, Gauge,
  ShieldCheck, Receipt, Check,
} from "lucide-react";
import PriceAlertDialog from "@/components/PriceAlertDialog";
import { useAuth } from "@/contexts/AuthContext";
import VehicleLookup from "@/components/VehicleLookup";
import SearchBarGarageDropdown from "@/components/SearchBarGarageDropdown";
import SearchCounter from "@/components/SearchCounter";
import { CompareBar, CompareModal, type CompareItem } from "@/components/PartsComparison";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSearchLimit } from "@/hooks/useSearchLimit";
import AuthGateModal from "@/components/AuthGateModal";
import LocationNudge from "@/components/LocationNudge";
import { useCountry } from "@/hooks/useCountry";
import { useLocale } from "@/contexts/LocaleContext";
import CountryFlag from "@/components/CountryFlag";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import FilterBar from "@/components/FilterBar";


// ── Twemoji helper ──
const parseTwemoji = () => {
  if (typeof window !== "undefined" && (window as any).twemoji) {
    (window as any).twemoji.parse(document.body, { folder: "svg", ext: ".svg" });
  }
};

// ── Supplier configs ──
const googleSite = (domain: string) => (q: string) =>
  `https://www.google.com/search?q=site:${domain}+${q.replace(/\s+/g, "+")}`;

const suppliers: { name: string; flag: string; gradient: string; buildUrl: (q: string) => string }[] = [
  { name: "Euro Car Parts", flag: "🇬🇧", gradient: "from-blue-600 to-indigo-700", buildUrl: googleSite("eurocarparts.com") },
  { name: "GSF Car Parts", flag: "🇬🇧", gradient: "from-emerald-600 to-teal-700", buildUrl: googleSite("gsfcarparts.com") },
  { name: "Car Parts 4 Less", flag: "🇬🇧", gradient: "from-purple-600 to-purple-800", buildUrl: googleSite("carparts4less.co.uk") },
  { name: "AutoDoc", flag: "🇬🇧", gradient: "from-cyan-500 to-blue-600", buildUrl: googleSite("autodoc.co.uk") },
  { name: "Amazon UK", flag: "🇬🇧", gradient: "from-orange-500 to-amber-600", buildUrl: (q) => `https://www.amazon.co.uk/s?k=${q.replace(/\s+/g, "+")}&tag=gopartara-21` },
  { name: "Partmaster", flag: "🇬🇧", gradient: "from-slate-600 to-slate-800", buildUrl: googleSite("partmaster.co.uk") },
  { name: "LKQ Euro Car Parts", flag: "🇬🇧", gradient: "from-blue-500 to-blue-700", buildUrl: googleSite("lkqeurocarparts.com") },
];

const globalSuppliers: { name: string; flag: string; region: string; gradient: string; buildUrl: (q: string) => string }[] = [
  { name: "RockAuto", flag: "🇺🇸", region: "USA", gradient: "from-yellow-600 to-orange-700", buildUrl: (q) => `https://www.rockauto.com/en/catalog/?a=${encodeURIComponent(q)}` },
  { name: "PartsGeek", flag: "🇺🇸", region: "USA", gradient: "from-red-600 to-red-800", buildUrl: (q) => `https://www.partsgeek.com/catalog/search/?search=${encodeURIComponent(q)}` },
  { name: "AutoZone", flag: "🇺🇸", region: "USA", gradient: "from-amber-600 to-red-700", buildUrl: (q) => `https://www.autozone.com/searchresult?searchText=${encodeURIComponent(q)}` },
  { name: "Mister Auto", flag: "🇪🇺", region: "Europe", gradient: "from-blue-500 to-indigo-600", buildUrl: (q) => `https://www.mister-auto.com/recherche?q=${encodeURIComponent(q)}` },
];

const PART_CATEGORIES = [
  { label: "All Parts", icon: "🔧" },
  { label: "Engine", icon: "⚙️" },
  { label: "Brakes", icon: "🛑" },
  { label: "Suspension", icon: "🔧" },
  { label: "Electrical", icon: "⚡" },
  { label: "Body Panels", icon: "🚗" },
  { label: "Exhaust", icon: "💨" },
  { label: "Filters", icon: "🔍" },
  { label: "Lighting", icon: "💡" },
  { label: "Transmission", icon: "⚙️" },
  { label: "Interior", icon: "🪑" },
];

const SORT_OPTIONS = [
  { value: "best_match", label: "Best Match", icon: "✦" },
  { value: "price_asc", label: "Price: Low to High", icon: "💰" },
  { value: "price_desc", label: "Price: High to Low", icon: "💰" },
  { value: "fastest_ship", label: "Fastest Shipping", icon: "⚡" },
  { value: "slowest_ship", label: "Slowest Shipping", icon: "🐢" },
  { value: "top_rated", label: "Top Rated Sellers", icon: "⭐" },
  { value: "newly_listed", label: "Newly Listed", icon: "🆕" },
  { value: "most_viewed", label: "Most Viewed", icon: "🔥" },
] as const;


const PRICE_RANGES = [
  { label: "All Prices", min: 0, max: Infinity },
  { label: "Under £25", min: 0, max: 25 },
  { label: "£25 – £100", min: 25, max: 100 },
  { label: "£100 – £500", min: 100, max: 500 },
  { label: "Over £500", min: 500, max: Infinity },
] as const;


const oemBrands: { brand: string; pattern: RegExp; label: string; url: (q: string) => string; gradient: string }[] = [
  { brand: "BMW", pattern: /bmw/i, label: "BMW OEM Catalog", url: (q) => `https://www.realoem.com/bmw/enUS/partxref?q=${encodeURIComponent(q)}`, gradient: "from-[#1C69D4] to-[#0A3D91]" },
  { brand: "Mercedes", pattern: /mercedes|merc|benz/i, label: "Mercedes Parts", url: (q) => `https://www.mercedes-benz-parts.com/search?q=${encodeURIComponent(q)}`, gradient: "from-[#1A1A1A] to-[#333]" },
  { brand: "Audi", pattern: /audi/i, label: "Audi Parts", url: (q) => `https://www.audi-shopping.com/search?q=${encodeURIComponent(q)}`, gradient: "from-[#1A1A1A] to-[#444]" },
  { brand: "Ford", pattern: /ford/i, label: "Ford Parts", url: (q) => `https://www.fordparts.com/search?q=${encodeURIComponent(q)}`, gradient: "from-[#003478] to-[#001f4d]" },
  { brand: "Vauxhall", pattern: /vauxhall|opel/i, label: "Vauxhall Parts", url: (q) => `https://www.vauxhall.co.uk/services/parts/search?q=${encodeURIComponent(q)}`, gradient: "from-[#C4122F] to-[#8B0D22]" },
  { brand: "Toyota", pattern: /toyota/i, label: "Toyota Parts", url: (q) => `https://www.toyotaparts.co.uk/search?q=${encodeURIComponent(q)}`, gradient: "from-[#EB0A1E] to-[#9B0714]" },
  { brand: "Volkswagen", pattern: /volkswagen|vw/i, label: "VW Parts", url: (q) => `https://www.vwparts.co.uk/search?q=${encodeURIComponent(q)}`, gradient: "from-[#001E50] to-[#00122F]" },
];

const getOemSearchQuery = (query: string, pattern: RegExp) => query.replace(pattern, "").replace(/\s+/g, " ").trim() || query;

const countryFlags: Record<string, string> = {
  GB: "🇬🇧", US: "🇺🇸", DE: "🇩🇪", CN: "🇨🇳", IT: "🇮🇹", FR: "🇫🇷", ES: "🇪🇸", PL: "🇵🇱", NL: "🇳🇱", JP: "🇯🇵", AU: "🇦🇺",
};

const ITEMS_PER_PAGE = 12;

const MODEL_EXAMPLES: Record<string, string> = {
  VAUXHALL: "e.g. Astra, Corsa, Insignia, Mokka, Grandland",
  BMW: "e.g. 3 Series, 5 Series, X5, 1 Series, X3",
  MERCEDES: "e.g. C Class, E Class, A Class, GLC, S Class",
  AUDI: "e.g. A3, A4, Q5, A6, TT",
  FORD: "e.g. Focus, Fiesta, Kuga, Mondeo, Puma",
  TOYOTA: "e.g. Corolla, RAV4, Yaris, C-HR, Aygo",
  VOLKSWAGEN: "e.g. Golf, Polo, Tiguan, Passat, T-Roc",
  HONDA: "e.g. Civic, CR-V, Jazz, HR-V",
  NISSAN: "e.g. Qashqai, Juke, Micra, X-Trail",
  VOLVO: "e.g. XC60, XC90, V40, S60",
};
const getModelPlaceholder = (make?: string) => MODEL_EXAMPLES[make?.toUpperCase() || ""] || "e.g. enter your model name";

interface VehicleInfo {
  make: string;
  model?: string | null;
  yearOfManufacture?: number | null;
  colour?: string | null;
  fuelType?: string | null;
  engineCapacity?: number | null;
  motStatus?: string | null;
  taxStatus?: string | null;
  registrationNumber?: string | null;
}

// ── Price analysis helpers ──
const extractPartType = (title: string): string => {
  const t = title.toLowerCase();
  const partPatterns = [
    "brake pad", "brake disc", "brake caliper", "brake shoe", "brake line",
    "air filter", "oil filter", "fuel filter", "cabin filter", "pollen filter",
    "wiper blade", "wiper", "spark plug", "glow plug",
    "headlight", "tail light", "fog light", "indicator", "bulb",
    "wing mirror", "mirror", "bumper", "grille", "bonnet", "boot lid",
    "alternator", "starter motor", "water pump", "fuel pump", "power steering pump",
    "radiator", "thermostat", "turbo", "turbocharger", "exhaust", "catalytic converter",
    "clutch kit", "clutch", "flywheel", "gearbox", "transmission",
    "shock absorber", "spring", "strut", "control arm", "ball joint", "tie rod",
    "timing belt", "timing chain", "drive belt", "serpentine belt",
    "battery", "engine", "cylinder head", "camshaft", "crankshaft",
    "door handle", "window regulator", "wheel bearing", "hub", "cv joint", "driveshaft",
    "seat", "steering wheel", "dashboard", "instrument cluster",
    "ecu", "sensor", "coil pack", "ignition coil", "injector", "throttle body",
    "alloy wheel", "wheel", "tyre",
  ];
  for (const p of partPatterns) {
    if (t.includes(p)) return p;
  }
  const words = t.replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(w => w.length > 2 && !["for", "the", "and", "new", "fit", "fits", "with", "set"].includes(w));
  return words.slice(0, 3).join(" ") || "unknown";
};

const medianOf = (arr: number[]) => {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

const matchesConditionFilter = (condition: string | undefined, filter: string) => {
  const normalized = condition?.trim().toLowerCase() || "";

  if (filter === "All") return true;
  if (filter === "New") return normalized === "new";
  if (filter === "Used") return normalized === "used" || normalized.includes("pre-owned");
  if (filter === "Refurbished") return normalized.includes("refurb");

  return true;
};

const getConditionMeta = (condition: string | undefined) => {
  const label = condition?.trim() || "Unknown";
  const normalized = label.toLowerCase();

  if (normalized === "new") {
    return { label, classes: "bg-emerald-900/60 text-emerald-400 border-b border-emerald-500/20" };
  }

  if (normalized === "used" || normalized.includes("pre-owned")) {
    return { label, classes: "bg-amber-900/60 text-amber-400 border-b border-amber-500/20" };
  }

  if (normalized.includes("refurb")) {
    return { label, classes: "bg-blue-900/60 text-blue-400 border-b border-blue-500/20" };
  }

  if (normalized.includes("for parts") || normalized.includes("not working")) {
    return { label, classes: "bg-red-900/60 text-red-400 border-b border-red-500/20" };
  }

  return { label, classes: "bg-zinc-800/80 text-zinc-400 border-b border-white/10" };
};

const RESULT_ICON_BUTTON_CLASS = "w-8 h-8 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-white/[0.06] flex items-center justify-center text-zinc-400 hover:text-white transition-all duration-200";

const getPriceBadgeClasses = (variant: "great" | "good" | "high" | "top") => {
  if (variant === "great") return "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25";
  if (variant === "good") return "bg-blue-500/15 text-blue-400 border border-blue-500/25";
  if (variant === "high") return "bg-red-500/15 text-red-400 border border-red-500/25";

  return "bg-amber-500/15 text-amber-400 border border-amber-500/25";
};

// ── Skeleton Card ──
const SkeletonCard = () => (
  <div className="rounded-3xl overflow-hidden border border-white/[0.06] bg-[#111111]">
    <div className="h-52 bg-gradient-to-r from-[#111] via-[#1a1a1a] to-[#111] bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite]" />
    <div className="p-4 space-y-3">
      <div className="h-4 w-3/4 rounded-full bg-gradient-to-r from-[#111] via-[#1a1a1a] to-[#111] bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite]" />
      <div className="h-4 w-1/2 rounded-full bg-gradient-to-r from-[#111] via-[#1a1a1a] to-[#111] bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite]" />
      <div className="h-7 w-1/3 rounded-full bg-gradient-to-r from-[#111] via-[#1a1a1a] to-[#111] bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite]" />
      <div className="h-9 w-full rounded-xl bg-gradient-to-r from-[#111] via-[#1a1a1a] to-[#111] bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite]" />
    </div>
  </div>
);


// ══════════════════════════════════════════════
// ██  MAIN COMPONENT
// ══════════════════════════════════════════════
const SearchResults = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const searchLimit = useSearchLimit();
  const { country, isGlobal } = useCountry();
  const locale = useLocale();
  const urlQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(urlQuery);
  const [activeQuery, setActiveQuery] = useState(urlQuery);
  const [identifying, setIdentifying] = useState(false);
  const [searchMode, setSearchMode] = useState<"text" | "reg">("text");
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [compareParts, setCompareParts] = useState<CompareItem[]>([]);
  const [showCompare, setShowCompare] = useState(false);
  const [liveResults, setLiveResults] = useState<any[]>([]);
  const [liveLoading, setLiveLoading] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [savingId, setSavingId] = useState<string | null>(null);
  const [vehicleInfo, setVehicleInfo] = useState<VehicleInfo | null>(null);
  const [vehicleModelInput, setVehicleModelInput] = useState("");
  const [vehicleModelConfirmed, setVehicleModelConfirmed] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [totalResults, setTotalResults] = useState(0);
  const [ebayFallback, setEbayFallback] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const internalSearchRef = useRef(false);
  const [authGateOpen, setAuthGateOpen] = useState(false);
  const [supplierBannerDismissed, setSupplierBannerDismissed] = useState(() => localStorage.getItem("supplier_banner_dismissed") === "1");
  const resultsRef = useRef<HTMLDivElement>(null);

  // ── ScaleSERP state ──
  const [scaleSerpResults, setScaleSerpResults] = useState<any[]>([]);
  const [scaleSerpLoading, setScaleSerpLoading] = useState(false);

  // ── Filter & Sort State ──
  const [sortBy, setSortByRaw] = useState<typeof SORT_OPTIONS[number]["value"]>("best_match");
  const [conditionFilter, setConditionFilterRaw] = useState("All");
  const [shippingFilter, setShippingFilterRaw] = useState("All");
  const [priceRangeIdx, setPriceRangeIdxRaw] = useState(0);
  const [brandFilter, setBrandFilterRaw] = useState("All");
  const [categoryFilter, setCategoryFilterRaw] = useState("All Parts");

  // Wrap setters to reset page on filter change
  const setSortBy = (v: typeof SORT_OPTIONS[number]["value"]) => { setSortByRaw(v); setCurrentPage(1); };
  const setConditionFilter = (v: string) => { setConditionFilterRaw(v); setCurrentPage(1); };
  const setShippingFilter = (v: string) => { setShippingFilterRaw(v); setCurrentPage(1); };
  const setPriceRangeIdx = (v: number) => { setPriceRangeIdxRaw(v); setCurrentPage(1); };
  const setBrandFilter = (v: string) => { setBrandFilterRaw(v); setCurrentPage(1); };
  const setCategoryFilter = (v: string) => { setCategoryFilterRaw(v); setCurrentPage(1); };
  

  // Parse twemoji after results render
  useEffect(() => {
    const timer = setTimeout(parseTwemoji, 100);
    return () => clearTimeout(timer);
  }, [liveResults]);

  // ── URL sync ──
  useEffect(() => {
    if (urlQuery && urlQuery !== query) setQuery(urlQuery);
    if (urlQuery && urlQuery !== activeQuery) { setActiveQuery(urlQuery); setCurrentPage(1); }
    if (urlQuery) setSearchMode("text");
    if (urlQuery && !user) setAuthGateOpen(true);
  }, [urlQuery]);

  useEffect(() => {
    const v = searchParams.get("vehicle");
    if (v) { try { setVehicleInfo(JSON.parse(decodeURIComponent(v))); } catch { } }
    else setVehicleInfo(null);
  }, [searchParams]);

  // ── eBay search ──
  useEffect(() => {
    if (!activeQuery.trim()) { setLiveResults([]); setTotalResults(0); setEbayFallback(false); return; }
    if (!user) { setAuthGateOpen(true); setLiveResults([]); setTotalResults(0); return; }
    let cancelled = false;

    // Build a cache key from all filter state
    const cacheKey = JSON.stringify({ activeQuery, selectedCategory, currentPage, marketplace: country.ebayMarketplace, conditionFilter, shippingFilter, priceRangeIdx, sortBy, categoryFilter, brandFilter });
    const cached = getCachedSearch(cacheKey);
    if (cached) {
      setLiveResults(cached.results || []);
      setTotalResults(cached.totalResults || 0);
      setEbayFallback(!!cached.fallback);
      setLiveLoading(false);
      return;
    }

    // Debounce 300ms
    const debounceTimer = setTimeout(() => {
      const fetchLive = async () => {
        setLiveLoading(true);
        setEbayFallback(false);
        try {
          const offset = (currentPage - 1) * ITEMS_PER_PAGE;
          const priceRange = PRICE_RANGES[priceRangeIdx];
          const body: Record<string, any> = {
            query: sanitizeInput(activeQuery),
            category: selectedCategory || undefined,
            offset,
            marketplace: country.ebayMarketplace,
          };
          if (conditionFilter !== "All") body.conditionFilter = conditionFilter;
          if (shippingFilter !== "All") body.shippingFilter = shippingFilter;
          if (priceRangeIdx > 0) {
            body.priceMin = priceRange.min;
            if (priceRange.max !== Infinity) body.priceMax = priceRange.max;
          }
          if (sortBy !== "best_match") body.sortBy = sortBy;
          if (categoryFilter !== "All Parts") body.categoryFilter = categoryFilter;

          const { data, error } = await supabase.functions.invoke("search-parts", { body });
          if (error) {
            const msg = (error as any)?.message || "";
            if (msg.includes("UNAUTHORIZED") || msg.includes("401")) { if (!cancelled) setAuthGateOpen(true); return; }
            if (msg.includes("SEARCH_LIMIT_REACHED") || msg.includes("403")) {
              if (!cancelled) { toast({ title: "Search limit reached", description: "Upgrade to Pro for unlimited searches.", variant: "destructive" }); searchLimit.refresh(); }
              return;
            }
            throw error;
          }
          if (!cancelled) {
            if (data?.error === "UNAUTHORIZED") { setAuthGateOpen(true); return; }
            if (data?.error === "SEARCH_LIMIT_REACHED") { toast({ title: "Search limit reached", description: data?.message || "Upgrade to Pro for unlimited searches.", variant: "destructive" }); searchLimit.refresh(); return; }
            if (data?.fallback) { setEbayFallback(true); setLiveResults([]); setTotalResults(0); }
            else {
              setLiveResults(data?.results || []); setTotalResults(data?.totalResults || 0); searchLimit.refresh();
              setCachedSearch(cacheKey, { results: data?.results, totalResults: data?.totalResults, fallback: false });
            }
          }
        } catch (err) {
          console.error("Live search failed:", err);
          if (!cancelled) { setLiveResults([]); setTotalResults(0); setEbayFallback(true); }
        } finally { if (!cancelled) setLiveLoading(false); }
      };
      fetchLive();
    }, 300);

    return () => { cancelled = true; clearTimeout(debounceTimer); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeQuery, selectedCategory, currentPage, user, country.ebayMarketplace, conditionFilter, shippingFilter, priceRangeIdx, sortBy, categoryFilter, brandFilter]);


  // ── Saved parts ──
  useEffect(() => {
    if (!user) return;
    supabase.from("saved_parts").select("part_number").eq("user_id", user.id).then(({ data }) => {
      if (data) setSavedIds(new Set(data.map((d) => d.part_number).filter(Boolean) as string[]));
    });
  }, [user]);

  // ── ScaleSERP fetch ──
  useEffect(() => {
    if (!useScaleSERP || !activeQuery.trim() || !user) return;
    let cancelled = false;

    const cacheKey = `scaleserp:${activeQuery.toLowerCase()}`;
    try {
      const raw = sessionStorage.getItem(cacheKey);
      if (raw) {
        const { data, ts } = JSON.parse(raw);
        if (Date.now() - ts < 15 * 60 * 1000) {
          setScaleSerpResults(data);
          return;
        }
        sessionStorage.removeItem(cacheKey);
      }
    } catch {}

    setScaleSerpLoading(true);
    supabase.functions.invoke("search-scaleserp", { body: { query: activeQuery } })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data?.results) { setScaleSerpResults([]); return; }
        if (data.results[0]) console.log("[ScaleSERP] first result full object:", JSON.stringify(data.results[0]));
        setScaleSerpResults(data.results);
        try { sessionStorage.setItem(cacheKey, JSON.stringify({ data: data.results, ts: Date.now() })); } catch {}
      })
      .catch(() => { if (!cancelled) setScaleSerpResults([]); })
      .finally(() => { if (!cancelled) setScaleSerpLoading(false); });

    return () => { cancelled = true; };
  }, [activeQuery, user]);

  // ── Handlers ──
  const handleVehicleLookupStart = () => {
    setVehicleInfo(null); setQuery(""); setActiveQuery(""); setSelectedCategory(null);
    setLiveResults([]); setTotalResults(0); setSearchParams({});
  };

  const handleVehicleLookupSuccess = (vehicle: VehicleInfo) => {
    if (!user) { setAuthGateOpen(true); return; }
    const nextQuery = `${vehicle.make} ${vehicle.yearOfManufacture || ""}`.trim();
    setVehicleInfo(vehicle); setVehicleModelInput(""); setVehicleModelConfirmed(!!vehicle.model);
    setQuery(nextQuery); setActiveQuery(nextQuery); setSelectedCategory(null); setCurrentPage(1);
    setSearchMode("text"); setSearchParams({ q: nextQuery, vehicle: JSON.stringify(vehicle) });
    if (user) searchLimit.recordSearch();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { setAuthGateOpen(true); return; }
    const sanitized = sanitizeInput(query.trim());
    if (!sanitized) return;
    if (searchLimit.limitReached) { toast({ title: "Search limit reached", description: "Upgrade to Pro for unlimited searches.", variant: "destructive" }); return; }
    if (!checkRateLimit(`search_${user.id}`, 10, 60_000)) { toast({ title: "Slow down", description: "You're searching too fast. Please wait a moment.", variant: "destructive" }); return; }
    internalSearchRef.current = true;
    setActiveQuery(sanitized); setSelectedCategory(null); setCurrentPage(1); setSearchParams({ q: sanitized });
    if (user) searchLimit.recordSearch();
  };

  

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!user) { setAuthGateOpen(true); if (photoInputRef.current) photoInputRef.current.value = ""; return; }
    if (!searchLimit.isPro) { toast({ title: "Photo search is available on Pro and Elite plans", description: "Upgrade to unlock photo search.", variant: "destructive" }); navigate("/pricing"); if (photoInputRef.current) photoInputRef.current.value = ""; return; }
    if (file.size > 5 * 1024 * 1024) { toast({ title: "Too large", description: "Image must be under 5MB.", variant: "destructive" }); return; }
    setIdentifying(true);
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => { reader.onload = () => resolve(reader.result as string); reader.onerror = reject; reader.readAsDataURL(file); });
      const { data, error } = await supabase.functions.invoke("identify-part", { body: { image: base64 } });
      if (error) throw error;
      const partName = data?.partName || "Unknown car part";
      if (partName === "Unknown car part" || data?.confidence === "low") { toast({ title: "Part not recognized", description: data?.details || "Try a clearer photo.", variant: "destructive" }); return; }
      toast({ title: `Identified: ${partName}`, description: "Searching now..." });
      setQuery(partName); setActiveQuery(partName); setCurrentPage(1); setSearchParams({ q: partName });
    } catch (err: any) { toast({ title: "Identification failed", description: err.message || "Try again.", variant: "destructive" }); }
    finally { setIdentifying(false); if (photoInputRef.current) photoInputRef.current.value = ""; }
  };

  const handleSave = async (item: any) => {
    if (!user) { toast({ title: "Sign in required", description: "Create an account to save parts.", variant: "destructive" }); return; }
    setSavingId(item.id);
    const isSaved = savedIds.has(item.partNumber);
    try {
      if (isSaved) {
        await supabase.from("saved_parts").delete().eq("user_id", user.id).eq("part_number", item.partNumber);
        setSavedIds((prev) => { const n = new Set(prev); n.delete(item.partNumber); return n; });
        toast({ title: "Removed from saved" });
      } else {
        await supabase.from("saved_parts").insert({ user_id: user.id, part_name: item.partName, part_number: item.partNumber, price: item.price, supplier: "eBay Motors", url: item.url, image_url: item.imageUrl });
        setSavedIds((prev) => new Set(prev).add(item.partNumber));
        toast({ title: "Part saved!" });
      }
    } catch { toast({ title: "Failed to save", variant: "destructive" }); }
    finally { setSavingId(null); }
  };

  // ── Pagination ──
  const maxPages = Math.floor(10000 / ITEMS_PER_PAGE);
  const totalPages = Math.min(Math.ceil(totalResults / ITEMS_PER_PAGE), maxPages);
  const startItem = (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endItem = Math.min(currentPage * ITEMS_PER_PAGE, totalResults);
  const PAGES_PER_CHUNK = 50;
  const currentChunk = Math.floor((currentPage - 1) / PAGES_PER_CHUNK);
  const chunkStart = currentChunk * PAGES_PER_CHUNK + 1;
  const chunkEnd = Math.min(chunkStart + PAGES_PER_CHUNK - 1, totalPages);
  const handlePageChange = (page: number) => { setCurrentPage(page); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const getPageNumbers = () => {
    const pages: (number | "...")[] = [];
    const rangeSize = chunkEnd - chunkStart + 1;
    if (rangeSize <= 7) { for (let i = chunkStart; i <= chunkEnd; i++) pages.push(i); }
    else {
      pages.push(chunkStart);
      if (currentPage > chunkStart + 2) pages.push("...");
      const start = Math.max(chunkStart + 1, currentPage - 1);
      const end = Math.min(chunkEnd - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < chunkEnd - 2) pages.push("...");
      pages.push(chunkEnd);
    }
    return pages;
  };

  const matchedOemBrands = activeQuery ? oemBrands.filter((b) => b.pattern.test(activeQuery)) : [];

  // ── Price badge computation (relative to current results) ──
  const allPrices = liveResults.filter((r: any) => r.price > 0).map((r: any) => r.price as number);

  const getPriceBadge = (price: number) => {
    if (!price || allPrices.length < 2) return null;
    const sorted = [...allPrices].sort((a, b) => a - b);
    const low = sorted[Math.floor(sorted.length * 0.25)];
    const high = sorted[Math.floor(sorted.length * 0.75)];
    if (price <= low) return { label: locale.t("great_price"), variant: "great" as const };
    if (price >= high) return { label: locale.t("high_price"), variant: "high" as const };
    return { label: locale.t("good_price"), variant: "good" as const };
  };

  const getFlag = (code: string) => countryFlags[code] || "🌍";

  const getGoogleResultUrl = (result: any) => {
    const candidates = [result?.link, result?.product_page_url, result?.url, result?.product_link, result?.shopping_link];
    for (const url of candidates) {
      if (typeof url === "string" && url.startsWith("http")) return url;
    }
    return null;
  };

  const openGoogleResult = (result: any) => {
    const url = getGoogleResultUrl(result);
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    } else {
      console.warn("[Google Shopping] No valid URL found in result:", result);
    }
  };

  const shuffleResults = <T,>(items: T[]) => {
    const shuffled = [...items];

    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled;
  };

  // ── Filtered & Sorted Results ──
  const activeFilterCount = [conditionFilter !== "All", shippingFilter !== "All", priceRangeIdx !== 0, brandFilter !== "All", categoryFilter !== "All Parts"].filter(Boolean).length;

  const filteredResults = (() => {
    let results = [...liveResults];

    // Sorting is handled server-side now, but keep client-side sort as fallback
    // for sorts that eBay doesn't natively support
    if (sortBy === "fastest_ship") results.sort((a, b) => (a.handlingTime || 99) - (b.handlingTime || 99));
    else if (sortBy === "slowest_ship") results.sort((a, b) => (b.handlingTime || 0) - (a.handlingTime || 0));
    else if (sortBy === "top_rated") results.sort((a, b) => (b.sellerPositivePercent || 0) - (a.sellerPositivePercent || 0));
    else if (sortBy === "most_viewed") results.sort((a, b) => (b.watchCount || 0) - (a.watchCount || 0));

    return results;
  })();

  // ── Merge Google Shopping results into unified grid ──
  const unifiedResults = useMemo(() => {
    const ebayItems = filteredResults
      .slice(0, 12)
      .map((result: any) => ({ ...result, _source: "ebay" as const }));

    const googleItems = scaleSerpResults.map((result: any, index: number) => ({
      ...result,
      _source: "google" as const,
      _gsIdx: index,
      _resolvedUrl: getGoogleResultUrl(result),
      image: result.thumbnail || result.image || "",
      source: result.source || "Google Shopping",
    }));

    const googleLimited = googleItems.slice(0, 8);
    const amazonResults = googleItems.filter((result: any) => /amazon/i.test(result.source || "")).slice(0, 8);

    if (brandFilter === "eBay") return ebayItems;
    if (brandFilter === "Google Shopping") return googleLimited;
    if (brandFilter === "Amazon") return amazonResults;
    if (!useScaleSERP || googleLimited.length === 0) return ebayItems;

    return shuffleResults([...ebayItems, ...googleLimited]).slice(0, 20);
  }, [brandFilter, filteredResults, scaleSerpResults]);

  const clearAllFilters = () => {
    setConditionFilter("All");
    setShippingFilter("All");
    setPriceRangeIdx(0);
    setBrandFilter("All");
    setCategoryFilter("All Parts");
    setSortBy("best_match");
  };

  // Vehicle model confirm handler
  const confirmModel = useCallback(() => {
    if (vehicleModelInput.trim() && vehicleInfo) {
      const model = vehicleModelInput.trim().toUpperCase();
      const updated = { ...vehicleInfo, model };
      setVehicleInfo(updated); setVehicleModelConfirmed(true);
      const nextQuery = `${updated.make} ${model} ${updated.yearOfManufacture || ""}`.trim();
      setQuery(nextQuery); setActiveQuery(nextQuery); setCurrentPage(1);
      setSearchParams({ q: nextQuery, vehicle: JSON.stringify(updated) });
    }
  }, [vehicleModelInput, vehicleInfo, setSearchParams]);

  // ══════════════════════════════════════════════
  // ██  RENDER
  // ══════════════════════════════════════════════
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#0a0a0a" }}>
      <Navbar />

      {/* ── Subtle red glow at top ── */}
      <div className="pointer-events-none fixed inset-x-0 top-0 h-[500px] z-0" style={{ background: "radial-gradient(ellipse 80% 40% at 50% -10%, rgba(220,38,38,0.08) 0%, transparent 70%)" }} />

      {/* ── Search Bar (sticky) ── */}
      <div className="sticky top-0 z-20 pt-14 sm:pt-16 border-b border-white/[0.06]" style={{ background: "rgba(10,10,10,0.85)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          {/* Mode tabs */}
          <div className="flex items-center gap-1 mb-3">
            <button onClick={() => setSearchMode("text")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${searchMode === "text" ? "bg-red-600 text-white shadow-lg shadow-red-600/25" : "bg-[#1a1a1a] text-zinc-400 hover:text-white"}`}>
              <Search size={14} /> Part Search
            </button>
            <button onClick={() => setSearchMode("reg")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${searchMode === "reg" ? "bg-red-600 text-white shadow-lg shadow-red-600/25" : "bg-[#1a1a1a] text-zinc-400 hover:text-white"}`}>
              <Car size={14} /> Reg Plate
            </button>
          </div>

          {searchMode === "text" ? (
            <div className="space-y-2">
              <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="flex-1 relative flex items-center group">
                  <SearchBarGarageDropdown onSelect={(vq) => setQuery((prev) => prev.trim() ? `${vq} ${prev.trim()}` : vq)} />
                  <Search size={18} className="absolute left-8 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search car parts..."
                    className="w-full pl-14 pr-4 h-14 rounded-2xl bg-[#141414] border border-white/10 text-white placeholder:text-zinc-500 focus:outline-none focus:border-red-500/50 focus:shadow-[0_0_0_3px_rgba(220,38,38,0.1)] transition-all duration-200 text-sm"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className={`cursor-pointer shrink-0 ${identifying ? "pointer-events-none opacity-60" : ""}`}>
                    <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={identifying} />
                    <div className="flex items-center gap-1.5 px-4 h-14 rounded-xl bg-[#1a1a1a] hover:bg-[#222] border border-white/10 transition-all duration-200 text-sm text-zinc-300">
                      {identifying ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
                      <span>{identifying ? "Identifying..." : "Photo"}</span>
                    </div>
                  </label>
                  <button type="submit" className="h-14 px-6 sm:px-8 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm flex items-center gap-2 transition-colors duration-150 flex-1 sm:flex-none justify-center">
                    <Search size={16} /> Search
                  </button>
                </div>
              </form>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-end gap-2">
                <div className="hidden sm:flex items-center gap-2">
                  {compareParts.length > 0 && (
                    <Button size="sm" variant="outline" className="rounded-full gap-1.5 text-xs h-8 border-white/10 bg-[#1a1a1a] hover:bg-[#222] text-zinc-300" onClick={() => setShowCompare(true)}>
                      <Scale size={12} /> Compare ({compareParts.length})
                    </Button>
                  )}
                  {user && <SearchCounter limitData={searchLimit} />}
                </div>
              </div>
              <div className="sm:hidden flex justify-center mt-1">
                {user && <SearchCounter limitData={searchLimit} />}
              </div>
            </div>
          ) : (
            <VehicleLookup onLookupStart={handleVehicleLookupStart} onVehicleFound={handleVehicleLookupSuccess} />
          )}
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="max-w-7xl mx-auto w-full flex-1 px-4 sm:px-6 lg:px-8 py-6 sm:py-10 relative z-10 animate-fade-in" ref={resultsRef}>
        <LocationNudge />

        {/* ── Supplier Sources Banner ── */}
        {!supplierBannerDismissed && (
          <div className="mb-4 bg-zinc-900/50 border border-white/[0.06] rounded-xl px-4 py-2.5 flex items-center gap-3">
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-medium text-zinc-300">eBay</span>
              <span className="text-[10px] text-zinc-600">•</span>
              <span className="text-xs font-medium text-zinc-300">Amazon</span>
              <span className="text-[10px] text-zinc-600">•</span>
              <span className="text-xs text-zinc-600 opacity-40 grayscale">Euro Car Parts</span>
              <span className="text-xs text-zinc-600 opacity-40 grayscale">GSF</span>
              <span className="text-xs text-zinc-600 opacity-40 grayscale">CP4L</span>
              <span className="text-xs text-zinc-600 opacity-40 grayscale">Autodoc</span>
              <span className="text-sm">🔜</span>
            </div>
            <p className="text-xs text-zinc-500 flex-1 hidden sm:block">More suppliers coming soon — Euro Car Parts, GSF Car Parts, Autodoc & more</p>
            <button
              onClick={() => { setSupplierBannerDismissed(true); localStorage.setItem("supplier_banner_dismissed", "1"); }}
              className="shrink-0 p-1 rounded-lg hover:bg-white/5 text-zinc-600 hover:text-zinc-400 transition-colors"
              aria-label="Dismiss"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {activeQuery ? (
          <>
            {/* Vehicle Info Card */}
            {vehicleInfo && (
              <div className="mb-8 rounded-2xl bg-[#111] border border-white/[0.08] overflow-hidden">
                <div className="px-5 pt-5 pb-3 border-b border-white/[0.06]">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-red-600/15 flex items-center justify-center shrink-0"><Car size={22} className="text-red-500" /></div>
                      <div className="min-w-0">
                        {vehicleModelConfirmed && vehicleInfo.model ? (
                          <div className="flex items-center gap-2">
                            <h2 className="font-bold text-xl text-white tracking-tight">{vehicleInfo.make} {vehicleInfo.model}
                              {vehicleInfo.yearOfManufacture && <span className="text-zinc-500 font-medium ml-1.5">({vehicleInfo.yearOfManufacture})</span>}
                            </h2>
                            <button onClick={() => { setVehicleModelInput(vehicleInfo.model || ""); setVehicleModelConfirmed(false); }} className="p-1 rounded-md hover:bg-white/5 transition-colors text-zinc-500 hover:text-red-500" title="Edit model"><Pencil size={14} /></button>
                          </div>
                        ) : (
                          <h2 className="font-bold text-xl text-white tracking-tight">{vehicleInfo.make}{vehicleInfo.yearOfManufacture && <span className="text-zinc-500 font-medium ml-1.5">({vehicleInfo.yearOfManufacture})</span>}</h2>
                        )}
                      </div>
                    </div>
                    {vehicleInfo.registrationNumber && (
                      <span className="bg-[#1a1a1a] text-white text-xs font-mono font-bold px-3 py-1.5 rounded-lg tracking-wider border border-white/10 shrink-0">{vehicleInfo.registrationNumber}</span>
                    )}
                  </div>
                </div>
                {!vehicleModelConfirmed && (
                  <div className="px-5 py-4 border-b border-white/[0.06] bg-red-600/[0.03]">
                    <p className="text-xs text-zinc-500 mb-2.5 font-medium">Enter your vehicle model for more accurate parts search</p>
                    <div className="flex items-center gap-2">
                      <input value={vehicleModelInput} onChange={(e) => setVehicleModelInput(e.target.value)} placeholder={getModelPlaceholder(vehicleInfo.make)}
                        className="flex-1 h-11 rounded-xl bg-[#141414] border border-white/10 px-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-red-500/50 transition-all"
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); confirmModel(); } }} autoFocus />
                      <button type="button" onClick={confirmModel} disabled={!vehicleModelInput.trim()}
                        className="h-11 px-5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm flex items-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                        <Check size={16} /> Confirm
                      </button>
                    </div>
                  </div>
                )}
                <div className="px-3 sm:px-5 py-2 sm:py-3 grid grid-cols-2 sm:grid-cols-3 gap-x-3 sm:gap-x-6 gap-y-0.5 sm:gap-y-1">
                  {vehicleInfo.yearOfManufacture && (<div className="flex items-center gap-2.5 py-2"><div className="w-8 h-8 rounded-lg bg-red-600/10 flex items-center justify-center shrink-0"><Calendar size={15} className="text-red-500" /></div><div><p className="text-[11px] text-zinc-600 uppercase tracking-wider leading-none mb-0.5">Year</p><p className="text-sm font-semibold text-white">{vehicleInfo.yearOfManufacture}</p></div></div>)}
                  {vehicleInfo.colour && (<div className="flex items-center gap-2.5 py-2"><div className="w-8 h-8 rounded-lg bg-red-600/10 flex items-center justify-center shrink-0"><Palette size={15} className="text-red-500" /></div><div><p className="text-[11px] text-zinc-600 uppercase tracking-wider leading-none mb-0.5">Colour</p><p className="text-sm font-semibold text-white">{vehicleInfo.colour}</p></div></div>)}
                  {vehicleInfo.fuelType && (<div className="flex items-center gap-2.5 py-2"><div className="w-8 h-8 rounded-lg bg-red-600/10 flex items-center justify-center shrink-0"><Fuel size={15} className="text-red-500" /></div><div><p className="text-[11px] text-zinc-600 uppercase tracking-wider leading-none mb-0.5">Fuel</p><p className="text-sm font-semibold text-white">{vehicleInfo.fuelType}</p></div></div>)}
                  {vehicleInfo.engineCapacity && (<div className="flex items-center gap-2.5 py-2"><div className="w-8 h-8 rounded-lg bg-red-600/10 flex items-center justify-center shrink-0"><Gauge size={15} className="text-red-500" /></div><div><p className="text-[11px] text-zinc-600 uppercase tracking-wider leading-none mb-0.5">Engine</p><p className="text-sm font-semibold text-white">{vehicleInfo.engineCapacity}cc</p></div></div>)}
                  {vehicleInfo.motStatus && (<div className="flex items-center gap-2.5 py-2"><div className="w-8 h-8 rounded-lg bg-red-600/10 flex items-center justify-center shrink-0"><ShieldCheck size={15} className="text-red-500" /></div><div><p className="text-[11px] text-zinc-600 uppercase tracking-wider leading-none mb-0.5">MOT</p><p className={`text-sm font-semibold ${vehicleInfo.motStatus === "Valid" ? "text-emerald-400" : "text-red-400"}`}>{vehicleInfo.motStatus}</p></div></div>)}
                  {vehicleInfo.taxStatus && (<div className="flex items-center gap-2.5 py-2"><div className="w-8 h-8 rounded-lg bg-red-600/10 flex items-center justify-center shrink-0"><Receipt size={15} className="text-red-500" /></div><div><p className="text-[11px] text-zinc-600 uppercase tracking-wider leading-none mb-0.5">Tax</p><p className={`text-sm font-semibold ${vehicleInfo.taxStatus === "Taxed" ? "text-emerald-400" : "text-red-400"}`}>{vehicleInfo.taxStatus}</p></div></div>)}
                </div>
              </div>
            )}

            {/* ── Results Header ── */}
            <div className="mb-4 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <p className="text-lg text-zinc-400 font-normal mb-1">{categoryFilter !== "All Parts" ? `${categoryFilter} for` : "Results for"}</p>
                <h1 className="text-3xl md:text-4xl font-bold text-white">
                  <span className="text-red-500">"</span>{activeQuery}<span className="text-red-500">"</span>
                </h1>
                {totalResults > 0 && !liveLoading && (
                  <p className="text-sm text-zinc-500 mt-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    {activeFilterCount > 0
                      ? `Showing ${filteredResults.length} of ${liveResults.length} loaded`
                      : `${startItem.toLocaleString()}-${endItem.toLocaleString()} of ${totalResults.toLocaleString()} listings`}
                  </p>
                )}
              </div>
            </div>

            {/* ── Sort & Filter Bar ── */}
            {liveResults.length > 0 && !liveLoading && (
              <FilterBar
                conditionFilter={conditionFilter}
                setConditionFilter={setConditionFilter}
                shippingFilter={shippingFilter}
                setShippingFilter={setShippingFilter}
                priceRangeIdx={priceRangeIdx}
                setPriceRangeIdx={setPriceRangeIdx}
                categoryFilter={categoryFilter}
                setCategoryFilter={setCategoryFilter}
                brandFilter={brandFilter}
                setBrandFilter={setBrandFilter}
                sortBy={sortBy}
                setSortBy={(v) => setSortBy(v as typeof SORT_OPTIONS[number]["value"])}
                activeFilterCount={activeFilterCount}
                clearAllFilters={clearAllFilters}
                shipsToLabel={locale.getCountryName(locale.locationCountry)}
                priceRanges={PRICE_RANGES}
                sortOptions={SORT_OPTIONS}
                partCategories={PART_CATEGORIES}
              />
            )}

            {/* ── Results Grid ── */}
            {liveLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5 mb-10">
                {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : (liveResults.length > 0 || scaleSerpResults.length > 0) && unifiedResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 mb-8">
                <div className="text-5xl mb-4 opacity-30">🔍</div>
                <p className="text-lg font-semibold text-white mb-1">No results match your filters</p>
                <p className="text-sm text-zinc-500 mb-4">Try adjusting your filters to see more results</p>
                <button onClick={clearAllFilters}
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-colors">
                  Clear all filters
                </button>
              </div>
            ) : unifiedResults.length > 0 ? (
              <div className="mb-10 animate-fade-in">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
                  {unifiedResults.map((item: any, idx: number) => {
                    const isGoogle = item._source === "google";

                    if (isGoogle) {
                      // ── Google Shopping Card ──
                      return (
                        <div key={`gs-${item._gsIdx}`}
                          className="group rounded-3xl overflow-hidden border border-white/[0.06] bg-[#111]/60 backdrop-blur-sm hover:border-white/[0.15] hover:bg-[#111]/80 hover:shadow-2xl hover:shadow-black/60 hover:-translate-y-0.5 transition-all duration-300 flex flex-col relative cursor-pointer animate-fade-in"
                          style={{ animationDelay: `${idx * 50}ms` }}>
                          
                          {(() => {
                            const sellerName = item.source || "Google Shopping";
                            const googleUrl = item._resolvedUrl;
                            const reviewText = item.reviews ? String(item.reviews) : null;

                            return (
                              <>
                                <div className="h-7 flex items-center justify-center text-xs font-semibold tracking-wide uppercase border-b border-white/10 bg-blue-900/40 text-blue-400">
                                  Google Shopping
                                </div>

                                <button type="button" onClick={() => openGoogleResult(item)} className="block relative cursor-pointer text-left">
                                  <div className="h-[140px] sm:h-[180px] lg:h-[200px] bg-[#0d0d0d] overflow-hidden relative">
                                    <SafeImage src={item.image} alt={item.title} className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-500" fallbackClassName="w-full h-full" />
                                    <span className="absolute bottom-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-blue-900/70 border border-blue-500/30 text-[9px] font-bold text-blue-300 uppercase tracking-wide max-w-[75%]">
                                      {item.source_icon ? (
                                        <img src={item.source_icon} alt="" className="w-3 h-3 rounded-sm object-contain shrink-0" loading="lazy" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                                      ) : (
                                        <span>🛒</span>
                                      )}
                                      <span className="truncate">{sellerName}</span>
                                    </span>
                                  </div>
                                </button>

                                <div className="p-4 flex-1 flex flex-col gap-3">
                                  <button type="button" onClick={() => openGoogleResult(item)} className="block cursor-pointer text-left">
                                    <p className="text-sm font-medium text-white leading-snug line-clamp-2 min-h-[2.5rem] group-hover:text-red-400 transition-colors">{item.title}</p>
                                  </button>

                                  {item.price && (
                                    <div>
                                      <span className="text-2xl font-bold text-red-500">{item.price}</span>
                                    </div>
                                  )}

                                  {item.delivery && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 w-fit">
                                      <Truck size={11} /> {item.delivery}
                                    </span>
                                  )}

                                  {/* Extensions info */}
                                  {item.extensions && item.extensions.length > 0 && (
                                    <p className="text-[11px] text-zinc-500 leading-snug line-clamp-2">
                                      {item.extensions.filter((e: string) => !/review/i.test(e)).join(" · ")}
                                    </p>
                                  )}

                                  <div className="flex items-center gap-1.5 text-xs text-zinc-500 border-t border-white/[0.06] pt-3 mt-auto">
                                    {item.source_icon && (
                                      <img src={item.source_icon} alt="" className="w-4 h-4 rounded-sm object-contain" loading="lazy" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                                    )}
                                    <span className="font-medium truncate max-w-[100px] text-zinc-400">{sellerName}</span>
                                    {item.rating && (
                                      <span className="flex items-center gap-0.5 text-amber-400 ml-auto">
                                        <Star size={11} className="fill-amber-400" /> {item.rating}
                                        {reviewText && <span className="text-zinc-600 ml-0.5">({reviewText})</span>}
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex flex-col sm:flex-row gap-2">
                                    <button type="button" onClick={() => openGoogleResult(item)} disabled={!googleUrl}
                                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed">
                                      <ExternalLink size={14} /> View Deal
                                    </button>
                                  </div>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      );
                    }

                    // ── eBay Card ──
                    const priceBadge = getPriceBadge(item.price);
                    const conditionNorm = (item.condition || "").trim().toLowerCase();
                    const conditionBarStyle = conditionNorm === "new"
                      ? { background: "#14532d", color: "#4ade80" }
                      : conditionNorm === "used" || conditionNorm.includes("pre-owned")
                      ? { background: "#78350f", color: "#fbbf24" }
                      : conditionNorm.includes("refurb")
                      ? { background: "#1e3a5f", color: "#60a5fa" }
                      : { background: "#27272a", color: "#a1a1aa" };
                    const priceBadgeStyles = {
                      great: { text: "text-emerald-400", icon: "✦" },
                      good: { text: "text-blue-400", icon: "✦" },
                      high: { text: "text-red-400", icon: "↑" },
                      top: { text: "text-amber-400", icon: "★" },
                    };
                    return (
                      <div key={item.id}
                        className="group rounded-3xl overflow-hidden border border-white/[0.06] bg-[#111]/60 backdrop-blur-sm hover:border-white/[0.15] hover:bg-[#111]/80 hover:shadow-2xl hover:shadow-black/60 hover:-translate-y-0.5 transition-all duration-300 flex flex-col relative cursor-pointer animate-fade-in"
                        style={{ animationDelay: `${idx * 50}ms` }}>
                        <div className="h-7 flex items-center justify-center text-xs font-semibold tracking-wide uppercase border-b border-white/10" style={conditionBarStyle}>
                          {item.condition || "Unknown"}
                        </div>
                        <a href={item.url} target="_blank" rel="noopener noreferrer" className="block relative">
                          <div className="h-[140px] sm:h-[180px] lg:h-[200px] bg-[#0d0d0d] overflow-hidden relative">
                            <img src={item.imageUrl} alt={item.partName} className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-500" loading="lazy" onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }} />
                            <span className="absolute bottom-2 right-2 text-xl" title={isGlobal ? (item.itemCountry || "Global") : country.name}>
                              {isGlobal ? (
                                <span className="flex items-center gap-1">
                                  <span>🌍</span>
                                  {item.itemCountry && <CountryFlag countryCode={item.itemCountry} emoji={getFlag(item.itemCountry)} size={14} />}
                                </span>
                              ) : (
                                <CountryFlag countryCode={country.code} emoji={country.flag} size={18} />
                              )}
                            </span>
                          </div>
                        </a>
                        <div className="p-4 flex-1 flex flex-col gap-3">
                          <a href={item.url} target="_blank" rel="noopener noreferrer" className="block">
                            <p className="text-sm font-medium text-white leading-snug line-clamp-2 min-h-[2.5rem] group-hover:text-red-400 transition-colors">{item.partName}</p>
                          </a>
                          <div>
                            <span className="text-2xl font-bold text-red-500">{locale.formatPrice(item.price)}</span>
                            {(() => {
                              const conv = locale.convertPrice(item.price);
                              return conv ? <p className="text-xs text-zinc-500 mt-0.5">≈ {conv.symbol}{conv.converted.toFixed(2)}</p> : null;
                            })()}
                          </div>
                          {priceBadge && (
                            <div className={`w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-semibold mt-1 ${
                              priceBadge.variant === "great" ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25" :
                              priceBadge.variant === "good" ? "bg-blue-500/15 text-blue-400 border border-blue-500/25" :
                              priceBadge.variant === "high" ? "bg-red-500/15 text-red-400 border border-red-500/25" :
                              "bg-amber-500/15 text-amber-400 border border-amber-500/25"
                            }`}>
                              <span>{priceBadgeStyles[priceBadge.variant as keyof typeof priceBadgeStyles]?.icon || "✦"}</span>
                              {priceBadge.label}
                            </div>
                          )}
                          {!priceBadge && item.topRatedSeller && (
                            <div className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-semibold mt-1 bg-amber-500/15 text-amber-400 border border-amber-500/25">
                              <span>★</span> {locale.t("top_rated")}
                            </div>
                          )}
                          <div className="flex flex-col gap-1.5">
                            {item.freeShipping ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 w-fit">
                                <Zap size={11} /> {locale.t("free_shipping")}
                              </span>
                            ) : item.shippingCost > 0 ? (
                              <span className="inline-flex items-center gap-1 text-xs text-zinc-500">
                                <Truck size={12} /> +{locale.formatPrice(item.shippingCost)} P&P
                              </span>
                            ) : null}
                            {item.itemCountry !== locale.locationCountry && (
                              item.shipsToUK ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 w-fit">
                                  📦 {locale.t("ships_to")} {locale.getCountryName(locale.locationCountry)}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/15 text-red-400 border border-red-500/20 w-fit">
                                  🚫 {locale.t("no_ship")} {locale.getCountryName(locale.locationCountry)}
                                </span>
                              )
                            )}
                            {item.handlingTime && (
                              <span className="inline-flex items-center gap-1 text-xs text-zinc-600">
                                <Clock size={11} /> {item.handlingTime}{locale.t("handling_days")}
                              </span>
                            )}
                          </div>
                          {item.quantityAvailable != null && item.quantityAvailable > 0 && item.quantityAvailable <= 5 && (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-400">
                              <AlertCircle size={11} /> {locale.t("left_only", { n: item.quantityAvailable })}
                            </span>
                          )}
                          {item.quantityAvailable != null && item.quantityAvailable > 5 && (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400">✓ {locale.t("in_stock")}</span>
                          )}
                          <div className="flex items-center gap-1.5 text-xs text-zinc-500 border-t border-white/[0.06] pt-3 mt-auto">
                            <span className="flex items-center gap-0.5 text-amber-400">
                              <Star size={11} className="fill-amber-400" /> {item.sellerPositivePercent?.toFixed(0)}%
                            </span>
                            <span className="font-medium truncate max-w-[100px] text-zinc-400">{item.sellerUsername}</span>
                            <span className="text-zinc-600">({item.sellerFeedbackScore})</span>
                            {item.watchCount > 0 && (
                              <span className="flex items-center gap-0.5 text-zinc-600 ml-auto"><Heart size={10} /> {item.watchCount}</span>
                            )}
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <a href={item.url} target="_blank" rel="noopener noreferrer"
                              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-colors duration-150">
                              <ExternalLink size={14} /> View on eBay
                            </a>
                            <button onClick={() => {
                              const isSelected = compareParts.some((p) => p.id === item.id);
                              if (isSelected) setCompareParts((prev) => prev.filter((p) => p.id !== item.id));
                              else if (compareParts.length < 3) setCompareParts((prev) => [...prev, { id: item.id, title: item.partName, price: item.price, condition: item.condition, sellerName: item.sellerUsername, sellerRating: item.sellerPositivePercent, freeShipping: item.freeShipping, shippingCost: item.shippingCost, location: item.itemLocation, itemCountry: item.itemCountry, url: item.url, imageUrl: item.imageUrl, source: "ebay" as const }]);
                            }}
                              className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all duration-150 ${compareParts.some((p) => p.id === item.id) ? "border-red-500 bg-red-500/20 text-red-400" : "border-white/[0.06] bg-[#1a1a1a] hover:bg-[#222] text-zinc-400 hover:text-white"}`}
                              title={compareParts.some((p) => p.id === item.id) ? "Remove" : "Compare"}
                              disabled={!compareParts.some((p) => p.id === item.id) && compareParts.length >= 3}>
                              <Scale size={14} />
                            </button>
                            <button onClick={() => handleSave(item)} disabled={savingId === item.id}
                              className="w-9 h-9 rounded-xl border border-white/[0.06] bg-[#1a1a1a] hover:bg-[#222] flex items-center justify-center transition-all duration-150 text-zinc-400 hover:text-white">
                              {savingId === item.id ? <Loader2 size={14} className="animate-spin" /> : savedIds.has(item.partNumber) ? <BookmarkCheck size={14} className="text-red-500" /> : <Bookmark size={14} />}
                            </button>
                            <PriceAlertDialog supplierName="eBay Motors" partQuery={item.partName} supplierUrl={item.url} ebayItemId={item.id} currentPrice={item.price} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* More sources coming soon banner */}
                <div className="my-6 p-4 rounded-2xl bg-zinc-900/50 border border-white/[0.06] text-center">
                  <p className="text-sm text-zinc-400">
                    We're adding <span className="text-zinc-200 font-medium">Euro Car Parts</span>, <span className="text-zinc-200 font-medium">GSF Car Parts</span>, <span className="text-zinc-200 font-medium">Autodoc</span> and more suppliers soon. Currently showing eBay results.
                  </p>
                </div>

                {/* Amazon UK Card */}
                {activeQuery && brandFilter === "All" && (
                  <div className="my-8">
                    <a href={`https://www.amazon.co.uk/s?k=${encodeURIComponent(activeQuery)}&tag=gopartara-21`} target="_blank" rel="noopener noreferrer"
                      className="group block rounded-2xl overflow-hidden border border-orange-500/20 hover:border-orange-500/40 transition-all bg-[#111]">
                      <div className="flex items-center gap-4 sm:gap-6 p-4 sm:p-6">
                        <div className="shrink-0 w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                          <span className="text-white font-bold text-lg sm:text-xl tracking-tight leading-none text-center"><span className="italic">amazon</span><span className="block text-[10px] sm:text-xs font-semibold not-italic opacity-80">.co.uk</span></span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-medium text-orange-400 mb-0.5">Also available on</p>
                          <h3 className="text-base sm:text-lg font-bold text-white mb-1 truncate">Search "{activeQuery}" on Amazon UK</h3>
                          <p className="text-xs sm:text-sm text-zinc-500 line-clamp-1">Compare prices with Amazon's car parts selection • Free Prime delivery available</p>
                        </div>
                        <div className="shrink-0 hidden sm:block">
                          <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 text-white font-semibold text-sm shadow-lg shadow-orange-500/25 group-hover:shadow-orange-500/40 transition-shadow"><ExternalLink size={14} /> Search Amazon</span>
                        </div>
                        <div className="shrink-0 sm:hidden">
                          <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-amber-600 text-white font-semibold text-xs"><ExternalLink size={12} /> Search</span>
                        </div>
                      </div>
                    </a>
                  </div>
                )}


                {/* Global Suppliers */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3"><span className="text-lg">🌍</span><h3 className="text-base sm:text-lg font-bold text-white">Global Suppliers</h3><span className="text-xs text-zinc-600">International shipping available</span></div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                    {globalSuppliers.map((gs) => (
                      <a key={gs.name} href={gs.buildUrl(activeQuery)} target="_blank" rel="noopener noreferrer"
                        className="group rounded-2xl overflow-hidden border border-white/[0.06] bg-[#111] hover:border-white/[0.15] transition-all hover:scale-[1.02] flex flex-col">
                        <div className={`h-14 sm:h-16 bg-gradient-to-br ${gs.gradient} flex items-center justify-center px-2 relative`}>
                          <span className="text-white font-bold text-xs sm:text-sm tracking-wide text-center leading-tight">{gs.flag} {gs.name}</span>
                          <span className="absolute top-1 right-1 px-1.5 py-0.5 rounded text-[8px] font-bold bg-white/20 text-white backdrop-blur-sm">{gs.region}</span>
                        </div>
                        <div className="p-2">
                          <span className="flex items-center justify-center gap-1 w-full rounded-xl text-xs h-8 bg-red-600 text-white font-medium group-hover:bg-red-500 transition-colors"><ExternalLink size={11} /> Search</span>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex flex-col items-center gap-3 mt-8">
                    <p className="text-xs text-zinc-600">Pages {chunkStart}-{chunkEnd} of {totalPages.toLocaleString()}</p>
                    <div className="flex items-center gap-1 flex-wrap justify-center">
                      {currentChunk > 0 && <button onClick={() => handlePageChange((currentChunk - 1) * PAGES_PER_CHUNK + 1)} className="flex items-center gap-0.5 px-3 py-2 rounded-xl text-xs font-medium bg-[#1a1a1a] hover:bg-[#222] text-zinc-300 transition-colors border border-white/[0.06]"><ChevronLeft size={12} /> Prev 50</button>}
                      <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="flex items-center gap-0.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-[#1a1a1a] hover:bg-[#222] text-zinc-300 border border-white/[0.06]"><ChevronLeft size={14} /> Prev</button>
                      {getPageNumbers().map((page, i) => page === "..." ? (
                        <span key={`e-${i}`} className="px-2 py-2 text-sm text-zinc-600">...</span>
                      ) : (
                        <button key={page} onClick={() => handlePageChange(page as number)}
                          className={`min-w-[36px] h-9 rounded-xl text-sm font-medium transition-colors border ${currentPage === page ? "bg-red-600 text-white border-red-600 shadow-lg shadow-red-600/25" : "bg-[#1a1a1a] hover:bg-[#222] text-zinc-300 border-white/[0.06]"}`}>{page}</button>
                      ))}
                      <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="flex items-center gap-0.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-[#1a1a1a] hover:bg-[#222] text-zinc-300 border border-white/[0.06]">Next <ChevronRight size={14} /></button>
                      {chunkEnd < totalPages && <button onClick={() => handlePageChange((currentChunk + 1) * PAGES_PER_CHUNK + 1)} className="flex items-center gap-0.5 px-3 py-2 rounded-xl text-xs font-medium bg-[#1a1a1a] hover:bg-[#222] text-zinc-300 transition-colors border border-white/[0.06]">Next 50 <ChevronRight size={12} /></button>}
                    </div>
                  </div>
                )}
              </div>
            ) : !liveLoading ? (
              /* ── Empty / Error State ── */
              <div className="flex flex-col items-center justify-center py-20 mb-8">
                <div className="text-6xl mb-4 opacity-30">🔍</div>
                <p className="text-lg font-semibold text-white mb-1">
                  {ebayFallback ? "eBay search temporarily unavailable" : `No results found for "${activeQuery}"`}
                </p>
                <p className="text-sm text-zinc-500 mb-6 text-center max-w-md">
                  {ebayFallback ? "The service is experiencing high demand. Search suppliers directly below." : "Try a different search term or change your marketplace"}
                </p>
                <button onClick={() => { setQuery(""); setActiveQuery(""); setSearchParams({}); }}
                  className="px-5 py-2.5 rounded-xl bg-[#1a1a1a] border border-white/10 text-sm font-medium text-zinc-300 hover:bg-[#222] hover:border-white/20 transition-all">
                  Clear search
                </button>
                {ebayFallback && (
                  <div className="mt-8 w-full max-w-lg">
                    <p className="text-xs text-zinc-500 mb-3 text-center font-medium">Quick search on supplier sites:</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {suppliers.slice(0, 6).map((s) => (
                        <a key={s.name} href={s.buildUrl(activeQuery)} target="_blank" rel="noopener noreferrer"
                          className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-gradient-to-br ${s.gradient} text-white text-xs font-semibold transition-transform hover:scale-105 shadow-md`}>
                          <ExternalLink size={12} /> {s.name}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}

            {/* Supplier Row */}
            <div className="mb-4 mt-2">
              <div className="flex items-center gap-2 mb-4">
                <ExternalLink size={18} className="text-zinc-500" />
                <h2 className="text-lg font-bold text-white">Search More Suppliers</h2>
              </div>
            </div>
            <ScrollArea className="w-full pb-4">
              <div className="flex gap-3 pb-2">
                {suppliers.map((supplier) => (
                  <a key={supplier.name} href={supplier.buildUrl(activeQuery)} target="_blank" rel="noopener noreferrer"
                    className="shrink-0 w-[120px] sm:w-[140px] group rounded-2xl overflow-hidden border border-white/[0.06] bg-[#111] hover:border-white/[0.15] transition-all hover:scale-[1.02] flex flex-col">
                    <div className={`h-14 sm:h-16 bg-gradient-to-br ${supplier.gradient} flex items-center justify-center px-2`}>
                      <span className="text-white font-bold text-[10px] sm:text-xs tracking-wide text-center leading-tight">{supplier.flag} {supplier.name}</span>
                    </div>
                    <div className="p-2">
                      <span className="flex items-center justify-center gap-1 w-full rounded-xl text-xs h-8 bg-red-600 text-white font-medium group-hover:bg-red-500 transition-colors"><ExternalLink size={11} /> Search</span>
                    </div>
                  </a>
                ))}
                {matchedOemBrands.map((b) => {
                  const oemQuery = getOemSearchQuery(activeQuery, b.pattern);
                  return (
                    <a key={b.brand} href={b.url(oemQuery)} target="_blank" rel="noopener noreferrer"
                      className="shrink-0 w-[140px] group rounded-2xl overflow-hidden border border-white/[0.06] bg-[#111] hover:border-white/[0.15] transition-all hover:scale-[1.02] flex flex-col">
                      <div className={`h-16 bg-gradient-to-br ${b.gradient} flex items-center justify-center px-2`}>
                        <span className="text-white font-bold text-xs tracking-wide text-center leading-tight">{b.brand} OEM</span>
                      </div>
                      <div className="p-2">
                        <span className="flex items-center justify-center gap-1 w-full rounded-xl text-xs h-8 bg-red-600 text-white font-medium group-hover:bg-red-500 transition-colors"><ExternalLink size={11} /> Search</span>
                      </div>
                    </a>
                  );
                })}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </>
        ) : (
          /* ── No query state ── */
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Search size={48} className="text-zinc-800 mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Search for car parts</h2>
            <p className="text-sm text-zinc-500 max-w-md">Enter a part name, number, or vehicle model above to compare prices across multiple suppliers.</p>
          </div>
        )}
      </div>

      <CompareBar items={compareParts} onOpen={() => setShowCompare(true)} onClear={() => setCompareParts([])} />
      {showCompare && <CompareModal items={compareParts} onRemove={(id) => setCompareParts((prev) => prev.filter((p) => p.id !== id))} onClose={() => setShowCompare(false)} />}
      <AuthGateModal open={authGateOpen} onOpenChange={setAuthGateOpen} title="Please sign in to search for car parts" description="Create a free account to search across 1,000,000+ parts from trusted UK & global suppliers." />
      <Footer />
    </div>
  );
};

export default SearchResults;
