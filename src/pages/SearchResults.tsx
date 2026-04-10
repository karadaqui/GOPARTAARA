import { useState, useRef, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search, ExternalLink, Loader2, Camera, Car, Shield, Scale, Star,
  Truck, Bookmark, BookmarkCheck, MapPin, Clock,
  Heart, AlertCircle, Zap, Filter as FilterIcon,
  ChevronLeft, ChevronRight, ChevronDown, Pencil, Calendar, Palette, Fuel, Gauge,
  ShieldCheck, Receipt, Check, X as XIcon,
} from "lucide-react";
import PriceAlertDialog from "@/components/PriceAlertDialog";
import { useAuth } from "@/contexts/AuthContext";
import VehicleLookup from "@/components/VehicleLookup";
import VehicleFilterButton from "@/components/VehicleFilterButton";
import SearchBarGarageDropdown from "@/components/SearchBarGarageDropdown";
import SearchCounter from "@/components/SearchCounter";
import { CompareBar, CompareModal, type CompareItem } from "@/components/PartsComparison";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSearchLimit } from "@/hooks/useSearchLimit";
import AuthGateModal from "@/components/AuthGateModal";

import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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
  { label: "Engine Parts", icon: "⚙️" },
  { label: "Body Parts", icon: "🚗" },
  { label: "Brakes", icon: "🛑" },
  { label: "Suspension", icon: "🔧" },
  { label: "Electrical", icon: "⚡" },
  { label: "Filters", icon: "🔍" },
  { label: "Exhaust", icon: "💨" },
  { label: "Interior", icon: "🪑" },
];

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

const SearchResults = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const searchLimit = useSearchLimit();
  const urlQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(urlQuery);
  // Auto-execute search from URL query parameter
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
  const [catalogResults, setCatalogResults] = useState<any[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);

  // When URL query changes, populate input but DON'T auto-execute search.
  // Search only runs on explicit user action (form submit / button click).
  useEffect(() => {
    if (urlQuery && urlQuery !== query) {
      setQuery(urlQuery);
    }
    if (urlQuery) {
      setSearchMode("text");
    }
    // Show auth gate if not logged in and URL has a query
    if (urlQuery && !user) {
      setAuthGateOpen(true);
    }
  }, [urlQuery]);

  useEffect(() => {
    const v = searchParams.get("vehicle");
    if (v) {
      try { setVehicleInfo(JSON.parse(decodeURIComponent(v))); } catch { }
    } else {
      setVehicleInfo(null);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!activeQuery.trim()) {
      setLiveResults([]);
      setTotalResults(0);
      setEbayFallback(false);
      return;
    }
    // Block unauthenticated users from fetching results
    if (!user) {
      setAuthGateOpen(true);
      setLiveResults([]);
      setTotalResults(0);
      return;
    }
    let cancelled = false;
    const fetchLive = async () => {
      setLiveLoading(true);
      setEbayFallback(false);
      try {
        const offset = (currentPage - 1) * ITEMS_PER_PAGE;
        const { data, error } = await supabase.functions.invoke("search-parts", {
          body: { query: activeQuery, category: selectedCategory || undefined, offset },
        });
        if (error) {
          // Handle server-side auth/limit errors
          const msg = (error as any)?.message || "";
          if (msg.includes("UNAUTHORIZED") || msg.includes("401")) {
            if (!cancelled) setAuthGateOpen(true);
            return;
          }
          if (msg.includes("SEARCH_LIMIT_REACHED") || msg.includes("403")) {
            if (!cancelled) {
              toast({ title: "Search limit reached", description: "Upgrade to Pro for unlimited searches.", variant: "destructive" });
              searchLimit.refresh();
            }
            return;
          }
          throw error;
        }
        if (!cancelled) {
          // Handle structured error responses from the edge function
          if (data?.error === "UNAUTHORIZED") {
            setAuthGateOpen(true);
            return;
          }
          if (data?.error === "SEARCH_LIMIT_REACHED") {
            toast({ title: "Search limit reached", description: data?.message || "Upgrade to Pro for unlimited searches.", variant: "destructive" });
            searchLimit.refresh();
            return;
          }
          if (data?.fallback) {
            setEbayFallback(true);
            setLiveResults([]);
            setTotalResults(0);
          } else {
            setLiveResults(data?.results || []);
            setTotalResults(data?.totalResults || 0);
            // Refresh search counter from DB after successful search
            searchLimit.refresh();
          }
        }
      } catch (err) {
        console.error("Live search failed:", err);
        if (!cancelled) { setLiveResults([]); setTotalResults(0); setEbayFallback(true); }
      } finally {
        if (!cancelled) setLiveLoading(false);
      }
    };
    fetchLive();
    return () => { cancelled = true; };
  }, [activeQuery, selectedCategory, currentPage, user]);

  // Fetch catalog results in parallel
  useEffect(() => {
    if (!activeQuery.trim() || !user) {
      setCatalogResults([]);
      return;
    }
    let cancelled = false;
    const fetchCatalog = async () => {
      setCatalogLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke("search-auto-parts", {
          body: { query: activeQuery },
        });
        if (!cancelled && !error) {
          setCatalogResults(data?.results || []);
        }
      } catch {
        if (!cancelled) setCatalogResults([]);
      } finally {
        if (!cancelled) setCatalogLoading(false);
      }
    };
    fetchCatalog();
    return () => { cancelled = true; };
  }, [activeQuery, user]);

  useEffect(() => {
    if (!user) return;
    supabase.from("saved_parts").select("part_number").eq("user_id", user.id).then(({ data }) => {
      if (data) setSavedIds(new Set(data.map((d) => d.part_number).filter(Boolean) as string[]));
    });
  }, [user]);

  const handleVehicleLookupStart = () => {
    setVehicleInfo(null);
    setQuery("");
    setActiveQuery("");
    setSelectedCategory(null);
    setLiveResults([]);
    setTotalResults(0);
    setSearchParams({});
  };

  const handleVehicleLookupSuccess = (vehicle: VehicleInfo) => {
    if (!user) { setAuthGateOpen(true); return; }
    const nextQuery = `${vehicle.make} ${vehicle.yearOfManufacture || ""}`.trim();

    setVehicleInfo(vehicle);
    setVehicleModelInput("");
    setVehicleModelConfirmed(!!vehicle.model);
    setQuery(nextQuery);
    setActiveQuery(nextQuery);
    setSelectedCategory(null);
    setCurrentPage(1);
    setSearchMode("text");
    setSearchParams({
      q: nextQuery,
      vehicle: JSON.stringify(vehicle),
    });

    if (user) {
      searchLimit.recordSearch();
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { setAuthGateOpen(true); return; }
    if (!query.trim()) return;
    if (searchLimit.limitReached) {
      toast({ title: "Search limit reached", description: "Upgrade to Pro for unlimited searches.", variant: "destructive" });
      return;
    }
    const q = query.trim();
    internalSearchRef.current = true; // Mark as internal so URL effect doesn't double-record
    setActiveQuery(q);
    setSelectedCategory(null);
    setCurrentPage(1);
    setSearchParams({ q });
    if (user) {
      searchLimit.recordSearch();
    }
  };

  const handleCategorySelect = (cat: string) => {
    setSelectedCategory(selectedCategory === cat ? null : cat);
    setCurrentPage(1);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!user) {
      setAuthGateOpen(true);
      if (photoInputRef.current) photoInputRef.current.value = "";
      return;
    }
    // Block photo search for free users
    if (!searchLimit.isPro) {
      toast({ title: "Photo search is available on Pro and Elite plans", description: "Upgrade to unlock photo search.", variant: "destructive" });
      navigate("/pricing");
      if (photoInputRef.current) photoInputRef.current.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Too large", description: "Image must be under 5MB.", variant: "destructive" });
      return;
    }
    setIdentifying(true);
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const { data, error } = await supabase.functions.invoke("identify-part", { body: { image: base64 } });
      if (error) throw error;
      const partName = data?.partName || "Unknown car part";
      if (partName === "Unknown car part" || data?.confidence === "low") {
        toast({ title: "Part not recognized", description: data?.details || "Try a clearer photo.", variant: "destructive" });
        return;
      }
      toast({ title: `Identified: ${partName}`, description: "Searching now..." });
      setQuery(partName);
      setActiveQuery(partName);
      setCurrentPage(1);
      setSearchParams({ q: partName });
    } catch (err: any) {
      toast({ title: "Identification failed", description: err.message || "Try again.", variant: "destructive" });
    } finally {
      setIdentifying(false);
      if (photoInputRef.current) photoInputRef.current.value = "";
    }
  };

  const handleSave = async (item: any) => {
    if (!user) {
      toast({ title: "Sign in required", description: "Create an account to save parts.", variant: "destructive" });
      return;
    }
    setSavingId(item.id);
    const isSaved = savedIds.has(item.partNumber);
    try {
      if (isSaved) {
        await supabase.from("saved_parts").delete().eq("user_id", user.id).eq("part_number", item.partNumber);
        setSavedIds((prev) => { const n = new Set(prev); n.delete(item.partNumber); return n; });
        toast({ title: "Removed from saved" });
      } else {
        await supabase.from("saved_parts").insert({
          user_id: user.id,
          part_name: item.partName,
          part_number: item.partNumber,
          price: item.price,
          supplier: "eBay Motors",
          url: item.url,
          image_url: item.imageUrl,
        });
        setSavedIds((prev) => new Set(prev).add(item.partNumber));
        toast({ title: "Part saved!" });
      }
    } catch {
      toast({ title: "Failed to save", variant: "destructive" });
    } finally {
      setSavingId(null);
    }
  };

  const maxPages = Math.floor(10000 / ITEMS_PER_PAGE);
  const totalPages = Math.min(Math.ceil(totalResults / ITEMS_PER_PAGE), maxPages);
  const startItem = (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endItem = Math.min(currentPage * ITEMS_PER_PAGE, totalResults);

  const PAGES_PER_CHUNK = 50;
  const currentChunk = Math.floor((currentPage - 1) / PAGES_PER_CHUNK);
  const chunkStart = currentChunk * PAGES_PER_CHUNK + 1;
  const chunkEnd = Math.min(chunkStart + PAGES_PER_CHUNK - 1, totalPages);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getPageNumbers = () => {
    const pages: (number | "...")[] = [];
    const rangeSize = chunkEnd - chunkStart + 1;
    if (rangeSize <= 7) {
      for (let i = chunkStart; i <= chunkEnd; i++) pages.push(i);
    } else {
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

  // Build combined supplier list (includes OEM brands + Amazon already in suppliers)
  const matchedOemBrands = activeQuery ? oemBrands.filter((b) => b.pattern.test(activeQuery)) : [];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="border-b border-border bg-card/40 backdrop-blur-lg sticky top-0 z-20 pt-14 sm:pt-16">
         <div className="container max-w-5xl py-2 sm:py-4 px-3 sm:px-4">
          <div className="flex gap-1 mb-3">
            <button onClick={() => setSearchMode("text")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${searchMode === "text" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
              <Search size={14} /> Part Search
            </button>
            <button onClick={() => setSearchMode("reg")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${searchMode === "reg" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
              <Car size={14} /> Reg Plate
            </button>
          </div>
          {searchMode === "text" ? (
            <div className="space-y-2">
              <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="flex-1 relative flex items-center">
                  <SearchBarGarageDropdown onSelect={(vq) => setQuery((prev) => prev.trim() ? `${vq} ${prev.trim()}` : vq)} />
                  <Search size={18} className="absolute left-8 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search car parts..." className="pl-14 bg-secondary border-border h-11 rounded-xl" />
                </div>
                <div className="flex items-center gap-2">
                  <label className={`cursor-pointer shrink-0 ${identifying ? "pointer-events-none opacity-60" : ""}`}>
                    <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={identifying} />
                    <div className="flex items-center gap-1.5 px-3 h-11 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors text-sm text-secondary-foreground">
                      {identifying ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
                      <span>{identifying ? "Identifying..." : "Photo"}</span>
                    </div>
                  </label>
                  <Button type="submit" className="rounded-xl h-11 px-4 sm:px-6 flex-1 sm:flex-none bg-primary hover:bg-primary/90">
                    <Search size={14} className="mr-1" /> Search
                  </Button>
                </div>
              </form>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <VehicleFilterButton onSelect={(vehicleQuery) => setQuery((prev) => prev.trim() ? `${vehicleQuery} ${prev.trim()}` : vehicleQuery)} />
                <div className="hidden sm:flex items-center gap-2">
                  {compareParts.length > 0 && (
                    <Button size="sm" variant="outline" className="rounded-lg gap-1.5 text-xs h-7" onClick={() => setShowCompare(true)}>
                      <Scale size={12} /> Compare ({compareParts.length})
                    </Button>
                  )}
                   {user && <SearchCounter limitData={searchLimit} />}
                </div>
              </div>
              {/* Mobile: centered search counter */}
              <div className="sm:hidden flex justify-center mt-1">
                {user && <SearchCounter limitData={searchLimit} />}
              </div>
            </div>
          ) : (
            <VehicleLookup onLookupStart={handleVehicleLookupStart} onVehicleFound={handleVehicleLookupSuccess} />
          )}
        </div>
      </div>
      <div className="container max-w-5xl flex-1 px-3 sm:px-4 py-4 sm:py-8">
        {activeQuery ? (
          <>
            {vehicleInfo && (
              <div className="mb-6 rounded-2xl bg-card border border-border/60 overflow-hidden shadow-lg animate-in fade-in slide-in-from-top-2 duration-300">
                {/* Header */}
                <div className="px-5 pt-5 pb-3 border-b border-border/40">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                        <Car size={22} className="text-primary" />
                      </div>
                      <div className="min-w-0">
                        {vehicleModelConfirmed && vehicleInfo.model ? (
                          <div className="flex items-center gap-2">
                            <h2 className="font-display font-bold text-xl text-foreground tracking-tight">
                              {vehicleInfo.make} {vehicleInfo.model}
                              {vehicleInfo.yearOfManufacture && <span className="text-muted-foreground font-medium ml-1.5">({vehicleInfo.yearOfManufacture})</span>}
                            </h2>
                            <button
                              onClick={() => { setVehicleModelInput(vehicleInfo.model || ""); setVehicleModelConfirmed(false); }}
                              className="p-1 rounded-md hover:bg-secondary transition-colors text-muted-foreground hover:text-primary"
                              title="Edit model"
                            >
                              <Pencil size={14} />
                            </button>
                          </div>
                        ) : (
                          <h2 className="font-display font-bold text-xl text-foreground tracking-tight">
                            {vehicleInfo.make}
                            {vehicleInfo.yearOfManufacture && <span className="text-muted-foreground font-medium ml-1.5">({vehicleInfo.yearOfManufacture})</span>}
                          </h2>
                        )}
                      </div>
                    </div>
                    {vehicleInfo.registrationNumber && (
                      <span className="bg-secondary text-foreground text-xs font-mono font-bold px-3 py-1.5 rounded-lg tracking-wider border border-border/50 shrink-0">
                        {vehicleInfo.registrationNumber}
                      </span>
                    )}
                  </div>
                </div>

                {/* Model input */}
                {!vehicleModelConfirmed && (
                  <div className="px-5 py-4 border-b border-border/40 bg-primary/[0.03]">
                    <p className="text-xs text-muted-foreground mb-2.5 font-medium">
                      Enter your vehicle model for more accurate parts search
                    </p>
                    <div className="flex items-center gap-2">
                      <Input
                        value={vehicleModelInput}
                        onChange={(e) => setVehicleModelInput(e.target.value)}
                        placeholder={getModelPlaceholder(vehicleInfo.make)}
                        className="bg-secondary border-border h-11 rounded-xl text-sm font-medium flex-1"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            if (vehicleModelInput.trim() && vehicleInfo) {
                              const model = vehicleModelInput.trim().toUpperCase();
                              const updated = { ...vehicleInfo, model };
                              setVehicleInfo(updated);
                              setVehicleModelConfirmed(true);
                              const nextQuery = `${updated.make} ${model} ${updated.yearOfManufacture || ""}`.trim();
                              setQuery(nextQuery);
                              setActiveQuery(nextQuery);
                              setCurrentPage(1);
                              setSearchParams({ q: nextQuery, vehicle: JSON.stringify(updated) });
                            }
                          }
                        }}
                        autoFocus
                      />
                      <Button
                        type="button"
                        onClick={() => {
                          if (vehicleModelInput.trim() && vehicleInfo) {
                            const model = vehicleModelInput.trim().toUpperCase();
                            const updated = { ...vehicleInfo, model };
                            setVehicleInfo(updated);
                            setVehicleModelConfirmed(true);
                            const nextQuery = `${updated.make} ${model} ${updated.yearOfManufacture || ""}`.trim();
                            setQuery(nextQuery);
                            setActiveQuery(nextQuery);
                            setCurrentPage(1);
                            setSearchParams({ q: nextQuery, vehicle: JSON.stringify(updated) });
                          }
                        }}
                        className="rounded-xl h-11 px-5 gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                        disabled={!vehicleModelInput.trim()}
                      >
                        <Check size={16} />
                        Confirm
                      </Button>
                    </div>
                  </div>
                )}

                {/* Details grid */}
                <div className="px-3 sm:px-5 py-2 sm:py-3 grid grid-cols-2 sm:grid-cols-3 gap-x-3 sm:gap-x-6 gap-y-0.5 sm:gap-y-1">
                  {vehicleInfo.yearOfManufacture && (
                    <div className="flex items-center gap-2.5 py-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><Calendar size={15} className="text-primary" /></div>
                      <div><p className="text-[11px] text-muted-foreground uppercase tracking-wider leading-none mb-0.5">Year</p><p className="text-sm font-semibold text-foreground">{vehicleInfo.yearOfManufacture}</p></div>
                    </div>
                  )}
                  {vehicleInfo.colour && (
                    <div className="flex items-center gap-2.5 py-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><Palette size={15} className="text-primary" /></div>
                      <div><p className="text-[11px] text-muted-foreground uppercase tracking-wider leading-none mb-0.5">Colour</p><p className="text-sm font-semibold text-foreground">{vehicleInfo.colour}</p></div>
                    </div>
                  )}
                  {vehicleInfo.fuelType && (
                    <div className="flex items-center gap-2.5 py-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><Fuel size={15} className="text-primary" /></div>
                      <div><p className="text-[11px] text-muted-foreground uppercase tracking-wider leading-none mb-0.5">Fuel</p><p className="text-sm font-semibold text-foreground">{vehicleInfo.fuelType}</p></div>
                    </div>
                  )}
                  {vehicleInfo.engineCapacity && (
                    <div className="flex items-center gap-2.5 py-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><Gauge size={15} className="text-primary" /></div>
                      <div><p className="text-[11px] text-muted-foreground uppercase tracking-wider leading-none mb-0.5">Engine</p><p className="text-sm font-semibold text-foreground">{vehicleInfo.engineCapacity}cc</p></div>
                    </div>
                  )}
                  {vehicleInfo.motStatus && (
                    <div className="flex items-center gap-2.5 py-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><ShieldCheck size={15} className="text-primary" /></div>
                      <div><p className="text-[11px] text-muted-foreground uppercase tracking-wider leading-none mb-0.5">MOT</p><p className={`text-sm font-semibold ${vehicleInfo.motStatus === "Valid" ? "text-emerald-400" : "text-destructive"}`}>{vehicleInfo.motStatus}</p></div>
                    </div>
                  )}
                  {vehicleInfo.taxStatus && (
                    <div className="flex items-center gap-2.5 py-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><Receipt size={15} className="text-primary" /></div>
                      <div><p className="text-[11px] text-muted-foreground uppercase tracking-wider leading-none mb-0.5">Tax</p><p className={`text-sm font-semibold ${vehicleInfo.taxStatus === "Taxed" ? "text-emerald-400" : "text-destructive"}`}>{vehicleInfo.taxStatus}</p></div>
                    </div>
                  )}
                </div>
              </div>
            )}
            <div className="mb-4 sm:mb-6">
              <div className="flex items-center gap-2 flex-wrap">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="rounded-xl gap-1.5 text-xs sm:text-sm h-9">
                      <FilterIcon size={14} />
                      Filter by Category
                      <ChevronDown size={14} />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[280px] sm:w-[340px] p-3" align="start">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Select a category</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {PART_CATEGORIES.map((cat) => (
                        <button
                          key={cat.label}
                          onClick={() => { handleCategorySelect(cat.label); }}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all text-left ${
                            selectedCategory === cat.label
                              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                              : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                          }`}
                        >
                          <span>{cat.icon}</span>
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
                {selectedCategory && (
                  <button
                    onClick={() => { setSelectedCategory(null); setCurrentPage(1); }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    {selectedCategory}
                    <XIcon size={12} />
                  </button>
                )}
              </div>
            </div>
            <div className="text-center mb-4 sm:mb-8">
              <h1 className="font-display text-xl sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2">
                {selectedCategory ? `${selectedCategory} for` : "Results for"}
              </h1>
              <p className="text-primary font-display text-lg sm:text-xl md:text-2xl font-semibold">"{activeQuery}"</p>
              {totalResults > 0 && !liveLoading && (
                <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2">
                  Showing {startItem.toLocaleString()}-{endItem.toLocaleString()} of {totalResults.toLocaleString()} eBay listings
                </p>
              )}
            </div>

            {liveLoading ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16 mb-8">
                <Loader2 size={32} className="animate-spin text-primary" />
                <span className="text-muted-foreground font-medium">Searching eBay Motors...</span>
                <span className="text-xs text-muted-foreground">Finding real listings with live prices</span>
              </div>
            ) : liveResults.length > 0 ? (
              <div className="mb-10">
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-5">
                  {(() => {
                    // Group items by extracted part-type keywords for fair price comparison
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
                      // Fallback: use first 2-3 significant words
                      const words = t.replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(w => w.length > 2 && !["for", "the", "and", "new", "fit", "fits", "with", "set"].includes(w));
                      return words.slice(0, 3).join(" ") || "unknown";
                    };

                    // Build groups and compute median per group
                    const groups: Record<string, number[]> = {};
                    for (const item of liveResults) {
                      if (item.price > 0) {
                        const type = extractPartType(item.title || "");
                        if (!groups[type]) groups[type] = [];
                        groups[type].push(item.price);
                      }
                    }

                    const medianOf = (arr: number[]) => {
                      const sorted = [...arr].sort((a, b) => a - b);
                      const mid = Math.floor(sorted.length / 2);
                      return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
                    };

                    const getFlag = (code: string) => countryFlags[code] || "🌍";

                    const getPriceBadge = (price: number, title: string) => {
                      const type = extractPartType(title || "");
                      const group = groups[type];
                      if (!group || group.length < 3) return null;
                      const median = medianOf(group);
                      if (median === 0) return null;
                      const ratio = price / median;
                      if (ratio <= 0.75) return { label: "Great Price", className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" };
                      if (ratio <= 0.90) return { label: "Good Price", className: "bg-sky-500/20 text-sky-400 border-sky-500/30" };
                      if (ratio >= 1.25) return { label: "High Price", className: "bg-red-500/20 text-red-400 border-red-500/30" };
                      return null;
                    };

                    return liveResults.map((item: any) => {
                      const priceBadge = getPriceBadge(item.price, item.title);
                      return (
                        <div key={item.id} className="group glass rounded-xl sm:rounded-2xl overflow-hidden hover:border-primary/30 card-hover flex flex-col relative">
                          <a href={item.url} target="_blank" rel="noopener noreferrer" className="block">
                            <div className="aspect-square sm:aspect-[4/3] bg-secondary/50 overflow-hidden relative">
                              <img
                                src={item.imageUrl}
                                alt={item.partName}
                                className="w-full h-full object-contain p-1 sm:p-3 img-zoom"
                                loading="lazy"
                                onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
                              />
                              <span className={`absolute top-1 left-1 sm:top-3 sm:left-3 text-[8px] sm:text-[10px] font-bold px-1 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg backdrop-blur-sm ${
                                item.condition === "New" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                  : item.condition === "Used" ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                  : "bg-secondary/80 text-muted-foreground border border-border"
                              }`}>
                                {item.condition}
                              </span>
                              {priceBadge && (
                                <span className={`absolute top-5 sm:top-10 left-1 sm:left-3 text-[8px] sm:text-[10px] font-bold px-1 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg border ${priceBadge.className}`}>
                                  {priceBadge.label}
                                </span>
                              )}
                              {item.topRatedSeller && (
                                <span className="absolute bottom-1 left-1 sm:bottom-3 sm:left-3 text-[8px] sm:text-[10px] font-bold px-1 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg bg-primary/90 text-primary-foreground flex items-center gap-0.5 sm:gap-1">
                                  <Shield size={8} className="sm:w-[10px] sm:h-[10px]" /> Top Rated
                                </span>
                              )}
                            </div>
                          </a>
                            <div className="p-2 sm:p-4 flex-1 flex flex-col min-w-0">
                            <a href={item.url} target="_blank" rel="noopener noreferrer" className="block mb-1.5 sm:mb-3">
                              <p className="text-[10px] sm:text-sm font-semibold line-clamp-2 group-hover:text-primary transition-colors leading-snug break-words">
                                {item.partName}
                              </p>
                            </a>
                            <div className="mt-auto space-y-1.5 sm:space-y-3">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-sm sm:text-2xl font-bold text-primary whitespace-nowrap">£{item.price.toFixed(2)}</span>
                              </div>
                              {/* Desktop-only details */}
                              <div className="hidden sm:block">
                                {item.quantityAvailable != null && item.quantityAvailable > 0 && item.quantityAvailable <= 5 && (
                                  <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-400">
                                    <AlertCircle size={11} /> Only {item.quantityAvailable} left
                                  </span>
                                )}
                                {item.quantityAvailable != null && item.quantityAvailable > 5 && (
                                  <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400">
                                    ✓ In stock
                                  </span>
                                )}
                                <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                                  {item.freeShipping ? (
                                    <span className="flex items-center gap-1 text-emerald-400 font-medium">
                                      <Truck size={12} /> Free P&P
                                    </span>
                                  ) : item.shippingCost > 0 ? (
                                    <span className="flex items-center gap-1">
                                      <Truck size={12} /> +£{item.shippingCost.toFixed(2)} P&P
                                    </span>
                                  ) : null}
                                  {item.expedited && (
                                    <span className="flex items-center gap-1 text-primary">
                                      <Zap size={11} /> Express
                                    </span>
                                  )}
                                  {item.handlingTime && (
                                    <span className="flex items-center gap-1">
                                      <Clock size={11} /> {item.handlingTime}d handling
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <MapPin size={11} />
                                  <span>{getFlag(item.itemCountry)} {item.itemLocation}</span>
                                  {item.shipsToUK && item.itemCountry !== "GB" && (
                                    <span className="text-emerald-400 font-medium">• Ships to UK</span>
                                  )}
                                </div>
                              </div>
                              {/* Seller rating - compact on mobile */}
                              <div className="flex items-center gap-1 text-[9px] sm:text-xs text-muted-foreground sm:border-t sm:border-border sm:pt-2.5 sm:mt-1">
                                <span className="flex items-center gap-0.5 text-amber-400">
                                  <Star size={8} className="sm:w-[10px] sm:h-[10px] fill-amber-400" />
                                  <span className="hidden sm:inline">{item.sellerPositivePercent.toFixed(0)}%</span>
                                  <span className="sm:hidden">{item.sellerPositivePercent.toFixed(0)}</span>
                                </span>
                                <span className="hidden sm:inline">
                                  <span className="font-medium truncate max-w-[120px]">{item.sellerUsername}</span>
                                  <span className="text-muted-foreground/60 ml-1">({item.sellerFeedbackScore})</span>
                                </span>
                                <div className="hidden sm:flex items-center gap-2 ml-auto">
                                  {item.watchCount > 0 && (
                                    <span className="flex items-center gap-1 text-muted-foreground/60">
                                      <Heart size={10} /> {item.watchCount}
                                    </span>
                                  )}
                                </div>
                              </div>
                              {/* Buttons */}
                              <div className="flex gap-1 sm:gap-2 pt-0.5 sm:pt-1">
                                <Button size="sm" className="flex-1 rounded-lg sm:rounded-xl gap-1 sm:gap-1.5 text-[9px] sm:text-xs h-7 sm:h-9 px-1.5 sm:px-3" asChild>
                                  <a href={item.url} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink size={10} className="sm:w-[13px] sm:h-[13px]" /> <span className="hidden sm:inline">View on eBay</span><span className="sm:hidden">View</span>
                                  </a>
                                </Button>
                                <button
                                  onClick={() => {
                                    const isSelected = compareParts.some((p) => p.id === item.id);
                                    if (isSelected) {
                                      setCompareParts((prev) => prev.filter((p) => p.id !== item.id));
                                    } else if (compareParts.length < 3) {
                                      setCompareParts((prev) => [...prev, {
                                        id: item.id,
                                        title: item.partName,
                                        price: item.price,
                                        condition: item.condition,
                                        sellerName: item.sellerUsername,
                                        sellerRating: item.sellerPositivePercent,
                                        freeShipping: item.freeShipping,
                                        shippingCost: item.shippingCost,
                                        location: item.itemLocation,
                                        url: item.url,
                                        imageUrl: item.imageUrl,
                                        source: "ebay" as const,
                                      }]);
                                    }
                                  }}
                                  className={`h-7 w-7 sm:h-9 sm:w-9 rounded-lg sm:rounded-xl border flex items-center justify-center transition-colors shrink-0 ${
                                    compareParts.some((p) => p.id === item.id)
                                      ? "border-primary bg-primary/20 text-primary"
                                      : "border-border bg-secondary hover:bg-secondary/80 text-muted-foreground"
                                  }`}
                                  title={compareParts.some((p) => p.id === item.id) ? "Remove from compare" : compareParts.length >= 3 ? "Max 3 items" : "Add to compare"}
                                  disabled={!compareParts.some((p) => p.id === item.id) && compareParts.length >= 3}
                                >
                                  <Scale size={10} className="sm:w-[14px] sm:h-[14px]" />
                                </button>
                                <button
                                  onClick={() => handleSave(item)}
                                  disabled={savingId === item.id}
                                  className="h-7 w-7 sm:h-9 sm:w-9 rounded-lg sm:rounded-xl border border-border bg-secondary hover:bg-secondary/80 flex items-center justify-center transition-colors shrink-0"
                                >
                                  {savingId === item.id ? (
                                    <Loader2 size={10} className="sm:w-[14px] sm:h-[14px] animate-spin text-muted-foreground" />
                                  ) : savedIds.has(item.partNumber) ? (
                                    <BookmarkCheck size={10} className="sm:w-[14px] sm:h-[14px] text-primary" />
                                  ) : (
                                    <Bookmark size={10} className="sm:w-[14px] sm:h-[14px] text-muted-foreground" />
                                  )}
                                </button>
                                <PriceAlertDialog supplierName="eBay Motors" partQuery={item.partName} supplierUrl={item.url} ebayItemId={item.id} currentPrice={item.price} />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>

                {/* Amazon UK Prominent Card */}
                {activeQuery && (
                  <div className="my-6 sm:my-8">
                    <a
                      href={`https://www.amazon.co.uk/s?k=${encodeURIComponent(activeQuery)}&tag=gopartara-21`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group block glass rounded-xl sm:rounded-2xl overflow-hidden hover:border-orange-500/40 transition-all border border-orange-500/20"
                    >
                      <div className="flex items-center gap-4 sm:gap-6 p-4 sm:p-6">
                        <div className="shrink-0 w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                          <span className="text-white font-bold text-lg sm:text-xl tracking-tight leading-none text-center">
                            <span className="italic">amazon</span>
                            <span className="block text-[10px] sm:text-xs font-semibold not-italic opacity-80">.co.uk</span>
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-medium text-orange-400 mb-0.5">Also available on</p>
                          <h3 className="font-display text-base sm:text-lg font-bold text-foreground mb-1 truncate">
                            Search "{activeQuery}" on Amazon UK
                          </h3>
                          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">
                            Compare prices with Amazon's car parts selection • Free Prime delivery available
                          </p>
                        </div>
                        <div className="shrink-0 hidden sm:block">
                          <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 text-white font-semibold text-sm shadow-lg shadow-orange-500/25 group-hover:shadow-orange-500/40 transition-shadow">
                            <ExternalLink size={14} />
                            Search Amazon
                          </span>
                        </div>
                        <div className="shrink-0 sm:hidden">
                          <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-amber-600 text-white font-semibold text-xs">
                            <ExternalLink size={12} />
                            Search
                          </span>
                        </div>
                      </div>
                    </a>
                  </div>
                )}

                {/* Parts Catalog Results */}
                {catalogLoading && (
                  <div className="flex items-center gap-2 py-4 justify-center text-muted-foreground">
                    <Loader2 size={16} className="animate-spin" />
                    <span className="text-sm">Searching parts catalog...</span>
                  </div>
                )}
                {catalogResults.length > 0 && (
                  <div className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-6 h-6 rounded-md bg-primary/15 flex items-center justify-center">
                        <Search size={14} className="text-primary" />
                      </div>
                      <h3 className="font-display text-base sm:text-lg font-bold">Parts Catalog</h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/15 text-primary border border-primary/20">
                        TecDoc Data
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {catalogResults.map((item: any) => (
                        <div key={item.id} className="glass rounded-xl p-4 hover:border-primary/30 transition-all flex flex-col gap-2">
                          <div className="flex items-start gap-3">
                            {item.imageUrl && (
                              <img src={item.imageUrl} alt={item.partName} className="w-14 h-14 rounded-lg object-contain bg-secondary/50 p-1 shrink-0" loading="lazy" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold line-clamp-2 text-foreground">{item.partName}</p>
                              {item.partNumber && (
                                <p className="text-xs text-muted-foreground mt-0.5 font-mono">#{item.partNumber}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-secondary text-muted-foreground">{item.brand}</span>
                            {item.category && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-secondary text-muted-foreground">{item.category}</span>
                            )}
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-primary/15 text-primary border border-primary/20">Parts Catalog</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Global Suppliers */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">🌍</span>
                    <h3 className="font-display text-base sm:text-lg font-bold">Global Suppliers</h3>
                    <span className="text-xs text-muted-foreground">International shipping available</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                    {globalSuppliers.map((gs) => (
                      <a
                        key={gs.name}
                        href={gs.buildUrl(activeQuery)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group glass rounded-xl overflow-hidden hover:border-primary/30 transition-all hover:scale-[1.02] flex flex-col"
                      >
                        <div className={`h-14 sm:h-16 bg-gradient-to-br ${gs.gradient} flex items-center justify-center px-2 relative`}>
                          <span className="text-white font-display font-bold text-xs sm:text-sm tracking-wide text-center leading-tight">
                            {gs.flag} {gs.name}
                          </span>
                          <span className="absolute top-1 right-1 px-1.5 py-0.5 rounded text-[8px] font-bold bg-white/20 text-white backdrop-blur-sm">
                            {gs.region}
                          </span>
                        </div>
                        <div className="p-2">
                          <span className="flex items-center justify-center gap-1 w-full rounded-lg text-xs h-7 bg-primary text-primary-foreground font-medium group-hover:bg-primary/90 transition-colors">
                            <ExternalLink size={11} /> Search
                          </span>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>

                {totalPages > 1 && (
                  <div className="flex flex-col items-center gap-2 sm:gap-3 mt-6 sm:mt-8">
                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                      Pages {chunkStart}-{chunkEnd} of {totalPages.toLocaleString()}
                    </p>
                    <div className="flex items-center gap-0.5 sm:gap-1 flex-wrap justify-center">
                      {currentChunk > 0 && (
                        <button
                          onClick={() => handlePageChange((currentChunk - 1) * PAGES_PER_CHUNK + 1)}
                          className="flex items-center gap-0.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-medium bg-secondary hover:bg-secondary/80 text-foreground transition-colors"
                        >
                          <ChevronLeft size={10} className="sm:w-3 sm:h-3" /> Prev 50
                        </button>
                      )}
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="flex items-center gap-0.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-secondary hover:bg-secondary/80 text-foreground"
                      >
                        <ChevronLeft size={12} className="sm:w-3.5 sm:h-3.5" /> Prev
                      </button>
                      {getPageNumbers().map((page, i) =>
                        page === "..." ? (
                          <span key={`ellipsis-${i}`} className="px-1 sm:px-2 py-1.5 sm:py-2 text-xs sm:text-sm text-muted-foreground">...</span>
                        ) : (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page as number)}
                            className={`min-w-[28px] sm:min-w-[36px] h-7 sm:h-9 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                              currentPage === page
                                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                                : "bg-secondary hover:bg-secondary/80 text-foreground"
                            }`}
                          >
                            {page}
                          </button>
                        )
                      )}
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="flex items-center gap-0.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-secondary hover:bg-secondary/80 text-foreground"
                      >
                        Next <ChevronRight size={12} className="sm:w-3.5 sm:h-3.5" />
                      </button>
                      {chunkEnd < totalPages && (
                        <button
                          onClick={() => handlePageChange((currentChunk + 1) * PAGES_PER_CHUNK + 1)}
                          className="flex items-center gap-0.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-medium bg-secondary hover:bg-secondary/80 text-foreground transition-colors"
                        >
                          Next 50 <ChevronRight size={10} className="sm:w-3 sm:h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : !liveLoading ? (
              <div className="flex flex-col items-center justify-center py-12 mb-8">
                <AlertCircle size={32} className="text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground font-medium">
                  {ebayFallback ? "eBay search temporarily unavailable" : "No eBay listings found"}
                </p>
                <p className="text-sm text-muted-foreground/60 mt-1">
                  {ebayFallback
                    ? "The service is experiencing high demand. Search suppliers directly below."
                    : "Try a different search term or browse suppliers below"}
                </p>
                {ebayFallback && (
                  <div className="mt-6 w-full max-w-lg">
                    <p className="text-xs text-muted-foreground mb-3 text-center font-medium">Quick search on supplier sites:</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {suppliers.slice(0, 6).map((s) => (
                        <a
                          key={s.name}
                          href={s.buildUrl(activeQuery)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-gradient-to-br ${s.gradient} text-white text-xs font-semibold transition-transform hover:scale-105 shadow-md`}
                        >
                          <ExternalLink size={12} />
                          {s.name}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}

            {/* Supplier Row */}
            <div className="mb-3 sm:mb-4 mt-2">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <ExternalLink size={16} className="sm:w-[18px] sm:h-[18px] text-muted-foreground" />
                <h2 className="font-display text-lg font-bold">Search More Suppliers</h2>
              </div>
            </div>
            <ScrollArea className="w-full pb-2 sm:pb-4">
              <div className="flex gap-2 sm:gap-3 pb-2">
                {suppliers.map((supplier) => (
                  <a
                    key={supplier.name}
                    href={supplier.buildUrl(activeQuery)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 w-[100px] sm:w-[140px] group glass rounded-lg sm:rounded-xl overflow-hidden hover:border-primary/30 transition-all hover:scale-[1.02] flex flex-col"
                  >
                    <div className={`h-12 sm:h-16 bg-gradient-to-br ${supplier.gradient} flex items-center justify-center px-1.5 sm:px-2`}>
                      <span className="text-white font-display font-bold text-[10px] sm:text-xs tracking-wide text-center leading-tight">
                        {supplier.flag} {supplier.name}
                      </span>
                    </div>
                    <div className="p-1.5 sm:p-2">
                      <span className="flex items-center justify-center gap-0.5 sm:gap-1 w-full rounded-md sm:rounded-lg text-[10px] sm:text-xs h-6 sm:h-7 bg-primary text-primary-foreground font-medium">
                        <ExternalLink size={11} /> Search
                      </span>
                    </div>
                  </a>
                ))}
                {matchedOemBrands.map((b) => {
                  const oemQuery = getOemSearchQuery(activeQuery, b.pattern);
                  return (
                    <a
                      key={b.brand}
                      href={b.url(oemQuery)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 w-[140px] group glass rounded-xl overflow-hidden transition-all hover:scale-[1.02] flex flex-col"
                    >
                      <div className={`h-16 bg-gradient-to-br ${b.gradient} flex items-center justify-center px-2`}>
                        <span className="text-white font-display font-bold text-xs tracking-wide text-center leading-tight">
                          {b.brand} OEM
                        </span>
                      </div>
                      <div className="p-2">
                        <span className="flex items-center justify-center gap-1 w-full rounded-lg text-xs h-7 bg-primary text-primary-foreground font-medium">
                          <ExternalLink size={11} /> Search
                        </span>
                      </div>
                    </a>
                  );
                })}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Search size={48} className="text-muted-foreground/20 mb-4" />
            <h2 className="font-display text-xl font-semibold mb-2">Search for car parts</h2>
            <p className="text-sm text-muted-foreground max-w-md">
              Enter a part name, number, or vehicle model above to compare prices across multiple suppliers.
            </p>
          </div>
        )}
      </div>
      <CompareBar
        items={compareParts}
        onOpen={() => setShowCompare(true)}
        onClear={() => setCompareParts([])}
      />
      {showCompare && (
        <CompareModal
          items={compareParts}
          onRemove={(id) => setCompareParts((prev) => prev.filter((p) => p.id !== id))}
          onClose={() => setShowCompare(false)}
        />
      )}
      <AuthGateModal
        open={authGateOpen}
        onOpenChange={setAuthGateOpen}
        title="Please sign in to search for car parts"
        description="Create a free account to search across 1,000,000+ parts from trusted UK & global suppliers."
      />
      <Footer />
    </div>
  );
};

export default SearchResults;
