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

const googleSite = (domain: string) => (q: string) =>
  `https://www.google.com/search?q=site:${domain}+${q.replace(/\s+/g, "+")}`;

type QualityTier = "oem" | "premium" | "budget";

const tierConfig: Record<QualityTier, { label: string; colors: string; tooltip: string }> = {
  oem: { label: "OEM", colors: "bg-amber-500/20 text-amber-400 border-amber-500/30", tooltip: "Original Equipment Manufacturer" },
  premium: { label: "Premium", colors: "bg-slate-300/15 text-slate-300 border-slate-400/30", tooltip: "Aftermarket Premium" },
  budget: { label: "Budget", colors: "bg-orange-700/20 text-orange-400 border-orange-600/30", tooltip: "Budget" },
};

const suppliers: { name: string; flag: string; gradient: string; tier: QualityTier; buildUrl: (q: string) => string }[] = [
  { name: "Euro Car Parts", flag: "🇬🇧", gradient: "from-blue-600 to-indigo-700", tier: "premium", buildUrl: googleSite("eurocarparts.com") },
  { name: "GSF Car Parts", flag: "🇬🇧", gradient: "from-emerald-600 to-teal-700", tier: "premium", buildUrl: googleSite("gsfcarparts.com") },
  { name: "Car Parts 4 Less", flag: "🇬🇧", gradient: "from-purple-600 to-purple-800", tier: "budget", buildUrl: googleSite("carparts4less.co.uk") },
  { name: "Halfords", flag: "🇬🇧", gradient: "from-sky-500 to-sky-700", tier: "premium", buildUrl: googleSite("halfords.com") },
  { name: "AutoDoc", flag: "🇬🇧", gradient: "from-cyan-500 to-blue-600", tier: "budget", buildUrl: googleSite("autodoc.co.uk") },
  { name: "Amazon UK", flag: "🇬🇧", gradient: "from-orange-500 to-amber-600", tier: "premium", buildUrl: (q) => `https://www.amazon.co.uk/s?k=${q.replace(/\s+/g, "+")}&tag=gopartara-21` },
  { name: "Partmaster", flag: "🇬🇧", gradient: "from-slate-600 to-slate-800", tier: "oem", buildUrl: googleSite("partmaster.co.uk") },
  { name: "LKQ Euro Car Parts", flag: "🇬🇧", gradient: "from-blue-500 to-blue-700", tier: "oem", buildUrl: googleSite("lkqeurocarparts.com") },
  { name: "RockAuto", flag: "🌍", gradient: "from-yellow-600 to-orange-700", tier: "premium", buildUrl: googleSite("rockauto.com") },
  { name: "PartsGeek", flag: "🌍", gradient: "from-red-600 to-red-800", tier: "budget", buildUrl: googleSite("partsgeek.com") },
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

const countryFlags: Record<string, string> = {
  GB: "🇬🇧", US: "🇺🇸", DE: "🇩🇪", CN: "🇨🇳", IT: "🇮🇹", FR: "🇫🇷", ES: "🇪🇸", PL: "🇵🇱", NL: "🇳🇱", JP: "🇯🇵", AU: "🇦🇺",
};

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

  useEffect(() => {
    if (urlQuery !== activeQuery) {
      setQuery(urlQuery);
      setActiveQuery(urlQuery);
      setSelectedCategory(null);
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
      return;
    }
    let cancelled = false;
    const fetchLive = async () => {
      setLiveLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke("search-parts", {
          body: { query: activeQuery, category: selectedCategory || undefined },
        });
        if (error) throw error;
        if (!cancelled) {
          setLiveResults(data?.results || []);
          setTotalResults(data?.totalResults || 0);
        }
      } catch (err) {
        console.error("Live search failed:", err);
        if (!cancelled) { setLiveResults([]); setTotalResults(0); }
      } finally {
        if (!cancelled) setLiveLoading(false);
      }
    };
    fetchLive();
    return () => { cancelled = true; };
  }, [activeQuery, selectedCategory]);

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
                <p className="text-sm text-muted-foreground mt-2">{liveResults.length} of {totalResults} eBay listings shown</p>
              )}
            </div>
            {/* Amazon UK Premium Card */}
            {activeQuery && (
              <div className="mb-8">
                <button
                  onClick={() => {
                    setAmazonPanelOpen(true);
                    setAmazonLoading(true);
                    setTimeout(() => setAmazonLoading(false), 2000);
                  }}
                  className="group w-full text-left glass rounded-2xl overflow-hidden border-2 border-orange-500/30 hover:border-orange-400/60 transition-all hover:shadow-lg hover:shadow-orange-500/10"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-4 sm:p-5 bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent">
                    <div className="shrink-0 bg-[#FF9900] rounded-xl px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-center shadow-lg shadow-orange-500/20">
                      <span className="text-base sm:text-xl font-bold text-white tracking-tight leading-none" style={{ fontFamily: 'system-ui, -apple-system, sans-serif', letterSpacing: '-0.02em' }}>amazon.com</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-display font-bold text-base sm:text-lg text-foreground">Amazon UK</h3>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 font-semibold border border-orange-500/30">🇬🇧 Prime</span>
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Search <span className="font-semibold text-foreground">"{activeQuery}"</span> on Amazon UK
                      </p>
                    </div>
                    <div className="shrink-0 rounded-xl h-10 sm:h-11 px-4 sm:px-6 bg-[#FF9900] hover:bg-[#e88b00] text-[#232F3E] font-bold gap-2 shadow-lg shadow-orange-500/20 border-0 inline-flex items-center justify-center text-xs sm:text-sm w-full sm:w-auto">
                      <Search size={14} />
                      Search on Amazon
                    </div>
                  </div>
                </button>
              </div>
            )}

            <Sheet open={amazonPanelOpen} onOpenChange={setAmazonPanelOpen}>
              <SheetContent side="right" className="w-full sm:max-w-md border-l border-orange-500/20 bg-background p-0">
                <div className="flex flex-col h-full">
                  <SheetHeader className="p-6 pb-4 border-b border-orange-500/20 bg-gradient-to-r from-orange-500/10 to-transparent">
                    <div className="flex items-center gap-3">
                      <div className="bg-[#FF9900] rounded-xl px-3 py-2 shadow-lg shadow-orange-500/20 flex items-center justify-center">
                        <span className="text-base font-bold text-white tracking-tight leading-none" style={{ fontFamily: 'system-ui, -apple-system, sans-serif', letterSpacing: '-0.02em' }}>amazon.com</span>
                      </div>
                      <SheetTitle className="text-foreground font-display text-xl">Amazon UK Results</SheetTitle>
                    </div>
                  </SheetHeader>

                  <div className="flex-1 flex flex-col items-center justify-center p-8 gap-6">
                    {amazonLoading ? (
                      <>
                        <div className="relative">
                          <div className="w-16 h-16 rounded-full border-4 border-orange-500/20 border-t-[#FF9900] animate-spin" />
                        </div>
                        <div className="text-center space-y-2">
                          <p className="text-lg font-semibold text-foreground">Searching Amazon...</p>
                          <p className="text-sm text-muted-foreground">
                            Finding <span className="font-semibold text-orange-400">"{activeQuery}"</span> on Amazon UK
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="bg-[#FF9900]/10 rounded-2xl p-6 w-full border border-orange-500/20">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="bg-[#FF9900] rounded-lg p-2 shadow-md shadow-orange-500/20">
                              <Search size={18} className="text-[#232F3E]" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Searching for</p>
                              <p className="font-bold text-foreground text-lg">{activeQuery}</p>
                            </div>
                          </div>
                          <div className="space-y-2 text-sm text-muted-foreground mb-5">
                            <div className="flex items-center gap-2">
                              <Zap size={14} className="text-orange-400" />
                              <span>Prime delivery available</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Shield size={14} className="text-orange-400" />
                              <span>Amazon buyer protection</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Star size={14} className="text-orange-400" />
                              <span>Verified seller ratings</span>
                            </div>
                          </div>
                          <a
                            href={`https://www.amazon.co.uk/s?k=${encodeURIComponent(activeQuery)}&tag=gopartara-21`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 w-full rounded-xl h-12 bg-[#FF9900] hover:bg-[#e88b00] text-[#232F3E] font-bold text-base shadow-lg shadow-orange-500/20 transition-colors"
                          >
                            <ExternalLink size={16} />
                            View Results on Amazon
                          </a>
                        </div>
                        <p className="text-xs text-muted-foreground text-center">
                          You'll be redirected to Amazon.co.uk to view live results
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            {liveLoading ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16 mb-8">
                <Loader2 size={32} className="animate-spin text-primary" />
                <span className="text-muted-foreground font-medium">Searching eBay Motors...</span>
                <span className="text-xs text-muted-foreground">Finding real listings with live prices</span>
              </div>
            ) : liveResults.length > 0 ? (
              <div className="mb-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {liveResults.map((item) => (
                    <div key={item.id} className="group glass rounded-2xl overflow-hidden hover:border-primary/30 transition-all flex flex-col relative">
                      <div className="absolute top-3 right-3 z-10 flex gap-1.5">
                        <button
                          onClick={() => handleSave(item)}
                          disabled={savingId === item.id}
                          className="p-2 rounded-lg bg-background/80 backdrop-blur-sm hover:bg-background transition-colors"
                        >
                          {savingId === item.id ? (
                            <Loader2 size={16} className="animate-spin text-muted-foreground" />
                          ) : savedIds.has(item.partNumber) ? (
                            <BookmarkCheck size={16} className="text-primary" />
                          ) : (
                            <Bookmark size={16} className="text-muted-foreground" />
                          )}
                        </button>
                      </div>
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
                            <span>{countryFlags[item.itemCountry] || "🌍"} {item.itemLocation}</span>
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
                            {item.watchCount > 0 && (
                              <span className="flex items-center gap-1 text-muted-foreground/60">
                                <Heart size={10} /> {item.watchCount}
                              </span>
                            )}
                          </div>
                          <div className="flex gap-2 pt-1">
                            <Button size="sm" className="flex-1 rounded-xl gap-1.5 text-xs h-9" asChild>
                              <a href={item.url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink size={13} /> View on eBay
                              </a>
                            </Button>
                            <PriceAlertDialog supplierName="eBay Motors" partQuery={item.partName} supplierUrl={item.url} />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : !liveLoading ? (
              <div className="flex flex-col items-center justify-center py-12 mb-8">
                <AlertCircle size={32} className="text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground font-medium">No eBay listings found</p>
                <p className="text-sm text-muted-foreground/60 mt-1">Try a different search term or browse suppliers below</p>
              </div>
            ) : null}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-4">
                <ExternalLink size={18} className="text-muted-foreground" />
                <h2 className="font-display text-lg font-bold">Search More Suppliers</h2>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {suppliers.map((supplier) => (
                <div key={supplier.name} className="group relative glass rounded-xl overflow-hidden hover:border-primary/30 transition-all hover:scale-[1.02]">
                  <a href={supplier.buildUrl(activeQuery)} target="_blank" rel="noopener noreferrer">
                    <div className={`h-14 bg-gradient-to-br ${supplier.gradient} flex items-center justify-center relative`}>
                      <span className="text-white font-display font-bold text-sm tracking-wide opacity-90 group-hover:opacity-100 transition-opacity text-center px-2">
                        {supplier.flag} {supplier.name}
                      </span>
                      <TooltipProvider delayDuration={200}>
                        <Tooltip>
                          <TooltipTrigger asChild onClick={(e) => e.preventDefault()}>
                            <span className={`absolute bottom-1 right-1 inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${tierConfig[supplier.tier].colors}`}>
                              <Shield size={8} />
                              {tierConfig[supplier.tier].label}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-[220px] text-xs">{tierConfig[supplier.tier].tooltip}</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </a>
                  <div className="p-2">
                    <Button size="sm" className="w-full rounded-lg gap-1 text-xs h-7" asChild>
                      <a href={supplier.buildUrl(activeQuery)} target="_blank" rel="noopener noreferrer">
                        <ExternalLink size={11} /> Search
                      </a>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
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
