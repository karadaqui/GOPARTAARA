import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search, ExternalLink, Loader2, Camera, Car, Shield, Scale, Star,
  Truck, Bookmark, BookmarkCheck, MapPin, Clock,
  Heart, AlertCircle, Zap, Filter as FilterIcon, ArrowUp,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import PriceAlertDialog from "@/components/PriceAlertDialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/AuthContext";
import VehicleLookup from "@/components/VehicleLookup";
import VehicleFilterButton from "@/components/VehicleFilterButton";
import SearchBarGarageDropdown from "@/components/SearchBarGarageDropdown";
import SearchCounter from "@/components/SearchCounter";
import PartsComparison, { type ComparePart } from "@/components/PartsComparison";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSearchLimit } from "@/hooks/useSearchLimit";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

const googleSite = (domain: string) => (q: string) =>
  `https://www.google.com/search?q=site:${domain}+${q.replace(/\s+/g, "+")}`;

const suppliers: { name: string; flag: string; gradient: string; buildUrl: (q: string) => string }[] = [
  { name: "Euro Car Parts", flag: "🇬🇧", gradient: "from-blue-600 to-indigo-700", buildUrl: googleSite("eurocarparts.com") },
  { name: "GSF Car Parts", flag: "🇬🇧", gradient: "from-emerald-600 to-teal-700", buildUrl: googleSite("gsfcarparts.com") },
  { name: "Car Parts 4 Less", flag: "🇬🇧", gradient: "from-purple-600 to-purple-800", buildUrl: googleSite("carparts4less.co.uk") },
  { name: "Halfords", flag: "🇬🇧", gradient: "from-sky-500 to-sky-700", buildUrl: googleSite("halfords.com") },
  { name: "AutoDoc", flag: "🇬🇧", gradient: "from-cyan-500 to-blue-600", buildUrl: googleSite("autodoc.co.uk") },
  { name: "Amazon UK", flag: "🇬🇧", gradient: "from-orange-500 to-amber-600", buildUrl: (q) => `https://www.amazon.co.uk/s?k=${q.replace(/\s+/g, "+")}&tag=gopartara-21` },
  { name: "Partmaster", flag: "🇬🇧", gradient: "from-slate-600 to-slate-800", buildUrl: googleSite("partmaster.co.uk") },
  { name: "LKQ Euro Car Parts", flag: "🇬🇧", gradient: "from-blue-500 to-blue-700", buildUrl: googleSite("lkqeurocarparts.com") },
  { name: "RockAuto", flag: "🌍", gradient: "from-yellow-600 to-orange-700", buildUrl: googleSite("rockauto.com") },
  { name: "PartsGeek", flag: "🌍", gradient: "from-red-600 to-red-800", buildUrl: googleSite("partsgeek.com") },
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

interface VehicleInfo {
  make: string;
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
  const { user } = useAuth();
  const { toast } = useToast();
  const searchLimit = useSearchLimit();
  const urlQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(urlQuery);
  const [activeQuery, setActiveQuery] = useState(urlQuery);
  const [identifying, setIdentifying] = useState(false);
  const [searchMode, setSearchMode] = useState<"text" | "reg">("text");
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [compareParts, setCompareParts] = useState<ComparePart[]>([]);
  const [showCompare, setShowCompare] = useState(false);
  
  const [liveResults, setLiveResults] = useState<any[]>([]);
  const [liveLoading, setLiveLoading] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [savingId, setSavingId] = useState<string | null>(null);
  const [vehicleInfo, setVehicleInfo] = useState<VehicleInfo | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [totalResults, setTotalResults] = useState(0);
  const [amazonPanelOpen, setAmazonPanelOpen] = useState(false);
  const [amazonLoading, setAmazonLoading] = useState(false);
  const [ebayFallback, setEbayFallback] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (urlQuery !== activeQuery) {
      setQuery(urlQuery);
      setActiveQuery(urlQuery);
      setSelectedCategory(null);
      setCurrentPage(1);
    }

    if (urlQuery) {
      setSearchMode("text");
    }
  }, [urlQuery, activeQuery]);

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
    let cancelled = false;
    const fetchLive = async () => {
      setLiveLoading(true);
      setEbayFallback(false);
      try {
        const offset = (currentPage - 1) * ITEMS_PER_PAGE;
        const { data, error } = await supabase.functions.invoke("search-parts", {
          body: { query: activeQuery, category: selectedCategory || undefined, offset },
        });
        if (error) throw error;
        if (!cancelled) {
          if (data?.fallback) {
            setEbayFallback(true);
            setLiveResults([]);
            setTotalResults(0);
          } else {
            setLiveResults(data?.results || []);
            setTotalResults(data?.totalResults || 0);
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
  }, [activeQuery, selectedCategory, currentPage]);

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
    const nextQuery = `${vehicle.make} ${vehicle.yearOfManufacture || ""}`.trim();

    setVehicleInfo(vehicle);
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
      supabase.from("search_history").insert({ user_id: user.id, query: nextQuery }).then(({ error }) => {
        if (error) console.error("Failed to save search history:", error);
      });
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    if (searchLimit.limitReached) {
      toast({ title: "Search limit reached", description: "Upgrade to Pro for unlimited searches.", variant: "destructive" });
      return;
    }
    const q = query.trim();
    setActiveQuery(q);
    setSelectedCategory(null);
    setCurrentPage(1);
    setSearchParams({ q });
    if (user) {
      supabase.from("search_history").insert({ user_id: user.id, query: q }).then(({ error }) => {
        if (error) console.error("Failed to save search history:", error);
      });
      searchLimit.refresh();
    }
  };

  const handleCategorySelect = (cat: string) => {
    setSelectedCategory(selectedCategory === cat ? null : cat);
    setCurrentPage(1);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
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

  const totalPages = Math.ceil(totalResults / ITEMS_PER_PAGE);
  const startItem = (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endItem = Math.min(currentPage * ITEMS_PER_PAGE, totalResults);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getPageNumbers = () => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  // Build combined supplier list (includes OEM brands + Amazon already in suppliers)
  const matchedOemBrands = activeQuery ? oemBrands.filter((b) => b.pattern.test(activeQuery)) : [];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="border-b border-border bg-card/40 backdrop-blur-lg sticky top-0 z-20 pt-16">
         <div className="container max-w-5xl py-4 px-4">
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
                  {searchLimit.limitReached ? (
                    <Button type="button" className="rounded-xl h-11 px-4 sm:px-6 flex-1 sm:flex-none" onClick={() => {
                      const el = document.getElementById("pricing");
                      if (el) el.scrollIntoView({ behavior: "smooth" });
                      else window.location.href = "/#pricing";
                    }}>
                      <ArrowUp size={14} className="mr-1" /> Upgrade
                    </Button>
                  ) : (
                    <Button type="submit" className="rounded-xl h-11 px-4 sm:px-6 flex-1 sm:flex-none">Search</Button>
                  )}
                </div>
              </form>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <VehicleFilterButton onSelect={(vehicleQuery) => setQuery((prev) => prev.trim() ? `${vehicleQuery} ${prev.trim()}` : vehicleQuery)} />
                <div className="flex items-center gap-2">
                  {compareParts.length > 0 && (
                    <Button size="sm" variant="outline" className="rounded-lg gap-1.5 text-xs h-7" onClick={() => setShowCompare(true)}>
                      <Scale size={12} /> Compare ({compareParts.length})
                    </Button>
                  )}
                  <SearchCounter limitData={searchLimit} />
                </div>
              </div>
            </div>
          ) : (
            <VehicleLookup onLookupStart={handleVehicleLookupStart} onVehicleFound={handleVehicleLookupSuccess} />
          )}
        </div>
      </div>
      <div className="container max-w-5xl flex-1 px-4 py-8">
        {activeQuery ? (
          <>
            {vehicleInfo && (
              <div className="mb-6 glass rounded-2xl p-5 border border-primary/20 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 rounded-xl p-3 shrink-0">
                    <Car size={28} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-display font-bold text-xl text-foreground">
                      {vehicleInfo.make} {vehicleInfo.yearOfManufacture && `(${vehicleInfo.yearOfManufacture})`}
                    </h2>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {vehicleInfo.colour && <span className="text-xs px-2.5 py-1 rounded-lg bg-secondary text-muted-foreground">{vehicleInfo.colour}</span>}
                      {vehicleInfo.fuelType && <span className="text-xs px-2.5 py-1 rounded-lg bg-secondary text-muted-foreground">⛽ {vehicleInfo.fuelType}</span>}
                      {vehicleInfo.engineCapacity && <span className="text-xs px-2.5 py-1 rounded-lg bg-secondary text-muted-foreground">⚙️ {vehicleInfo.engineCapacity}cc</span>}
                      {vehicleInfo.registrationNumber && <span className="text-xs px-2.5 py-1 rounded-lg bg-secondary font-mono font-bold text-muted-foreground">{vehicleInfo.registrationNumber}</span>}
                      {vehicleInfo.motStatus && (
                        <span className={`text-xs px-2.5 py-1 rounded-lg font-medium ${vehicleInfo.motStatus === "Valid" ? "bg-emerald-500/15 text-emerald-400" : "bg-destructive/15 text-destructive"}`}>
                          MOT: {vehicleInfo.motStatus}
                        </span>
                      )}
                      {vehicleInfo.taxStatus && (
                        <span className={`text-xs px-2.5 py-1 rounded-lg font-medium ${vehicleInfo.taxStatus === "Taxed" ? "bg-emerald-500/15 text-emerald-400" : "bg-destructive/15 text-destructive"}`}>
                          Tax: {vehicleInfo.taxStatus}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <FilterIcon size={14} className="text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Filter by category</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {PART_CATEGORIES.map((cat) => (
                  <button
                    key={cat.label}
                    onClick={() => handleCategorySelect(cat.label)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
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
            </div>
            <div className="text-center mb-8">
              <h1 className="font-display text-2xl sm:text-3xl font-bold mb-2">
                {selectedCategory ? `${selectedCategory} for` : "Results for"}
              </h1>
              <p className="text-primary font-display text-xl sm:text-2xl font-semibold">"{activeQuery}"</p>
              {totalResults > 0 && !liveLoading && (
                <p className="text-sm text-muted-foreground mt-2">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {(() => {
                    const prices = liveResults.map((r: any) => r.price).filter((p: number) => p > 0);
                    const avgPrice = prices.length > 0 ? prices.reduce((a: number, b: number) => a + b, 0) / prices.length : 0;

                    const getFlag = (code: string) => countryFlags[code] || "🌍";

                    const getPriceBadge = (price: number) => {
                      if (avgPrice === 0) return null;
                      const ratio = price / avgPrice;
                      if (ratio <= 0.75) return { label: "Great Price", className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" };
                      if (ratio <= 0.95) return { label: "Good Price", className: "bg-sky-500/20 text-sky-400 border-sky-500/30" };
                      if (ratio >= 1.25) return { label: "High Price", className: "bg-red-500/20 text-red-400 border-red-500/30" };
                      return null;
                    };

                    return liveResults.map((item: any) => {
                      const priceBadge = getPriceBadge(item.price);
                      return (
                        <div key={item.id} className="group glass rounded-2xl overflow-hidden hover:border-primary/30 transition-all flex flex-col relative">
                          <a href={item.url} target="_blank" rel="noopener noreferrer" className="block">
                            <div className="aspect-[4/3] bg-secondary/50 overflow-hidden relative">
                              <img
                                src={item.imageUrl}
                                alt={item.partName}
                                className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-300"
                                loading="lazy"
                                onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
                              />
                              <span className={`absolute top-3 left-3 text-[10px] font-bold px-2 py-1 rounded-lg backdrop-blur-sm ${
                                item.condition === "New" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                  : item.condition === "Used" ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                  : "bg-secondary/80 text-muted-foreground border border-border"
                              }`}>
                                {item.condition}
                              </span>
                              {priceBadge && (
                                <span className={`absolute top-10 left-3 text-[10px] font-bold px-2 py-1 rounded-lg border ${priceBadge.className}`}>
                                  {priceBadge.label}
                                </span>
                              )}
                              {item.topRatedSeller && (
                                <span className="absolute bottom-3 left-3 text-[10px] font-bold px-2 py-1 rounded-lg bg-primary/90 text-primary-foreground flex items-center gap-1">
                                  <Shield size={10} /> Top Rated
                                </span>
                              )}
                            </div>
                          </a>
                          <div className="p-4 flex-1 flex flex-col">
                            <a href={item.url} target="_blank" rel="noopener noreferrer" className="block mb-3">
                              <p className="text-sm font-semibold line-clamp-2 group-hover:text-primary transition-colors leading-snug">
                                {item.partName}
                              </p>
                            </a>
                            <div className="mt-auto space-y-3">
                              <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold text-primary">£{item.price.toFixed(2)}</span>
                              </div>
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
                              <div className="flex items-center justify-between text-xs border-t border-border pt-2.5 mt-1">
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                  <span className="font-medium truncate max-w-[120px]">{item.sellerUsername}</span>
                                  <span className="flex items-center gap-0.5 text-amber-400">
                                    <Star size={10} className="fill-amber-400" />
                                    {item.sellerPositivePercent.toFixed(0)}%
                                  </span>
                                  <span className="text-muted-foreground/60">({item.sellerFeedbackScore})</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {item.watchCount > 0 && (
                                    <span className="flex items-center gap-1 text-muted-foreground/60">
                                      <Heart size={10} /> {item.watchCount}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-2 pt-1">
                                <Button size="sm" className="flex-1 rounded-xl gap-1.5 text-xs h-9" asChild>
                                  <a href={item.url} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink size={13} /> View on eBay
                                  </a>
                                </Button>
                                <button
                                  onClick={() => handleSave(item)}
                                  disabled={savingId === item.id}
                                  className="h-9 w-9 rounded-xl border border-border bg-secondary hover:bg-secondary/80 flex items-center justify-center transition-colors shrink-0"
                                >
                                  {savingId === item.id ? (
                                    <Loader2 size={14} className="animate-spin text-muted-foreground" />
                                  ) : savedIds.has(item.partNumber) ? (
                                    <BookmarkCheck size={14} className="text-primary" />
                                  ) : (
                                    <Bookmark size={14} className="text-muted-foreground" />
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

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-1 mt-8">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-secondary hover:bg-secondary/80 text-foreground"
                    >
                      <ChevronLeft size={14} /> Previous
                    </button>
                    {getPageNumbers().map((page, i) =>
                      page === "..." ? (
                        <span key={`ellipsis-${i}`} className="px-2 py-2 text-sm text-muted-foreground">...</span>
                      ) : (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page as number)}
                          className={`min-w-[36px] h-9 rounded-lg text-sm font-medium transition-colors ${
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
                      className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-secondary hover:bg-secondary/80 text-foreground"
                    >
                      Next <ChevronRight size={14} />
                    </button>
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
            <div className="mb-4 mt-2">
              <div className="flex items-center gap-2 mb-4">
                <ExternalLink size={18} className="text-muted-foreground" />
                <h2 className="font-display text-lg font-bold">Search More Suppliers</h2>
              </div>
            </div>
            <ScrollArea className="w-full pb-4">
              <div className="flex gap-3 pb-2">
                {suppliers.map((supplier) => (
                  <a
                    key={supplier.name}
                    href={supplier.buildUrl(activeQuery)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 w-[140px] group glass rounded-xl overflow-hidden hover:border-primary/30 transition-all hover:scale-[1.02] flex flex-col"
                  >
                    <div className={`h-16 bg-gradient-to-br ${supplier.gradient} flex items-center justify-center px-2`}>
                      <span className="text-white font-display font-bold text-xs tracking-wide text-center leading-tight">
                        {supplier.flag} {supplier.name}
                      </span>
                    </div>
                    <div className="p-2">
                      <span className="flex items-center justify-center gap-1 w-full rounded-lg text-xs h-7 bg-primary text-primary-foreground font-medium">
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
      {showCompare && compareParts.length >= 2 && (
        <PartsComparison
          parts={compareParts}
          onRemove={(i) => setCompareParts((prev) => prev.filter((_, idx) => idx !== i))}
          onClose={() => setShowCompare(false)}
        />
      )}
      <Footer />
    </div>
  );
};

export default SearchResults;
