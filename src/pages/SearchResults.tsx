import { useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ExternalLink, Loader2, Camera, Car, Shield } from "lucide-react";
import PriceAlertDialog from "@/components/PriceAlertDialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/AuthContext";
import VehicleLookup from "@/components/VehicleLookup";
import VehicleFilterButton from "@/components/VehicleFilterButton";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const googleSite = (domain: string) => (q: string) =>
  `https://www.google.com/search?q=site:${domain}+${q.replace(/\s+/g, "+")}`;

type QualityTier = "oem" | "premium" | "budget";

const tierConfig: Record<QualityTier, { label: string; colors: string; tooltip: string }> = {
  oem: {
    label: "OEM",
    colors: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    tooltip: "Original Equipment Manufacturer — genuine parts made by or for the vehicle maker. Highest quality & fitment guarantee.",
  },
  premium: {
    label: "Premium",
    colors: "bg-slate-300/15 text-slate-300 border-slate-400/30",
    tooltip: "Aftermarket Premium — high-quality parts from reputable brands. Great balance of quality and value.",
  },
  budget: {
    label: "Budget",
    colors: "bg-orange-700/20 text-orange-400 border-orange-600/30",
    tooltip: "Budget — affordable parts for cost-conscious buyers. Quality varies; check reviews before purchasing.",
  },
};

const suppliers: { name: string; flag: string; gradient: string; tier: QualityTier; buildUrl: (q: string) => string }[] = [
  // 🇬🇧 UK Suppliers
  { name: "Euro Car Parts", flag: "🇬🇧", gradient: "from-blue-600 to-indigo-700", tier: "premium", buildUrl: googleSite("eurocarparts.com") },
  { name: "GSF Car Parts", flag: "🇬🇧", gradient: "from-emerald-600 to-teal-700", tier: "premium", buildUrl: googleSite("gsfcarparts.com") },
  { name: "Car Parts 4 Less", flag: "🇬🇧", gradient: "from-purple-600 to-purple-800", tier: "budget", buildUrl: googleSite("carparts4less.co.uk") },
  { name: "Halfords", flag: "🇬🇧", gradient: "from-sky-500 to-sky-700", tier: "premium", buildUrl: googleSite("halfords.com") },
  { name: "AutoDoc", flag: "🇬🇧", gradient: "from-cyan-500 to-blue-600", tier: "budget", buildUrl: googleSite("autodoc.co.uk") },
  { name: "eBay UK", flag: "🇬🇧", gradient: "from-red-500 to-yellow-500", tier: "budget", buildUrl: (q: string) => `https://www.ebay.co.uk/sch/i.html?_nkw=${q.replace(/\s+/g, "+")}&_sacat=9801&mkcid=1&mkrid=710-53481-19255-0&siteid=3&campid=5339148333&toolid=10001&mkevt=1` },
  { name: "Amazon UK", flag: "🇬🇧", gradient: "from-orange-500 to-amber-600", tier: "premium", buildUrl: (q: string) => `https://www.amazon.co.uk/s?k=${q.replace(/\s+/g, "+")}&tag=gopartara-21` },
  { name: "Partmaster", flag: "🇬🇧", gradient: "from-slate-600 to-slate-800", tier: "oem", buildUrl: googleSite("partmaster.co.uk") },
  { name: "LKQ Euro Car Parts", flag: "🇬🇧", gradient: "from-blue-500 to-blue-700", tier: "oem", buildUrl: googleSite("lkqeurocarparts.com") },
  { name: "First Line", flag: "🇬🇧", gradient: "from-green-600 to-green-800", tier: "premium", buildUrl: googleSite("firstline.co.uk") },
  // 🇪🇺 European Amazon
  { name: "Amazon Spain", flag: "🇪🇸", gradient: "from-red-600 to-yellow-500", tier: "premium", buildUrl: (q: string) => `https://www.amazon.es/s?k=${q.replace(/\s+/g, "+")}&tag=gopartara06-21` },
  { name: "Amazon France", flag: "🇫🇷", gradient: "from-blue-600 to-red-500", tier: "premium", buildUrl: (q: string) => `https://www.amazon.fr/s?k=${q.replace(/\s+/g, "+")}&tag=gopartara00-21` },
  { name: "Amazon Germany", flag: "🇩🇪", gradient: "from-gray-800 to-yellow-500", tier: "premium", buildUrl: (q: string) => `https://www.amazon.de/s?k=${q.replace(/\s+/g, "+")}&tag=gopartara0c0-21` },
  { name: "Amazon Italy", flag: "🇮🇹", gradient: "from-green-600 to-red-500", tier: "premium", buildUrl: (q: string) => `https://www.amazon.it/s?k=${q.replace(/\s+/g, "+")}&tag=gopartara07-21` },
  // 🌍 International
  { name: "RockAuto", flag: "🌍", gradient: "from-yellow-600 to-orange-700", tier: "premium", buildUrl: googleSite("rockauto.com") },
  { name: "PartsGeek", flag: "🌍", gradient: "from-red-600 to-red-800", tier: "budget", buildUrl: googleSite("partsgeek.com") },
  { name: "CARiD", flag: "🌍", gradient: "from-indigo-500 to-violet-700", tier: "oem", buildUrl: googleSite("carid.com") },
  { name: "Advance Auto Parts", flag: "🌍", gradient: "from-red-700 to-rose-900", tier: "premium", buildUrl: googleSite("advanceautoparts.com") },
  { name: "AutoZone", flag: "🌍", gradient: "from-amber-600 to-red-600", tier: "budget", buildUrl: googleSite("autozone.com") },
];

const SearchResults = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();

  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const [activeQuery, setActiveQuery] = useState(initialQuery);
  const [identifying, setIdentifying] = useState(false);
  const [searchMode, setSearchMode] = useState<"text" | "reg">(initialQuery ? "text" : "text");
  const photoInputRef = useRef<HTMLInputElement>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    const q = query.trim();
    setActiveQuery(q);
    setSearchParams({ q });

    // Save to search history if user is logged in
    if (user) {
      supabase.from("search_history").insert({
        user_id: user.id,
        query: q,
      }).then(({ error }) => {
        if (error) console.error("Failed to save search history:", error);
      });
    }
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
      const { data, error } = await supabase.functions.invoke("identify-part", {
        body: { image: base64 },
      });
      if (error) throw error;
      const partName = data?.partName || "Unknown car part";
      if (partName === "Unknown car part" || data?.confidence === "low") {
        toast({ title: "Part not recognized", description: data?.details || "Try a clearer photo.", variant: "destructive" });
        return;
      }
      toast({ title: `Identified: ${partName}`, description: "Choose a supplier to search." });
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      {/* Search bar */}
      <div className="border-b border-border bg-card/40 backdrop-blur-lg sticky top-0 z-20 pt-16">
        <div className="container max-w-4xl py-4 px-4">
          {/* Mode tabs */}
          <div className="flex gap-1 mb-3">
            <button
              onClick={() => setSearchMode("text")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                searchMode === "text"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              <Search size={14} /> Part Search
            </button>
            <button
              onClick={() => setSearchMode("reg")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                searchMode === "reg"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              <Car size={14} /> Reg Plate Lookup
            </button>
          </div>

          {searchMode === "text" ? (
            <div className="space-y-2">
              <form onSubmit={handleSearch} className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search car parts... e.g. Volvo XC60 right mirror"
                    className="pl-10 bg-secondary border-border h-11 rounded-xl"
                  />
                </div>
              <label className={`cursor-pointer shrink-0 ${identifying ? "pointer-events-none opacity-60" : ""}`}>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoUpload}
                  disabled={identifying}
                />
                <div className="flex items-center gap-1.5 px-3 h-11 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors text-sm text-secondary-foreground">
                  {identifying ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
                  <span className="hidden sm:inline">{identifying ? "Identifying..." : "Photo"}</span>
                </div>
              </label>
              <Button type="submit" className="rounded-xl h-11 px-6">
                Search
              </Button>
            </form>
          ) : (
            <VehicleLookup />
          )}
        </div>
      </div>

      <div className="container max-w-4xl flex-1 px-4 py-8">
        {activeQuery ? (
          <>
            <div className="text-center mb-8">
              <h1 className="font-display text-2xl sm:text-3xl font-bold mb-2">
                Search results for
              </h1>
              <p className="text-primary font-display text-xl sm:text-2xl font-semibold">
                "{activeQuery}"
              </p>
              <p className="text-sm text-muted-foreground mt-3">
                Click any supplier below to search their site directly
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {suppliers.map((supplier) => (
                <a
                  key={supplier.name}
                  href={supplier.buildUrl(activeQuery)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative glass rounded-xl overflow-hidden hover:border-primary/30 transition-all hover:scale-[1.02]"
                >
                  <PriceAlertDialog
                    supplierName={supplier.name}
                    partQuery={activeQuery}
                    supplierUrl={supplier.buildUrl(activeQuery)}
                  />
                  <div className={`h-16 bg-gradient-to-br ${supplier.gradient} flex items-center justify-center relative`}>
                    <span className="text-white font-display font-bold text-lg tracking-wide opacity-90 group-hover:opacity-100 transition-opacity">
                      {supplier.flag} {supplier.name}
                    </span>
                    <TooltipProvider delayDuration={200}>
                      <Tooltip>
                        <TooltipTrigger asChild onClick={(e) => e.preventDefault()}>
                          <span className={`absolute bottom-1.5 right-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${tierConfig[supplier.tier].colors}`}>
                            <Shield size={9} />
                            {tierConfig[supplier.tier].label}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[220px] text-xs">
                          {tierConfig[supplier.tier].tooltip}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="p-3 flex justify-center">
                    <Button size="sm" className="w-full rounded-lg gap-1.5 text-xs h-8" asChild>
                      <span>
                        <ExternalLink size={13} />
                        Search Now
                      </span>
                    </Button>
                  </div>
                </a>
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

      <Footer />
    </div>
  );
};

export default SearchResults;
