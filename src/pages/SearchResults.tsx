import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { X } from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { sanitizeInput, checkRateLimit, getCachedSearch, setCachedSearch } from "@/lib/sanitize";
import { buildEbayAffiliateUrl } from "@/lib/ebayAffiliate";
import { getCountryFromVIN, type VinCountryInfo } from "@/lib/vinCountry";
import VinCountryModal from "@/components/VinCountryModal";

import { useUserPlan } from "@/hooks/useUserPlan";
import UpgradeModal from "@/components/UpgradeModal";

import SafeImage from "@/components/SafeImage";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import {
  Search, ExternalLink, Loader2, Camera, Car, Scale, Star,
  Truck, Bookmark, BookmarkCheck, Clock,
  Heart, AlertCircle, Zap, Globe,
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
import { toast as sonnerToast } from "sonner";
import { useSearchLimit, isSameQuery, setLastSearch, getGuestSearchCount, incrementGuestSearch } from "@/hooks/useSearchLimit";
import AuthGateModal from "@/components/AuthGateModal";
import LocationNudge from "@/components/LocationNudge";
import { useCountry } from "@/hooks/useCountry";
import { useLocale } from "@/contexts/LocaleContext";
import CountryFlag from "@/components/CountryFlag";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import FilterBar from "@/components/FilterBar";
import TecDocPartsSection from "@/components/TecDocPartsSection";
import { findDealByBrand, EBAY_ALL_DEALS_URL, isUKUser } from "@/data/ebayDeals";
import GreenSparkFeaturedCard, { isClassicPartSearch } from "@/components/GreenSparkFeaturedCard";
import GreenSparkResultsRow from "@/components/GreenSparkResultsRow";
import GreenSparkProductCard, { useGspProducts } from "@/components/GreenSparkProductCard";
import RecentSearches, { addRecentSearch } from "@/components/RecentSearches";
import SearchAutocomplete from "@/components/SearchAutocomplete";


// ── Twemoji helper ──
const parseTwemoji = () => {
  if (typeof window !== "undefined" && (window as any).twemoji) {
    (window as any).twemoji.parse(document.body, { folder: "svg", ext: ".svg" });
  }
};

// ── Supplier configs ──
const SUPPLIERS = [
  { id: 'ebay', label: 'eBay Global', status: 'live' },
  { id: 'greensparkplug', label: 'Green Spark Plug Co.', status: 'live' },
  { id: 'mytyres', label: 'mytyres.co.uk', status: 'live' },
  { id: 'tyresuk', label: 'Tyres UK', status: 'live' },
  { id: 'neumaticos', label: 'neumaticos-online.es', status: 'live' },
  { id: 'pneumatici', label: 'Pneumatici IT', status: 'live' },
  { id: 'reifendirekt', label: 'ReifenDirekt EE', status: 'live' },
  { id: 'eurocarparts', label: 'Euro Car Parts', status: 'coming' },
  { id: 'gsf', label: 'GSF Car Parts', status: 'coming' },
  { id: 'autodoc', label: 'Autodoc', status: 'coming' },
];

const googleSite = (domain: string) => (q: string) =>
  `https://www.google.com/search?q=site:${domain}+${q.replace(/\s+/g, "+")}`;

// Removed fake supplier links — only eBay feed + Autodoc affiliate are real

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

const countryBadges: Record<string, string> = {
  GB: "UK", US: "US", DE: "DE", CN: "CN", IT: "IT", FR: "FR", ES: "ES", PL: "PL", NL: "NL", JP: "JP", AU: "AU",
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

const RESULT_ICON_BUTTON_CLASS = "min-w-[44px] min-h-[44px] md:w-8 md:h-8 md:min-w-0 md:min-h-0 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-white/[0.06] flex items-center justify-center text-zinc-400 hover:text-white transition-colors";

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
  const [searchMode, setSearchMode] = useState<"text" | "reg" | "vin">("text");
  const [vinNumber, setVinNumber] = useState("");
  const [vinLoading, setVinLoading] = useState(false);
  const [vinError, setVinError] = useState("");
  const [vinVehicle, setVinVehicle] = useState<Record<string, string | null> | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [autoOpen, setAutoOpen] = useState(false);
  const [compareParts, setCompareParts] = useState<CompareItem[]>([]);
  const [showCompare, setShowCompare] = useState(false);
  const [liveResults, setLiveResults] = useState<any[]>([]);
  const [liveLoading, setLiveLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
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
  const [searchLimitModalOpen, setSearchLimitModalOpen] = useState(false);
  const [searchLimitModalType, setSearchLimitModalType] = useState<"free" | "guest">("free");
  const [supplierBannerDismissed, setSupplierBannerDismissed] = useState(() => localStorage.getItem("supplier_banner_dismissed") === "1");
  const resultsRef = useRef<HTMLDivElement>(null);
  const supplierBannerRef = useRef<HTMLDivElement>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const userPlan = useUserPlan();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState("");
  const [upgradeLabel, setUpgradeLabel] = useState("");
  const [upgradeRequiredPlan, setUpgradeRequiredPlan] = useState("Pro");
  const [sameQueryConfirmOpen, setSameQueryConfirmOpen] = useState(false);
  const [pendingSearchQuery, setPendingSearchQuery] = useState("");
  const isFromGarage = searchParams.get("fromGarage") === "true";
  const [garageVehicleLabel, setGarageVehicleLabel] = useState<string | null>(null);
  const [vinCountryInfo, setVinCountryInfo] = useState<VinCountryInfo | null>(null);
  const [vinCountryModalOpen, setVinCountryModalOpen] = useState(false);



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

  // ── Initial-load grace period: avoid showing "No results" before the first response arrives ──
  useEffect(() => {
    setIsInitialLoad(true);
    const timer = setTimeout(() => setIsInitialLoad(false), 3000);
    if (activeQuery && activeQuery.trim()) {
      addRecentSearch(activeQuery.trim());
    }
    return () => clearTimeout(timer);
  }, [activeQuery]);

  // ── URL sync ──
  useEffect(() => {
    if (urlQuery && urlQuery !== query) setQuery(urlQuery);
    if (urlQuery && urlQuery !== activeQuery) { setActiveQuery(urlQuery); setCurrentPage(1); }
    if (urlQuery) setSearchMode("text");
    if (urlQuery && !user) setAuthGateOpen(true);
    // Track garage vehicle label from URL
    if (isFromGarage && urlQuery) {
      setGarageVehicleLabel(urlQuery);
    }
  }, [urlQuery]);

  useEffect(() => {
    const v = searchParams.get("vehicle");
    const vinParam = searchParams.get("vin");
    const isVin = !!vinParam;
    if (v) {
      try {
        const parsed = JSON.parse(decodeURIComponent(v));
        setVehicleInfo(parsed);
        if (isVin || parsed.model) {
          setVehicleModelConfirmed(true);
        }
        if (isVin && vinParam) {
          const vinCountry = getCountryFromVIN(vinParam);
          setVinCountryInfo(vinCountry);
          if (vinCountry.fallback) {
            setVinCountryModalOpen(true);
          }
        } else {
          setVinCountryInfo(null);
        }
      } catch { }
    } else {
      setVehicleInfo(null);
      setVinCountryInfo(null);
    }
  }, [searchParams]);

  // ── eBay search ──
  useEffect(() => {
    if (!activeQuery.trim()) { setLiveResults([]); setTotalResults(0); setEbayFallback(false); return; }
    if (!user) { setAuthGateOpen(true); setLiveResults([]); setTotalResults(0); return; }
    let cancelled = false;

    // Build a cache key from all filter state
    const cacheKey = JSON.stringify({ activeQuery, selectedCategory, currentPage, marketplace: country.ebayMarketplace, conditionFilter, shippingFilter, priceRangeIdx, sortBy, categoryFilter, brandFilter });
    const cached = getCachedSearch(cacheKey);

    // Debounce 300ms
    const debounceTimer = setTimeout(() => {
      const fetchLive = async () => {
        const searchQuery = sanitizeInput(activeQuery);

        if (!cached) {
          setLiveLoading(true);
          setEbayFallback(false);
        } else {
          setLiveResults(cached.results || []);
          setTotalResults(cached.totalResults || 0);
          setEbayFallback(!!cached.fallback);
        }

        try {
          if (!cached) {
            const offset = (currentPage - 1) * ITEMS_PER_PAGE;
            const priceRange = PRICE_RANGES[priceRangeIdx];
            const body: Record<string, any> = {
              query: searchQuery,
              category: selectedCategory || undefined,
              offset,
              marketplace: vinCountryInfo?.ebayMarketplace || country.ebayMarketplace,
            };
            if (conditionFilter !== "All") body.conditionFilter = conditionFilter;
            if (shippingFilter !== "All") body.shippingFilter = shippingFilter;
            if (priceRangeIdx > 0) {
              body.priceMin = priceRange.min;
              if (priceRange.max !== Infinity) body.priceMax = priceRange.max;
            }
            if (sortBy !== "best_match") body.sortBy = sortBy;
            if (categoryFilter !== "All Parts") body.categoryFilter = categoryFilter;
            // If coming from garage, skip search credit deduction
            if (isFromGarage) body.skipCredit = true;

            const { data, error } = await supabase.functions.invoke("search-parts", { body });
            if (error) {
              const msg = (error as any)?.message || "";
              if (msg.includes("UNAUTHORIZED") || msg.includes("401")) { if (!cancelled) setAuthGateOpen(true); return; }
              if (msg.includes("SEARCH_LIMIT_REACHED") || msg.includes("403")) {
                if (!cancelled) { setSearchLimitModalType("free"); setSearchLimitModalOpen(true); searchLimit.refresh(); }
                return;
              }
              throw error;
            }
            if (!cancelled) {
              if (data?.error === "UNAUTHORIZED") { setAuthGateOpen(true); return; }
              if (data?.error === "SEARCH_LIMIT_REACHED") { setSearchLimitModalType("free"); setSearchLimitModalOpen(true); searchLimit.refresh(); return; }
              if (data?.fallback) { setEbayFallback(true); setLiveResults([]); setTotalResults(0); }
              else {
                const incoming = data?.results || [];
                // APPEND when paginating beyond page 1; REPLACE on first page (filter/query change)
                if (currentPage > 1) {
                  setLiveResults((prev) => {
                    const seen = new Set(prev.map((r: any) => r.id));
                    const merged = [...prev];
                    for (const r of incoming) if (!seen.has(r.id)) merged.push(r);
                    return merged;
                  });
                } else {
                  setLiveResults(incoming);
                }
                setTotalResults(data?.totalResults || 0); searchLimit.refresh();
                setCachedSearch(cacheKey, { results: incoming, totalResults: data?.totalResults, fallback: false });
              }
            }
          }

        } catch (err) {
          console.error("Live search failed:", err);
          if (!cancelled) {
            setLiveResults([]);
            setTotalResults(0);
            setEbayFallback(true);
          }
        } finally { if (!cancelled) setLiveLoading(false); }
      };
      fetchLive();
    }, cached ? 0 : 300);

    return () => { cancelled = true; clearTimeout(debounceTimer); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeQuery, selectedCategory, currentPage, user, country.ebayMarketplace, conditionFilter, shippingFilter, priceRangeIdx, sortBy, categoryFilter, brandFilter, vinCountryInfo]);


  // ── Saved parts ──
  useEffect(() => {
    if (!user) return;
    supabase.from("saved_parts").select("part_number").eq("user_id", user.id).then(({ data }) => {
      if (data) setSavedIds(new Set(data.map((d) => d.part_number).filter(Boolean) as string[]));
    });
  }, [user]);

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
    // Reg plate lookup counts as a search credit
    if (user && !searchLimit.isPro) {
      searchLimit.recordSearch();
      setLastSearch(nextQuery);
    }
  };

  /** Actually execute a search (after any confirmations) */
  const executeSearch = (sanitized: string) => {
    if (!checkRateLimit(`search_${user!.id}`, 10, 60_000)) { toast({ title: "Slow down", description: "You're searching too fast. Please wait a moment.", variant: "destructive" }); return; }
    internalSearchRef.current = true;
    setActiveQuery(sanitized); setSelectedCategory(null); setCurrentPage(1); setSearchParams({ q: sanitized });
    setGarageVehicleLabel(null);
    if (!searchLimit.isPro) {
      searchLimit.recordSearch();
      setLastSearch(sanitized);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const sanitized = sanitizeInput(query.trim());
    if (!sanitized) return;

    // Guest search limit (3 searches via localStorage)
    if (!user) {
      const guestCount = getGuestSearchCount();
      if (guestCount >= 3) {
        setSearchLimitModalType("guest");
        setSearchLimitModalOpen(true);
        return;
      }
      incrementGuestSearch();
      setAuthGateOpen(true);
      return;
    }

    // Free user search limit
    if (searchLimit.limitReached) {
      setSearchLimitModalType("free");
      setSearchLimitModalOpen(true);
      return;
    }

    // Same query warning (only for free users who have limited searches)
    if (!searchLimit.isPro && isSameQuery(sanitized)) {
      setPendingSearchQuery(sanitized);
      setSameQueryConfirmOpen(true);
      return;
    }

    executeSearch(sanitized);
  };

  

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!user) { setAuthGateOpen(true); if (photoInputRef.current) photoInputRef.current.value = ""; return; }
    if (!searchLimit.isPro) { setUpgradeFeature("photoSearch"); setUpgradeLabel("Photo Search"); setUpgradeRequiredPlan("Pro"); setUpgradeOpen(true); if (photoInputRef.current) photoInputRef.current.value = ""; return; }
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
        // Check saved parts limit for free users
        if (userPlan.isFree) {
          const { count } = await supabase.from("saved_parts").select("*", { count: "exact", head: true }).eq("user_id", user.id);
          if ((count || 0) >= userPlan.features.savedParts) {
            setUpgradeFeature("savedParts");
            setUpgradeLabel("Saving more parts");
            setUpgradeRequiredPlan("Pro");
            setUpgradeOpen(true);
            setSavingId(null);
            return;
          }
        }
        await supabase.from("saved_parts").insert({ user_id: user.id, part_name: item.partName, part_number: item.partNumber, price: item.price, supplier: "eBay Motors", url: item.url, image_url: item.imageUrl });
        setSavedIds((prev) => new Set(prev).add(item.partNumber));
        // Premium saved-part toast — sonner, bottom-left
        sonnerToast.custom(
          (id) => (
            <div
              className="flex items-center gap-3 px-4 py-3 rounded-lg shadow-2xl"
              style={{
                background: "#111111",
                border: "1px solid #1f1f1f",
                borderLeft: "3px solid #4ade80",
                minWidth: "280px",
              }}
            >
              <div
                className="flex items-center justify-center rounded-full shrink-0"
                style={{ width: 24, height: 24, background: "rgba(74,222,128,0.15)" }}
              >
                <Check size={14} style={{ color: "#4ade80" }} strokeWidth={3} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">Part saved to your list</p>
              </div>
              <button
                onClick={() => { sonnerToast.dismiss(id); navigate("/saved-parts"); }}
                className="text-xs font-semibold whitespace-nowrap hover:underline"
                style={{ color: "#cc1111" }}
              >
                View saved parts
              </button>
            </div>
          ),
          { duration: 3000, position: "bottom-left" }
        );
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
    if (price >= high) return null;
    return { label: locale.t("good_price"), variant: "good" as const };
  };

  const getFlag = (code: string) => countryBadges[code] || "🌍";

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

  // ── Unified results (eBay only) — grows with currentPage so "Load more" appends ──
  const visibleCount = currentPage * ITEMS_PER_PAGE;
  const unifiedResults = useMemo(() => {
    return filteredResults
      .slice(0, visibleCount)
      .map((result: any) => ({ ...result, _source: "ebay" as const }));
  }, [filteredResults, visibleCount]);

  // ── Green Spark Plug Co. real product feed (AWIN) ──
  const gspIsClassic = isClassicPartSearch(activeQuery);
  const { products: gspProducts } = useGspProducts(activeQuery, gspIsClassic && brandFilter !== "Amazon");

  // Interleave GSP products into the eBay grid at positions 3 and 7 (after items 2 and 6)
  const interleavedResults = useMemo(() => {
    if (!gspProducts.length || brandFilter === "Amazon") return unifiedResults;
    const gspToInsert = gspProducts.slice(0, 4).map((p) => ({ ...p, __gsp: true }));
    const out: any[] = [];
    let gIdx = 0;
    unifiedResults.forEach((it: any, i: number) => {
      out.push(it);
      if ((i === 1 || i === 5) && gIdx < gspToInsert.length) {
        for (let s = 0; s < 2 && gIdx < gspToInsert.length; s++) {
          out.push(gspToInsert[gIdx++]);
        }
      }
    });
    while (gIdx < gspToInsert.length) out.push(gspToInsert[gIdx++]);
    return out;
  }, [unifiedResults, gspProducts, brandFilter]);

  const clearAllFilters = () => {
    setConditionFilter("All");
    setShippingFilter("All");
    setPriceRangeIdx(0);
    setBrandFilter("All");
    setCategoryFilter("All Parts");
    setSortBy("best_match");
  };

  // Live supplier count for header context row (only the green/live ones)
  const liveSupplierCount = SUPPLIERS.filter((s) => s.status === "live").length;

  // Map supplier id → brandFilter value (must match labels used in FilterBar brand options)
  const SUPPLIER_BRAND_MAP: Record<string, string> = {
    ebay: "eBay",
    greensparkplug: "Green Spark Plug Co.",
  };
  const activeSupplierId = (() => {
    if (brandFilter === "All") return null;
    const found = Object.entries(SUPPLIER_BRAND_MAP).find(([, v]) => v === brandFilter);
    return found ? found[0] : null;
  })();
  const handleSupplierClick = (supplier: typeof SUPPLIERS[number]) => {
    if (supplier.status !== "live") return;
    const brand = SUPPLIER_BRAND_MAP[supplier.id];
    if (!brand) {
      // Supplier not directly filterable yet — just scroll back to results
      setBrandFilter("All");
      return;
    }
    if (brandFilter === brand) setBrandFilter("All");
    else setBrandFilter(brand);
  };

  const scrollToSuppliers = () => {
    if (supplierBannerDismissed) {
      setSupplierBannerDismissed(false);
      localStorage.removeItem("supplier_banner_dismissed");
    }
    setTimeout(() => {
      supplierBannerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
  };

  // Active filter pill descriptors
  const activeFilterPills: { key: string; label: string; clear: () => void }[] = [];
  if (conditionFilter !== "All") activeFilterPills.push({ key: "condition", label: conditionFilter, clear: () => setConditionFilter("All") });
  if (shippingFilter !== "All") activeFilterPills.push({ key: "shipping", label: shippingFilter, clear: () => setShippingFilter("All") });
  if (priceRangeIdx !== 0) activeFilterPills.push({ key: "price", label: PRICE_RANGES[priceRangeIdx].label, clear: () => setPriceRangeIdx(0) });
  if (brandFilter !== "All") activeFilterPills.push({ key: "brand", label: brandFilter, clear: () => setBrandFilter("All") });
  if (categoryFilter !== "All Parts") activeFilterPills.push({ key: "category", label: categoryFilter, clear: () => setCategoryFilter("All Parts") });

  // Detect reg-plate / garage searches → enables "Fits [reg]" badge
  const fitRegLabel = (() => {
    if (vehicleInfo?.registrationNumber) return vehicleInfo.registrationNumber;
    if (isFromGarage && garageVehicleLabel) return garageVehicleLabel;
    return null;
  })();

  // Premium "Load more" handler — advances page; data fetch appends new results
  const handleLoadMore = async () => {
    if (currentPage >= totalPages || loadingMore) return;
    setLoadingMore(true);
    setCurrentPage(currentPage + 1);
    // Do NOT scroll — appended results render below; user stays in place
  };
  // Reset loadingMore once new results arrive
  useEffect(() => {
    if (!liveLoading) setLoadingMore(false);
  }, [liveLoading, liveResults]);

  // ── Scroll position memory: save before user clicks an outbound link, restore on back nav ──
  const saveScrollPosition = useCallback(() => {
    try {
      sessionStorage.setItem(
        "searchScrollPosition",
        JSON.stringify({ q: activeQuery, y: window.scrollY, page: currentPage, ts: Date.now() }),
      );
    } catch {}
  }, [activeQuery, currentPage]);

  // Restore on mount / when results for the saved query are rendered
  useEffect(() => {
    if (!activeQuery || liveResults.length === 0) return;
    try {
      const raw = sessionStorage.getItem("searchScrollPosition");
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (!saved || saved.q !== activeQuery) return;
      // Only restore within 30 minutes
      if (Date.now() - (saved.ts || 0) > 30 * 60 * 1000) {
        sessionStorage.removeItem("searchScrollPosition");
        return;
      }
      // If the saved view required more pages than currently loaded, bump page first
      if (saved.page && saved.page > currentPage) {
        setCurrentPage(saved.page);
        return; // wait for next render with more results
      }
      requestAnimationFrame(() => {
        window.scrollTo({ top: saved.y || 0, behavior: "auto" });
        sessionStorage.removeItem("searchScrollPosition");
      });
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeQuery, liveResults.length]);


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
      <SEOHead
        title="Search Car Parts — GOPARTARA | Compare UK Prices"
        description="Search millions of car parts from eBay, Euro Car Parts, GSF and more. Compare prices side by side and find the best deal in seconds."
        path="/search"
      />
      <Navbar />

      {/* ── Subtle red glow at top ── */}
      <div className="pointer-events-none fixed inset-x-0 top-0 h-[500px] z-0" style={{ background: "radial-gradient(ellipse 80% 40% at 50% -10%, rgba(220,38,38,0.08) 0%, transparent 70%)" }} />

      {/* ── Search Bar (sticky) ── */}
      <div className="sticky top-0 z-20 pt-14 sm:pt-16 border-b border-white/[0.06]" style={{ background: "rgba(10,10,10,0.85)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          {/* Mode tabs */}
          <div
            className="flex items-center gap-1 mb-3 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0"
            style={{
              overflowX: "auto",
              WebkitOverflowScrolling: "touch",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            <button onClick={() => setSearchMode("text")}
              style={{ flexShrink: 0, whiteSpace: "nowrap", height: "36px", borderRadius: "8px", fontSize: "13px", border: searchMode === "text" ? "none" : "1px solid #27272a" }}
              className={`flex items-center gap-1.5 px-3 sm:px-4 font-semibold transition-colors ${searchMode === "text" ? "bg-red-600 text-white" : "bg-transparent text-zinc-500 hover:text-zinc-300 search-tab-inactive"}`}>
              <Search size={13} style={{ flexShrink: 0 }} />
              <span><span className="hidden sm:inline">Part </span>Search</span>
            </button>
            <button onClick={() => setSearchMode("reg")}
              style={{ flexShrink: 0, whiteSpace: "nowrap", height: "36px", borderRadius: "8px", fontSize: "13px", border: searchMode === "reg" ? "none" : "1px solid #27272a" }}
              className={`flex items-center gap-1.5 px-3 sm:px-4 font-semibold transition-colors ${searchMode === "reg" ? "bg-red-600 text-white" : "bg-transparent text-zinc-500 hover:text-zinc-300 search-tab-inactive"}`}>
              <Car size={13} style={{ flexShrink: 0 }} /> Reg Plate <span style={{ fontSize: "9px", padding: "1px 4px" }} className="bg-blue-900/40 border border-blue-500/30 text-blue-300 rounded font-bold tracking-wider leading-none">UK</span>
            </button>
            <button onClick={() => setSearchMode("vin")}
              style={{ flexShrink: 0, whiteSpace: "nowrap", height: "36px", borderRadius: "8px", fontSize: "13px", border: searchMode === "vin" ? "none" : "1px solid #27272a" }}
              className={`flex items-center gap-1.5 px-3 sm:px-4 font-semibold transition-colors ${searchMode === "vin" ? "bg-red-600 text-white" : "bg-transparent text-zinc-500 hover:text-zinc-300 search-tab-inactive"}`}>
              <Search size={13} style={{ flexShrink: 0 }} /> VIN 🌍
            </button>
            <button onClick={() => navigate('/tyres')}
              style={{ flexShrink: 0, whiteSpace: "nowrap", height: "36px", borderRadius: "8px", fontSize: "13px", border: "1px solid #27272a" }}
              className="flex items-center gap-2 px-3 sm:px-4 font-semibold bg-transparent text-zinc-500 hover:text-zinc-300 search-tab-inactive transition-colors">
              <img
                src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f6de.png"
                width={16}
                height={16}
                alt="tyre"
                loading="lazy"
                style={{ display: "inline-block", verticalAlign: "middle", flexShrink: 0 }}
              />
              <span>Tyre Search</span>
            </button>
          </div>

          {searchMode === "text" ? (
            <div className="space-y-2">
              <form onSubmit={(e) => { setAutoOpen(false); handleSearch(e); }} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="flex-1 relative flex items-center group">
                  <SearchBarGarageDropdown onSelect={(vq) => setQuery((prev) => prev.trim() ? `${vq} ${prev.trim()}` : vq)} />
                  <Search size={18} className="absolute left-8 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    ref={searchInputRef}
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); setAutoOpen(true); }}
                    onFocus={() => setAutoOpen(true)}
                    placeholder="Search car parts..."
                    autoComplete="off"
                    className="w-full pl-14 pr-4 h-14 rounded-2xl bg-[#141414] border border-white/10 text-white placeholder:text-zinc-500 focus:outline-none focus:border-red-500/50 focus:shadow-[0_0_0_3px_rgba(220,38,38,0.1)] transition-colors text-sm"
                  />
                  <SearchAutocomplete
                    query={query}
                    open={autoOpen}
                    inputRef={searchInputRef}
                    onClose={() => setAutoOpen(false)}
                    onSelect={(q) => {
                      setQuery(q);
                      setActiveQuery(q);
                      setCurrentPage(1);
                      setSearchParams({ q });
                      setAutoOpen(false);
                    }}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className={`cursor-pointer shrink-0 ${identifying ? "pointer-events-none opacity-60" : ""}`}>
                    <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={identifying} />
                    <div className="flex items-center gap-1.5 px-4 h-14 rounded-xl bg-[#1a1a1a] hover:bg-[#222] border border-white/10 transition-colors text-sm text-zinc-300">
                      {identifying ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
                      <span style={{ fontSize: "13px" }}>{identifying ? "Identifying..." : "Photo Search"}</span>
                    </div>
                  </label>
                  <button type="submit" className="h-14 px-6 sm:px-8 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm flex items-center gap-2 transition-colors duration-150 flex-1 sm:flex-none justify-center">
                    <Search size={16} /> Search
                  </button>
                </div>
              </form>
              {/* Garage vehicle filter badge */}
              {garageVehicleLabel && (
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-zinc-800 border border-white/10 text-zinc-300">
                    🚗 Searching for: {garageVehicleLabel}
                    <button onClick={() => { setGarageVehicleLabel(null); searchParams.delete("fromGarage"); setSearchParams(searchParams); }} className="ml-1 hover:text-white transition-colors"><X size={12} /></button>
                  </span>
                </div>
              )}
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
              {!activeQuery && (
                <RecentSearches
                  onSelect={(q) => {
                    setQuery(q);
                    setActiveQuery(q);
                    setCurrentPage(1);
                    setSearchParams({ q });
                  }}
                />
              )}
            </div>
          ) : searchMode === "reg" ? (
            <VehicleLookup onLookupStart={handleVehicleLookupStart} onVehicleFound={handleVehicleLookupSuccess} />
          ) : (
            <div className="space-y-2">
              <form onSubmit={async (e) => {
                e.preventDefault();
                if (!user) { setAuthGateOpen(true); return; }
                const cleaned = vinNumber.replace(/\s/g, "").toUpperCase();
                if (cleaned.length !== 17) { setVinError("VIN must be exactly 17 characters"); return; }
                if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(cleaned)) { setVinError("Invalid VIN — letters I, O, Q are not allowed"); return; }
                setVinLoading(true); setVinError(""); setVinVehicle(null);
                try {
                  const { data, error } = await supabase.functions.invoke("vin-decode", {
                    body: { vin: cleaned },
                  });
                  if (error || data?.error || !data?.vehicle?.make) {
                    setVinError(data?.error || "VIN not found. Please check and try again."); return;
                  }
                  const vehicle = data.vehicle;
                  setVinVehicle(vehicle);
                  const vinCountry = getCountryFromVIN(cleaned);
                  setVinCountryInfo(vinCountry);
                  if (vinCountry.fallback) {
                    setVinCountryModalOpen(true);
                    // Still prepare the search query for when user picks a market
                    const sq = vehicle.model
                      ? `${vehicle.make} ${vehicle.model} ${vehicle.year}`.trim()
                      : `${vehicle.make} ${vehicle.year}`.trim();
                    setQuery(sq);
                    setVehicleInfo({ make: vehicle.make, model: vehicle.model, yearOfManufacture: vehicle.year } as any);
                    setVehicleModelConfirmed(true);
                  } else {
                    const sq = vehicle.model
                      ? `${vehicle.make} ${vehicle.model} ${vehicle.year}`.trim()
                      : `${vehicle.make} ${vehicle.year}`.trim();
                    setQuery(sq); setActiveQuery(sq); setSearchMode("text");
                    setVehicleInfo({ make: vehicle.make, model: vehicle.model, yearOfManufacture: vehicle.year } as any);
                    setVehicleModelConfirmed(true);
                    setSearchParams({ q: sq, vin: cleaned, vehicle: JSON.stringify(vehicle) });
                  }
                } catch { setVinError("Failed to decode VIN. Please try again."); } finally { setVinLoading(false); }
              }} className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    value={vinNumber}
                    onChange={(e) => { setVinNumber(e.target.value.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, "").slice(0, 17)); setVinError(""); }}
                    placeholder="Enter 17-character VIN"
                    className="w-full pl-11 pr-16 h-14 rounded-2xl bg-[#141414] border border-white/10 text-white placeholder:text-zinc-500 focus:outline-none focus:border-red-500/50 transition-colors text-sm uppercase tracking-widest font-mono font-bold"
                    maxLength={17}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-zinc-500 font-mono">{vinNumber.length}/17</span>
                </div>
                <button type="submit" disabled={vinLoading || vinNumber.length !== 17}
                  className="h-14 px-6 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white font-semibold text-sm flex items-center gap-2 transition-colors duration-150">
                  {vinLoading ? <Loader2 size={16} className="animate-spin" /> : <><Search size={16} /> Lookup</>}
                </button>
              </form>
              {vinError && <p className="text-xs text-red-400 text-center">{vinError}</p>}
              {vinVehicle && (
                <div className="bg-[#111] border border-white/[0.08] rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🌍</span>
                      <div>
                        <h3 className="text-lg font-bold text-white">{vinVehicle.make} {vinVehicle.model}{vinVehicle.year && <span className="text-zinc-400 font-normal ml-2">({vinVehicle.year})</span>}</h3>
                        {vinVehicle.series && <p className="text-xs text-zinc-500">{vinVehicle.series}</p>}
                      </div>
                    </div>
                    <span className="text-xs font-mono bg-zinc-800 px-3 py-1 rounded-lg text-zinc-400">{vinVehicle.vin}</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {vinVehicle.engine && <div><p className="text-[10px] text-zinc-600 uppercase tracking-wide">Engine</p><p className="text-sm font-semibold text-white">{vinVehicle.engine}</p></div>}
                    {vinVehicle.fuel && <div><p className="text-[10px] text-zinc-600 uppercase tracking-wide">Fuel</p><p className="text-sm font-semibold text-white">{vinVehicle.fuel}</p></div>}
                    {vinVehicle.transmission && <div><p className="text-[10px] text-zinc-600 uppercase tracking-wide">Transmission</p><p className="text-sm font-semibold text-white">{vinVehicle.transmission}</p></div>}
                    {vinVehicle.bodyClass && <div><p className="text-[10px] text-zinc-600 uppercase tracking-wide">Body</p><p className="text-sm font-semibold text-white">{vinVehicle.bodyClass}</p></div>}
                    {vinVehicle.country && <div><p className="text-[10px] text-zinc-600 uppercase tracking-wide">Made in</p><p className="text-sm font-semibold text-white">{vinVehicle.country}</p></div>}
                    {vinVehicle.drive && <div><p className="text-[10px] text-zinc-600 uppercase tracking-wide">Drive</p><p className="text-sm font-semibold text-white">{vinVehicle.drive}</p></div>}
                  </div>
                </div>
              )}
              {!vinError && !vinVehicle && <p className="text-xs text-zinc-500 text-center">Works for vehicles from USA, Germany, Japan, and 50+ countries</p>}
            </div>
          )}
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="max-w-7xl mx-auto w-full flex-1 px-4 sm:px-6 lg:px-8 py-6 sm:py-10 relative z-10 animate-fade-in" ref={resultsRef}>
        <LocationNudge />

        {/* ── Supplier Sources Banner ── */}
        {!supplierBannerDismissed && (
          <div ref={supplierBannerRef} className="mb-4 bg-zinc-900/50 border border-white/[0.06] rounded-xl px-4 py-2.5 flex items-center gap-3 scroll-mt-24">
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              {SUPPLIERS.map((supplier, idx) => {
                const isActive = activeSupplierId === supplier.id;
                const isFilterable = !!SUPPLIER_BRAND_MAP[supplier.id];
                const dimmed = activeSupplierId !== null && !isActive;
                if (supplier.status !== "live") {
                  return (
                    <span key={supplier.id} className="flex items-center gap-1.5">
                      {idx > 0 && <span className="text-[10px] text-zinc-600">•</span>}
                      <span className="opacity-50 flex items-center gap-1" style={{ fontSize: "12px", color: "#71717a" }}>
                        <span className="rounded-full bg-zinc-600 inline-block" style={{ width: "6px", height: "6px" }} />
                        {supplier.label}
                      </span>
                    </span>
                  );
                }
                return (
                  <span key={supplier.id} className="flex items-center gap-1.5">
                    {idx > 0 && <span className="text-[10px] text-zinc-600">•</span>}
                    <button
                      type="button"
                      onClick={() => handleSupplierClick(supplier)}
                      disabled={!isFilterable}
                      title={isFilterable ? (isActive ? "Click to clear filter" : `Show only ${supplier.label}`) : `${supplier.label} (live source)`}
                      className={`flex items-center gap-1.5 font-medium transition-all ${
                        isFilterable ? "cursor-pointer hover:text-white" : "cursor-default"
                      } ${
                        isActive
                          ? "text-[#cc1111] border-b-2 border-[#cc1111] -mb-[2px] pb-[1px]"
                          : dimmed
                            ? "text-white opacity-50"
                            : "text-white"
                      }`}
                      style={{ fontSize: "12px", fontWeight: 500 }}
                    >
                      {isActive ? (
                        <Check size={11} className="text-[#cc1111]" strokeWidth={3} />
                      ) : (
                        <span className="rounded-full bg-emerald-400 inline-block" style={{ width: "6px", height: "6px" }} />
                      )}
                      {supplier.label}
                    </button>
                  </span>
                );
              })}
            </div>
            <p className="text-xs text-zinc-500 flex-1 hidden sm:block">
              {activeSupplierId ? "Filtering by supplier — click again to clear" : "More suppliers coming soon"}
            </p>
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
            {/* VIN Country Detection Banner — only for supported (non-fallback) countries */}
            {vinCountryInfo && !vinCountryInfo.fallback && (
              <div className="mb-4 rounded-xl border border-white/[0.06] bg-zinc-900/60 px-4 py-3 flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <Globe size={16} className="text-zinc-400 shrink-0" />
                  <span className="text-sm text-zinc-300">
                    Vehicle manufactured in <span className="font-semibold text-white">{vinCountryInfo.name}</span>
                  </span>
                </div>
                <span className="text-xs text-zinc-500">
                  Showing results from <span className="font-medium text-zinc-300">{vinCountryInfo.ebayDomain}</span>
                </span>
              </div>
            )}

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
                        className="flex-1 h-11 rounded-xl bg-[#141414] border border-white/10 px-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-red-500/50 transition-colors"
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

            {/* ── TecDoc Compatible Parts (only for plate searches) ── */}
            {vehicleInfo && (
              <TecDocPartsSection
                make={vehicleInfo.make}
                model={vehicleInfo.model || vehicleModelInput || null}
                year={vehicleInfo.yearOfManufacture}
              />
            )}

            {/* ── Results Header ── */}
            <div className="mb-4 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <p className="text-lg text-zinc-400 font-normal mb-1">{categoryFilter !== "All Parts" ? `${categoryFilter} for` : "Results for"}</p>
                <h1 className="text-3xl md:text-4xl font-bold text-white">
                  <span className="text-red-500">"</span>{activeQuery}<span className="text-red-500">"</span>
                </h1>
                {totalResults > 0 && !liveLoading && (
                  <>
                    <p className="mt-2 flex items-center gap-2" style={{ fontSize: "13px", color: "#52525b" }}>
                      <span className="rounded-full bg-emerald-500 animate-pulse" style={{ width: "6px", height: "6px" }} />
                      {activeFilterCount > 0
                        ? `Showing ${filteredResults.length} of ${liveResults.length} loaded`
                        : `${startItem.toLocaleString()}-${endItem.toLocaleString()} of ${totalResults.toLocaleString()} listings`}
                    </p>
                    <p className="mt-1.5" style={{ fontSize: "12px", color: "#52525b" }}>
                      from{" "}
                      <button
                        type="button"
                        onClick={scrollToSuppliers}
                        className="text-zinc-400 hover:text-[#cc1111] underline-offset-2 hover:underline transition-colors"
                      >
                        {liveSupplierCount} suppliers
                      </button>{" "}
                      · Last updated just now
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* ── Active Filter Pills ── */}
            {activeFilterPills.length > 0 && !liveLoading && (
              <div className="mb-3 flex items-center gap-2 flex-wrap">
                {activeFilterPills.map((pill) => (
                  <button
                    key={pill.key}
                    type="button"
                    onClick={pill.clear}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors"
                    style={{
                      background: "rgba(204,17,17,0.10)",
                      color: "#cc1111",
                      border: "1px solid rgba(204,17,17,0.20)",
                    }}
                  >
                    {pill.label}
                    <X size={11} strokeWidth={2.5} />
                  </button>
                ))}
                {activeFilterPills.length > 1 && (
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="text-xs text-zinc-500 hover:text-white transition-colors ml-1"
                  >
                    Clear all
                  </button>
                )}
              </div>
            )}


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
            ) : liveResults.length > 0 && unifiedResults.length === 0 ? (
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
                {isClassicPartSearch(activeQuery) && brandFilter !== "Green Spark Plug Co." && brandFilter !== "Amazon" && (
                  <>
                    <GreenSparkFeaturedCard searchQuery={activeQuery} />
                    <p className="text-[11px] text-muted-foreground mb-2 uppercase tracking-widest">
                      Also available on eBay
                    </p>
                  </>
                )}
                {brandFilter !== "Green Spark Plug Co." && (
                <>
                <div className="results-grid-stagger grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
                  {interleavedResults.map((entry: any, idx: number) => {
                    if (entry.__gsp) {
                      const gspKey = `gsp-${entry.id}`;
                      return (
                        <GreenSparkProductCard
                          key={`gsp-${entry.id}-${idx}`}
                          product={entry}
                          onSave={handleSave}
                          isSaved={savedIds.has(gspKey)}
                          savingId={savingId}
                          onCompareToggle={(c) => {
                            const isSelected = compareParts.some((p) => p.id === c.id);
                            if (isSelected) {
                              setCompareParts((prev) => prev.filter((p) => p.id !== c.id));
                            } else if (compareParts.length < 3) {
                              setCompareParts((prev) => [
                                ...prev,
                                {
                                  id: c.id,
                                  title: c.title,
                                  price: c.price,
                                  condition: c.condition,
                                  sellerName: c.sellerName,
                                  sellerRating: 100,
                                  freeShipping: false,
                                  shippingCost: 0,
                                  location: "UK",
                                  itemCountry: "GB",
                                  url: c.url,
                                  imageUrl: c.imageUrl,
                                  source: "ebay" as const,
                                },
                              ]);
                            }
                          }}
                          isComparing={compareParts.some((p) => p.id === gspKey)}
                          compareDisabled={compareParts.length >= 3}
                        />
                      );
                    }
                    const item = entry;
                    // ── eBay Card ──
                    const priceBadge = getPriceBadge(item.price);
                    const conditionNorm = (item.condition || "").trim().toLowerCase();
                    void conditionNorm;
                    const priceBadgeStyles = {
                      great: { text: "text-emerald-400", icon: "✦" },
                      good: { text: "text-blue-400", icon: "✦" },
                      high: { text: "text-red-400", icon: "↑" },
                      top: { text: "text-amber-400", icon: "★" },
                    };
                    return (
                      <div key={item.id}
                        onClick={() => {
                          try {
                            const stored = localStorage.getItem('partara_recent_views');
                            const existing = stored ? JSON.parse(stored) : [];
                            const itemId = String(item.id || Math.random());
                            const filtered = existing.filter((i: any) => String(i.id) !== itemId);
                            const newItem = {
                              id: itemId,
                              title: item.partName || 'Car Part',
                              price: String(item.price || '0'),
                              currency: 'GBP',
                              image: item.imageUrl || '',
                              url: buildEbayAffiliateUrl(item.url || ''),
                              viewedAt: new Date().toISOString()
                            };
                            const updated = [newItem, ...filtered].slice(0, 20);
                            localStorage.setItem('partara_recent_views', JSON.stringify(updated));
                          } catch(e) {}
                        }}
                        className="group rounded-3xl overflow-hidden border border-white/[0.06] bg-[#111]/60 backdrop-blur-sm hover:border-white/[0.15] hover:bg-[#111]/80 hover:shadow-2xl hover:shadow-black/60 hover:-translate-y-0.5 transition-[colors,transform] flex flex-col relative cursor-pointer animate-fade-in"
                        style={{ animationDelay: `${idx * 50}ms` }}>
                        <a href={item.url} target="_blank" rel="noopener noreferrer" className="block relative">
                          <div className="h-[140px] sm:h-[180px] lg:h-[200px] bg-[#0d0d0d] overflow-hidden relative">
                            <img src={item.imageUrl} alt={item.partName} className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-500" loading="lazy" decoding="async" onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }} />
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
                          {fitRegLabel && (
                            <span
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 w-fit text-[11px] font-semibold"
                              style={{
                                background: "rgba(34,197,94,0.10)",
                                color: "#4ade80",
                                borderRadius: "4px",
                              }}
                              title={`Compatible with ${fitRegLabel}`}
                            >
                              <Check size={10} strokeWidth={3} />
                              Fits {fitRegLabel}
                            </span>
                          )}

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
                              "bg-blue-500/15 text-blue-400 border border-blue-500/25"
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
                            <a href={buildEbayAffiliateUrl(item.url)} target="_blank" rel="noopener noreferrer"
                              style={{ whiteSpace: "nowrap", height: "44px" }}
                              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-colors duration-150"
                              title="Buying through this link supports GOPARTARA at no extra cost to you ">
                              <ExternalLink size={14} /> View on eBay →
                            </a>
                            <button onClick={() => {
                              const isSelected = compareParts.some((p) => p.id === item.id);
                              if (isSelected) setCompareParts((prev) => prev.filter((p) => p.id !== item.id));
                              else if (compareParts.length < 3) setCompareParts((prev) => [...prev, { id: item.id, title: item.partName, price: item.price, condition: item.condition, sellerName: item.sellerUsername, sellerRating: item.sellerPositivePercent, freeShipping: item.freeShipping, shippingCost: item.shippingCost, location: item.itemLocation, itemCountry: item.itemCountry, url: item.url, imageUrl: item.imageUrl, source: "ebay" as const }]);
                            }}
                              aria-label="Compare this part"
                              className={`min-w-[44px] min-h-[44px] sm:w-9 sm:h-9 sm:min-w-0 sm:min-h-0 rounded-xl border flex items-center justify-center transition-colors ${compareParts.some((p) => p.id === item.id) ? "border-red-500 bg-red-500/20 text-red-400" : "border-white/[0.06] bg-[#1a1a1a] hover:bg-[#222] text-zinc-400 hover:text-white"}`}
                              title={compareParts.some((p) => p.id === item.id) ? "Remove" : "Compare"}
                              disabled={!compareParts.some((p) => p.id === item.id) && compareParts.length >= 3}>
                              <Scale size={14} />
                            </button>
                            <button onClick={() => handleSave(item)} disabled={savingId === item.id}
                              aria-label="Save this part"
                              className="min-w-[44px] min-h-[44px] sm:w-9 sm:h-9 sm:min-w-0 sm:min-h-0 rounded-xl border border-white/[0.06] bg-[#1a1a1a] hover:bg-[#222] flex items-center justify-center transition-colors text-zinc-400 hover:text-white">
                              {savingId === item.id ? <Loader2 size={14} className="animate-spin" /> : savedIds.has(item.partNumber) ? <BookmarkCheck size={14} className="text-red-500" /> : <Bookmark size={14} />}
                            </button>
                            <PriceAlertDialog supplierName="eBay Motors" partQuery={item.partName} supplierUrl={item.url} ebayItemId={item.id} currentPrice={item.price} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

            {/* ── Autodoc Affiliate Banner (geo-targeted, hidden for ad-free users) ── */}
            {!searchLimit.isPro && (() => {
              const autodocCountries: Record<string, string> = {
                GB: 'autodoc.co.uk', AT: 'autodoc.at', FI: 'autodoc.co.uk', FR: 'autodoc.fr',
                IT: 'autodoc.it', NL: 'autodoc.nl', NO: 'autodoc.co.uk', PL: 'autodoc.pl',
                PT: 'autodoc.pt', ES: 'autodoc.es', SE: 'autodoc.co.uk',
              };
              const userCountry = localStorage.getItem('partara_location_country') 
                || localStorage.getItem('partara_selected_marketplace') 
                || 'GB';
              const domain = autodocCountries[userCountry];
              if (!activeQuery || liveLoading || !domain) return null;
              const autodocUrl = `https://www.${domain}/search?query=${encodeURIComponent(activeQuery)}`;
              const href = `https://lowest-prices.eu/a/rkrn4sDyrWIyElw?url=${encodeURIComponent(autodocUrl)}`;
              return (
                <a href={href} target="_blank" rel="noopener noreferrer"
                  className="mt-6 mb-4 bg-zinc-900/60 border border-white/[0.08] rounded-xl px-5 py-4 flex items-center gap-4 hover:border-red-500/30 hover:bg-zinc-900/80 transition-colors group">
                  <div className="w-10 h-10 rounded-xl bg-[#E72B2B]/10 flex items-center justify-center shrink-0 border border-[#E72B2B]/20">
                    <img src="https://www.autodoc.co.uk/favicon.ico" alt="Autodoc" loading="lazy" decoding="async" className="w-5 h-5" />
                  </div>
                  <p className="text-sm text-zinc-300 flex-1">
                    Check prices on <span className="text-white font-medium">Autodoc</span> — <span className="text-zinc-400">Europe's largest auto parts store</span>
                  </p>
                  <span className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-colors">
                    View on Autodoc <ExternalLink size={14} />
                  </span>
                </a>
              );
            })()}

                {/* More suppliers coming soon — honest banner */}
                <div className="bg-zinc-900/40 border border-white/[0.06] rounded-2xl p-6 mt-6 text-center">
                  <div className="text-4xl mb-3">🔧</div>
                  <h3 className="text-lg font-bold text-white mb-1.5">More suppliers coming soon</h3>
                  <p className="text-sm text-zinc-400 max-w-md mx-auto mb-3">
                    We're working with Amazon, Euro Car Parts, GSF Car Parts, Autodoc, Halfords and more. Currently live: eBay Global, Green Spark Plug Co., and 5 tyre suppliers across UK & EU.
                  </p>
                  <a href="/contact" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
                    Want to suggest a supplier? Contact us →
                  </a>
                </div>

                {/* eBay Deals Banner — UK only */}
                {activeQuery && isUKUser() && (() => {
                  const matched = findDealByBrand(activeQuery);
                  return matched ? (
                    <a href={matched.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between w-full p-4 mt-4 bg-gradient-to-r from-red-950/40 to-zinc-900/60 border border-red-800/30 hover:border-red-600/40 rounded-2xl transition-colors group">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">🔥</span>
                        <div>
                          <p className="text-sm font-bold text-white">{matched.brand} Parts on Sale — eBay UK</p>
                          <p className="text-xs text-red-400">{matched.discount} · Exclusive UK deal</p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-red-400 group-hover:translate-x-0.5 transition-transform">View deal →</span>
                    </a>
                  ) : (
                    <a href={EBAY_ALL_DEALS_URL} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between w-full p-4 mt-4 bg-gradient-to-r from-red-950/40 to-zinc-900/60 border border-red-800/30 hover:border-red-600/40 rounded-2xl transition-colors group">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">🔥</span>
                        <div>
                          <p className="text-sm font-bold text-white">eBay Motors Deals — eBay UK</p>
                          <p className="text-xs text-red-400">See today's best automotive offers</p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-red-400 group-hover:translate-x-0.5 transition-transform">View deal →</span>
                    </a>
                  );
                })()}

                {/* Premium "Load more" button */}
                {currentPage < totalPages && (
                  <div className="mt-10 mb-2">
                    <button
                      type="button"
                      onClick={handleLoadMore}
                      disabled={loadingMore || liveLoading}
                      className="w-full flex items-center justify-center gap-2 transition-colors disabled:cursor-not-allowed group"
                      style={{
                        height: "48px",
                        background: "transparent",
                        border: "1px solid #27272a",
                        borderRadius: "10px",
                        color: "#a1a1aa",
                        fontSize: "14px",
                        fontWeight: 600,
                      }}
                      onMouseEnter={(e) => {
                        if (!loadingMore && !liveLoading) {
                          e.currentTarget.style.borderColor = "#3f3f46";
                          e.currentTarget.style.color = "#ffffff";
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "#27272a";
                        e.currentTarget.style.color = "#a1a1aa";
                      }}
                    >
                      {loadingMore || liveLoading ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Loading more results…
                        </>
                      ) : (
                        <>
                          Load {Math.min(ITEMS_PER_PAGE, totalResults - endItem)} more results
                          <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
                        </>
                      )}
                    </button>
                    <p className="text-center mt-2.5" style={{ fontSize: "12px", color: "#52525b" }}>
                      Showing {endItem.toLocaleString()} of {totalResults.toLocaleString()} results
                    </p>
                  </div>
                )}

                {/* Pagination (page jump for power users) */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-1 mt-6 flex-wrap">
                    <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="flex items-center gap-0.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-[#1a1a1a] hover:bg-[#222] text-zinc-300 border border-white/[0.06]"><ChevronLeft size={14} /> Prev</button>
                    {getPageNumbers().map((page, i) => page === "..." ? (
                      <span key={`e-${i}`} className="px-2 py-2 text-sm text-zinc-600">...</span>
                    ) : (
                      <button key={page} onClick={() => handlePageChange(page as number)}
                        className={`min-w-[36px] h-9 rounded-xl text-sm font-medium transition-colors border ${currentPage === page ? "bg-red-600 text-white border-red-600 shadow-lg shadow-red-600/25" : "bg-[#1a1a1a] hover:bg-[#222] text-zinc-300 border-white/[0.06]"}`}>{page}</button>
                    ))}
                    <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="flex items-center gap-0.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-[#1a1a1a] hover:bg-[#222] text-zinc-300 border border-white/[0.06]">Next <ChevronRight size={14} /></button>
                  </div>
                )}


                {/* Amazon Affiliate Banner */}
                {activeQuery && (
                  <a
                    href={`https://www.amazon.co.uk/s?k=${encodeURIComponent(activeQuery)}&tag=gopartara-21`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between w-full p-4 mt-6 bg-zinc-900/50 border border-zinc-800/50 rounded-xl hover:border-zinc-700/50 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">📦</span>
                      <div>
                        <p className="text-sm font-medium text-zinc-300">
                          Also search Amazon UK
                        </p>
                        <p className="text-xs text-zinc-600">
                          Compare prices on Amazon for "{activeQuery}"
                        </p>
                      </div>
                    </div>
                    <span className="text-zinc-600 group-hover:text-zinc-400 transition-colors">
                      →
                    </span>
                  </a>
                )}

                {/* Sell your parts CTA */}
                <div className="text-center mt-6 mb-2">
                  <a
                    href="/list-your-parts"
                    className="text-xs text-zinc-500 hover:text-red-400 transition-colors"
                  >
                    Got spare parts? <span className="text-zinc-300 hover:text-red-400">Sell your parts on GOPARTARA →</span>
                  </a>
                </div>
                </>
                )}
                {isClassicPartSearch(activeQuery) && brandFilter !== "eBay" && brandFilter !== "Amazon" && (
                  <GreenSparkResultsRow searchQuery={activeQuery} />
                )}
              </div>
            ) : (liveLoading || isInitialLoad) ? (
              /* ── Loading State (also covers initial-load grace period) ── */
              <div className="flex flex-col items-center justify-center py-20 mb-8">
                <div className="text-6xl mb-4 opacity-30 animate-pulse">🔍</div>
                <p className="text-lg font-semibold text-white mb-1 animate-pulse">
                  Searching 6,000,000+ parts across all suppliers…
                </p>
                <p className="text-sm text-zinc-500 mb-6 text-center max-w-md">
                  Hang tight — comparing prices from every supplier we track.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full max-w-3xl">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-48 rounded-2xl bg-white/[0.03] border border-white/5 animate-pulse" />
                  ))}
                </div>
              </div>
            ) : (
              /* ── Empty / Error State (premium) ── */
              <div className="flex flex-col items-center justify-center py-20 mb-8 px-4">
                <Search size={80} strokeWidth={1.25} className="mb-6" style={{ color: "#3f3f46" }} />
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 text-center">
                  {ebayFallback ? "eBay search temporarily unavailable" : <>No results for <span className="text-[#cc1111]">"{activeQuery}"</span></>}
                </h2>
                <p className="text-sm text-zinc-500 mb-8 text-center max-w-md">
                  {ebayFallback
                    ? "The service is experiencing high demand. Try again in a moment."
                    : "Try: broader terms · check spelling · remove filters"}
                </p>

                {!ebayFallback && (
                  <>
                    {/* Suggestion chips */}
                    <div className="flex flex-wrap items-center justify-center gap-2 mb-8 max-w-xl">
                      <span className="text-[11px] uppercase tracking-wider text-zinc-600 mr-1">Try:</span>
                      {["BMW brake pads", "Ford Focus clutch", "VW Golf filters"].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => {
                            setQuery(s);
                            setActiveQuery(s);
                            setSelectedCategory(null);
                            setCurrentPage(1);
                            setSearchParams({ q: s });
                          }}
                          className="px-3 py-1.5 rounded-full text-xs font-medium bg-[#111111] border border-[#27272a] text-zinc-300 hover:text-white hover:border-[#3f3f46] transition-colors"
                        >
                          {s}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 mb-8">
                      {activeFilterCount > 0 && (
                        <button
                          onClick={clearAllFilters}
                          className="px-4 py-2 rounded-xl bg-[#cc1111] hover:bg-[#b30e0e] text-white text-sm font-semibold transition-colors"
                        >
                          Clear filters
                        </button>
                      )}
                      <button
                        onClick={() => { setQuery(""); setActiveQuery(""); setSearchParams({}); }}
                        className="px-4 py-2 rounded-xl bg-[#1a1a1a] border border-white/10 text-sm font-medium text-zinc-300 hover:bg-[#222] hover:border-white/20 transition-colors"
                      >
                        Clear search
                      </button>
                    </div>

                    {/* Search tips collapsible */}
                    <details className="w-full max-w-md group">
                      <summary className="cursor-pointer flex items-center justify-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors list-none [&::-webkit-details-marker]:hidden">
                        <ChevronDown size={14} className="transition-transform group-open:rotate-180" />
                        Search tips
                      </summary>
                      <ul className="mt-4 space-y-2 text-xs text-zinc-500 leading-relaxed border border-[#1f1f1f] bg-[#0f0f0f] rounded-xl p-4">
                        <li>• Use the part name + brand, e.g. <span className="text-zinc-300">"BMW brake pads"</span></li>
                        <li>• Search by reg plate from the homepage to get fitment-checked results</li>
                        <li>• Try the OEM part number if you know it (printed on the old part)</li>
                        <li>• Remove model year if you're getting too few matches</li>
                        <li>• Switch your country in the marketplace selector for more results</li>
                      </ul>
                    </details>
                  </>
                )}

                {ebayFallback && (
                  <div className="mt-2 w-full max-w-lg text-center">
                    <a href="/contact" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">Need help? Contact us →</a>
                  </div>
                )}
              </div>
            )}


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

      {/* Search Limit Modal */}
      {searchLimitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setSearchLimitModalOpen(false)}>
          <div className="bg-[#141414] border border-white/10 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-red-600/15 flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={28} className="text-red-500" />
              </div>
              {searchLimitModalType === "free" ? (
                <>
                  <h3 className="text-xl font-bold text-white mb-2">You've used all 5 free searches 🔍</h3>
                  <p className="text-zinc-400 text-sm mb-6">Upgrade to Pro for unlimited searches, photo search, price alerts and more.</p>
                  <button onClick={() => { setSearchLimitModalOpen(false); navigate("/pricing"); }} className="w-full h-12 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm transition-colors">
                    Upgrade to Pro — £9.99/mo
                  </button>
                  <button onClick={() => setSearchLimitModalOpen(false)} className="mt-3 w-full h-10 rounded-xl text-zinc-400 hover:text-zinc-200 text-sm transition-colors">
                    Maybe later
                  </button>
                </>
              ) : (
                <>
                  <h3 className="text-xl font-bold text-white mb-2">Search limit reached</h3>
                  <p className="text-zinc-400 text-sm mb-6">Create a free account for 10 searches/month, or go Pro for unlimited.</p>
                  <div className="flex flex-col gap-2">
                    <button onClick={() => { setSearchLimitModalOpen(false); navigate("/auth"); }} className="w-full h-12 rounded-xl bg-white text-black font-semibold text-sm transition-colors hover:bg-zinc-200">
                      Sign Up Free
                    </button>
                    <button onClick={() => { setSearchLimitModalOpen(false); navigate("/pricing"); }} className="w-full h-12 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm transition-colors">
                      Go Pro — Unlimited
                    </button>
                  </div>
                  <button onClick={() => setSearchLimitModalOpen(false)} className="mt-3 text-zinc-400 hover:text-zinc-200 text-sm transition-colors">
                    Maybe later
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Same Query Confirmation Dialog */}
      {sameQueryConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setSameQueryConfirmOpen(false)}>
          <div className="bg-[#141414] border border-white/10 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <div className="text-4xl mb-3">⚠️</div>
              <h3 className="text-lg font-bold text-white mb-2">Duplicate search</h3>
              <p className="text-zinc-400 text-sm mb-6">
                You searched for "<span className="text-white font-medium">{pendingSearchQuery}</span>" recently.
                This will use 1 of your {searchLimit.remaining} remaining searches. Continue?
              </p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => { setSameQueryConfirmOpen(false); executeSearch(pendingSearchQuery); }}
                  className="w-full h-12 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm transition-colors"
                >
                  Yes, Search
                </button>
                <button
                  onClick={() => setSameQueryConfirmOpen(false)}
                  className="w-full h-10 rounded-xl text-zinc-400 hover:text-zinc-200 text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {vinCountryInfo && (
        <VinCountryModal
          open={vinCountryModalOpen}
          onClose={() => setVinCountryModalOpen(false)}
          countryInfo={vinCountryInfo}
          onSearchGlobal={() => {
            setVinCountryModalOpen(false);
            // Use the default fallback marketplace and proceed with search
            const sq = query.trim();
            if (sq) {
              setActiveQuery(sq); setSearchMode("text"); setCurrentPage(1);
              setSearchParams({ q: sq, vin: vinNumber || "", vehicle: vehicleInfo ? JSON.stringify(vehicleInfo) : "" });
            }
          }}
          onSelectMarket={(market) => {
            setVinCountryModalOpen(false);
            // Override marketplace to the selected one
            setVinCountryInfo({
              ...vinCountryInfo,
              ebayMarketplace: market.ebayMarketplace,
              ebayDomain: market.domain,
              mkrid: market.mkrid,
              fallback: false,
              fallbackNote: undefined,
            });
            const sq = query.trim();
            if (sq) {
              setActiveQuery(sq); setSearchMode("text"); setCurrentPage(1);
              setSearchParams({ q: sq, vin: vinNumber || "", vehicle: vehicleInfo ? JSON.stringify(vehicleInfo) : "" });
            }
          }}
        />
      )}
      <UpgradeModal
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        feature={upgradeFeature}
        featureLabel={upgradeLabel}
        requiredPlan={upgradeRequiredPlan}
      />
      <Footer />
    </div>
  );
};

export default SearchResults;
