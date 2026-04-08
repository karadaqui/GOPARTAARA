import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search, ExternalLink, Loader2, Camera, Car, Shield, Scale, Star,
  Truck, Bookmark, BookmarkCheck, MapPin, Clock,
  Heart, AlertCircle, Zap, Filter as FilterIcon,
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
    const q = query.trim();
    setActiveQuery(q);
    setSelectedCategory(null);
    setSearchParams({ q });
    if (user) {
      supabase.from("search_history").insert({ user_id: user.id, query: q }).then(({ error }) => {
        if (error) console.error("Failed to save search history:", error);
      });
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
              <Car size={14} /> Reg Plate Lookup
            </button>
          </div>
          {searchMode === "text" ? (
            <div className="space-y-2">
              <form onSubmit={handleSearch} className="flex items-center gap-2">
                <div className="flex-1 relative flex items-center">
                  <SearchBarGarageDropdown onSelect={(vq) => setQuery((prev) => prev.trim() ? `${vq} ${prev.trim()}` : vq)} />
                  <Search size={18} className="absolute left-8 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search car parts..." className="pl-14 bg-secondary border-border h-11 rounded-xl" />
                </div>
                <label className={`cursor-pointer shrink-0 ${identifying ? "pointer-events-none opacity-60" : ""}`}>
                  <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={identifying} />
                  <div className="flex items-center gap-1.5 px-3 h-11 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors text-sm text-secondary-foreground">
                    {identifying ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
                    <span className="hidden sm:inline">{identifying ? "Identifying..." : "Photo"}</span>
                  </div>
                </label>
                <Button type="submit" className="rounded-xl h-11 px-6">Search</Button>
              </form>
              <div className="flex items-center justify-between">
                <VehicleFilterButton onSelect={(vehicleQuery) => setQuery((prev) => prev.trim() ? `${vehicleQuery} ${prev.trim()}` : vehicleQuery)} />
                <div className="flex items-center gap-2">
                  {compareParts.length > 0 && (
                    <Button size="sm" variant="outline" className="rounded-lg gap-1.5 text-xs h-7" onClick={() => setShowCompare(true)}>
                      <Scale size={12} /> Compare ({compareParts.length})
                    </Button>
                  )}
                  <SearchCounter />
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
                  <div className="flex items-center gap-4 p-5 bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent">
                    <div className="shrink-0 bg-[#FF9900] rounded-xl p-3 flex items-center justify-center shadow-lg shadow-orange-500/20">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 603 182" className="w-20 h-6" fill="#232F3E">
                        <path d="M374.00 98.19c-27.10 20.03-66.36 30.68-100.21 30.68c-47.43 0-90.14-17.54-122.42-46.72c-2.54-2.29-0.26-5.42 2.78-3.64c34.87 20.28 78.01 32.50 122.56 32.50c30.05 0 63.10-6.23 93.52-19.13c4.59-1.95 8.44 3.02 3.77 6.31z" />
                        <path d="M384.53 86.05c-3.46-4.44-22.93-2.10-31.66-1.06c-2.66 0.32-3.07-2.00-0.67-3.67c15.50-10.90 40.92-7.76 43.89-4.10c2.97 3.68-0.78 29.18-15.33 41.35c-2.24 1.87-4.37 0.88-3.38-1.60c3.28-8.18 10.61-26.50 7.15-30.92z" />
                        <path d="M353.53 14.13V4.42c0-1.47 1.12-2.46 2.46-2.46h43.55c1.40 0 2.52 1.01 2.52 2.46v8.31c-0.01 1.39-1.20 3.21-3.29 6.08l-22.56 32.21c8.38-0.20 17.23 1.05 24.83 5.34c1.71 0.97 2.18 2.39 2.31 3.79v10.34c0 1.42-1.56 3.08-3.20 2.22c-13.38-7.01-31.14-7.77-45.93 0.08c-1.51 0.81-3.09-0.82-3.09-2.24V60.81c0-1.59 0.02-4.29 1.62-6.70l26.13-37.46h-22.74c-1.40 0-2.52-0.99-2.52-2.39l-0.09-0.13z" />
                        <path d="M127.42 73.00h-13.24c-1.27-0.09-2.27-1.03-2.36-2.24V4.56c0-1.35 1.14-2.43 2.55-2.43h12.34c1.29 0.06 2.32 1.03 2.41 2.27v9.09h0.25c3.23-8.74 9.30-12.81 17.48-12.81c8.35 0 13.57 4.07 17.31 12.81c3.22-8.74 10.54-12.81 18.37-12.81c5.57 0 11.66 2.30 15.38 7.46c4.22 5.73 3.36 14.06 3.36 21.36l-0.02 40.94c0 1.35-1.14 2.45-2.55 2.45h-13.22c-1.32-0.10-2.38-1.15-2.38-2.45V36.92c0-2.87 0.25-10.03-0.37-12.74c-0.99-4.55-3.97-5.83-7.82-5.83c-3.22 0-6.59 2.15-7.96 5.59c-1.37 3.44-1.24 9.19-1.24 12.98v33.51c0 1.35-1.14 2.45-2.55 2.45h-13.22c-1.33-0.10-2.38-1.15-2.38-2.45l-0.02-33.51c0-7.59 1.24-18.77-8.19-18.77c-9.56 0-9.19 10.89-9.19 18.77v33.51c0 1.35-1.14 2.45-2.55 2.45l0.01 0.12z" />
                        <path d="M270.68 0.68c19.64 0 30.26 16.87 30.26 38.31c0 20.72-11.73 37.16-30.26 37.16c-19.26 0-29.76-16.87-29.76-37.87c0-21.15 10.62-37.60 29.76-37.60zm0.11 13.87c-9.74 0-10.35 13.27-10.35 21.55c0 8.30-0.12 26.01 10.24 26.01c10.23 0 10.72-14.29 10.72-22.99c0-5.73-0.25-12.58-1.99-18.02c-1.49-4.72-4.46-6.55-8.62-6.55z" />
                        <path d="M322.65 73.00h-13.18c-1.33-0.10-2.38-1.15-2.38-2.45l-0.02-66.25c0.11-1.23 1.20-2.18 2.55-2.18h12.27c1.16 0.05 2.12 0.85 2.38 1.91v10.13h0.25c3.72-9.11 8.93-13.48 18.12-13.48c5.95 0 11.78 2.15 15.51 8.02c3.47 5.44 3.47 14.58 3.47 21.15v41.02c-0.15 1.16-1.22 2.09-2.55 2.09h-13.30c-1.23-0.08-2.23-0.99-2.34-2.09V35.63c0-7.44 0.87-18.34-8.31-18.34c-3.23 0-6.20 2.16-7.69 5.44c-1.87 4.15-2.11 8.30-2.11 12.90v34.93c-0.01 1.35-1.17 2.45-2.57 2.45h-0.10z" />
                        <path d="M83.55 42.25c0 5.16 0.13 9.47-2.48 14.06c-2.11 3.73-5.46 6.02-9.18 6.02c-5.09 0-8.07-3.88-8.07-9.61c0-11.31 10.13-13.36 19.73-13.36v2.89zm13.38 32.35c-0.88 0.78-2.15 0.84-3.14 0.31c-4.42-3.67-5.21-5.37-7.63-8.87c-7.29 7.44-12.47 9.66-21.90 9.66c-11.19 0-19.89-6.90-19.89-20.72c0-10.79 5.84-18.13 14.15-21.72c7.21-3.18 17.27-3.74 24.97-4.62v-1.72c0-3.16 0.25-6.90-1.61-9.63c-1.62-2.44-4.72-3.45-7.46-3.45c-5.07 0-9.58 2.60-10.69 7.99c-0.23 1.20-1.10 2.38-2.30 2.44l-12.86-1.38c-1.08-0.24-2.28-1.11-1.97-2.76C50.58 4.46 68.86 0 81.28 0h0.53c6.35 0 14.64 1.69 19.64 6.50c6.35 6.03 5.74 14.08 5.74 22.84v20.69c0 6.22 2.58 8.95 5.01 12.31c0.85 1.20 1.04 2.64-0.04 3.53c-2.70 2.26-7.50 6.45-10.14 8.80l-5.09-0.07z" />
                        <path d="M24.40 42.25c0 5.16 0.13 9.47-2.48 14.06c-2.11 3.73-5.45 6.02-9.17 6.02c-5.09 0-8.08-3.88-8.08-9.61c0-11.31 10.13-13.36 19.73-13.36v2.89zm13.38 32.35c-0.88 0.78-2.15 0.84-3.14 0.31c-4.42-3.67-5.21-5.37-7.63-8.87c-7.29 7.44-12.47 9.66-21.90 9.66C-6.08 75.70-14.78 68.80-14.78 54.98c0-10.79 5.84-18.13 14.15-21.72c7.21-3.18 17.27-3.74 24.97-4.62v-1.72c0-3.16 0.25-6.90-1.61-9.63c-1.62-2.44-4.72-3.45-7.46-3.45c-5.07 0-9.58 2.60-10.69 7.99c-0.23 1.20-1.10 2.38-2.30 2.44L-10.58 22.89c-1.08-0.24-2.28-1.11-1.97-2.76C-8.70 4.46 9.58 0 22.00 0h0.53c6.35 0 14.64 1.69 19.64 6.50c6.35 6.03 5.74 14.08 5.74 22.84v20.69c0 6.22 2.58 8.95 5.01 12.31c0.85 1.20 1.04 2.64-0.04 3.53c-2.70 2.26-7.50 6.45-10.14 8.80l-5.09-0.07v-10.00z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-display font-bold text-lg text-foreground">Amazon UK</h3>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 font-semibold border border-orange-500/30">🇬🇧 Prime Available</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Search <span className="font-semibold text-foreground">"{activeQuery}"</span> on Amazon UK — fast delivery, buyer protection & millions of parts
                      </p>
                    </div>
                    <div className="shrink-0 rounded-xl h-11 px-6 bg-[#FF9900] hover:bg-[#e88b00] text-[#232F3E] font-bold gap-2 shadow-lg shadow-orange-500/20 border-0 inline-flex items-center justify-center text-sm">
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
                      <div className="bg-[#FF9900] rounded-xl p-2.5 shadow-lg shadow-orange-500/20 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 603 182" className="w-16 h-5" fill="#232F3E">
                          <path d="M374.00 98.19c-27.10 20.03-66.36 30.68-100.21 30.68c-47.43 0-90.14-17.54-122.42-46.72c-2.54-2.29-0.26-5.42 2.78-3.64c34.87 20.28 78.01 32.50 122.56 32.50c30.05 0 63.10-6.23 93.52-19.13c4.59-1.95 8.44 3.02 3.77 6.31z" />
                          <path d="M384.53 86.05c-3.46-4.44-22.93-2.10-31.66-1.06c-2.66 0.32-3.07-2.00-0.67-3.67c15.50-10.90 40.92-7.76 43.89-4.10c2.97 3.68-0.78 29.18-15.33 41.35c-2.24 1.87-4.37 0.88-3.38-1.60c3.28-8.18 10.61-26.50 7.15-30.92z" />
                          <path d="M353.53 14.13V4.42c0-1.47 1.12-2.46 2.46-2.46h43.55c1.40 0 2.52 1.01 2.52 2.46v8.31c-0.01 1.39-1.20 3.21-3.29 6.08l-22.56 32.21c8.38-0.20 17.23 1.05 24.83 5.34c1.71 0.97 2.18 2.39 2.31 3.79v10.34c0 1.42-1.56 3.08-3.20 2.22c-13.38-7.01-31.14-7.77-45.93 0.08c-1.51 0.81-3.09-0.82-3.09-2.24V60.81c0-1.59 0.02-4.29 1.62-6.70l26.13-37.46h-22.74c-1.40 0-2.52-0.99-2.52-2.39l-0.09-0.13z" />
                          <path d="M127.42 73.00h-13.24c-1.27-0.09-2.27-1.03-2.36-2.24V4.56c0-1.35 1.14-2.43 2.55-2.43h12.34c1.29 0.06 2.32 1.03 2.41 2.27v9.09h0.25c3.23-8.74 9.30-12.81 17.48-12.81c8.35 0 13.57 4.07 17.31 12.81c3.22-8.74 10.54-12.81 18.37-12.81c5.57 0 11.66 2.30 15.38 7.46c4.22 5.73 3.36 14.06 3.36 21.36l-0.02 40.94c0 1.35-1.14 2.45-2.55 2.45h-13.22c-1.32-0.10-2.38-1.15-2.38-2.45V36.92c0-2.87 0.25-10.03-0.37-12.74c-0.99-4.55-3.97-5.83-7.82-5.83c-3.22 0-6.59 2.15-7.96 5.59c-1.37 3.44-1.24 9.19-1.24 12.98v33.51c0 1.35-1.14 2.45-2.55 2.45h-13.22c-1.33-0.10-2.38-1.15-2.38-2.45l-0.02-33.51c0-7.59 1.24-18.77-8.19-18.77c-9.56 0-9.19 10.89-9.19 18.77v33.51c0 1.35-1.14 2.45-2.55 2.45l0.01 0.12z" />
                          <path d="M270.68 0.68c19.64 0 30.26 16.87 30.26 38.31c0 20.72-11.73 37.16-30.26 37.16c-19.26 0-29.76-16.87-29.76-37.87c0-21.15 10.62-37.60 29.76-37.60zm0.11 13.87c-9.74 0-10.35 13.27-10.35 21.55c0 8.30-0.12 26.01 10.24 26.01c10.23 0 10.72-14.29 10.72-22.99c0-5.73-0.25-12.58-1.99-18.02c-1.49-4.72-4.46-6.55-8.62-6.55z" />
                          <path d="M322.65 73.00h-13.18c-1.33-0.10-2.38-1.15-2.38-2.45l-0.02-66.25c0.11-1.23 1.20-2.18 2.55-2.18h12.27c1.16 0.05 2.12 0.85 2.38 1.91v10.13h0.25c3.72-9.11 8.93-13.48 18.12-13.48c5.95 0 11.78 2.15 15.51 8.02c3.47 5.44 3.47 14.58 3.47 21.15v41.02c-0.15 1.16-1.22 2.09-2.55 2.09h-13.30c-1.23-0.08-2.23-0.99-2.34-2.09V35.63c0-7.44 0.87-18.34-8.31-18.34c-3.23 0-6.20 2.16-7.69 5.44c-1.87 4.15-2.11 8.30-2.11 12.90v34.93c-0.01 1.35-1.17 2.45-2.57 2.45h-0.10z" />
                          <path d="M83.55 42.25c0 5.16 0.13 9.47-2.48 14.06c-2.11 3.73-5.46 6.02-9.18 6.02c-5.09 0-8.07-3.88-8.07-9.61c0-11.31 10.13-13.36 19.73-13.36v2.89zm13.38 32.35c-0.88 0.78-2.15 0.84-3.14 0.31c-4.42-3.67-5.21-5.37-7.63-8.87c-7.29 7.44-12.47 9.66-21.90 9.66c-11.19 0-19.89-6.90-19.89-20.72c0-10.79 5.84-18.13 14.15-21.72c7.21-3.18 17.27-3.74 24.97-4.62v-1.72c0-3.16 0.25-6.90-1.61-9.63c-1.62-2.44-4.72-3.45-7.46-3.45c-5.07 0-9.58 2.60-10.69 7.99c-0.23 1.20-1.10 2.38-2.30 2.44l-12.86-1.38c-1.08-0.24-2.28-1.11-1.97-2.76C50.58 4.46 68.86 0 81.28 0h0.53c6.35 0 14.64 1.69 19.64 6.50c6.35 6.03 5.74 14.08 5.74 22.84v20.69c0 6.22 2.58 8.95 5.01 12.31c0.85 1.20 1.04 2.64-0.04 3.53c-2.70 2.26-7.50 6.45-10.14 8.80l-5.09-0.07z" />
                        </svg>
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
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
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
