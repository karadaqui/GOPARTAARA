import { useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ExternalLink, Loader2, Camera } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const googleSite = (domain: string) => (q: string) =>
  `https://www.google.com/search?q=site:${domain}+${q.replace(/\s+/g, "+")}`;

const suppliers = [
  // 🇬🇧 UK Suppliers
  { name: "Euro Car Parts", flag: "🇬🇧", gradient: "from-blue-600 to-indigo-700", buildUrl: googleSite("eurocarparts.com") },
  { name: "GSF Car Parts", flag: "🇬🇧", gradient: "from-emerald-600 to-teal-700", buildUrl: googleSite("gsfcarparts.com") },
  { name: "Car Parts 4 Less", flag: "🇬🇧", gradient: "from-purple-600 to-purple-800", buildUrl: googleSite("carparts4less.co.uk") },
  { name: "Halfords", flag: "🇬🇧", gradient: "from-sky-500 to-sky-700", buildUrl: googleSite("halfords.com") },
  { name: "AutoDoc", flag: "🇬🇧", gradient: "from-cyan-500 to-blue-600", buildUrl: googleSite("autodoc.co.uk") },
  { name: "eBay UK", flag: "🇬🇧", gradient: "from-red-500 to-yellow-500", buildUrl: (q: string) => `https://www.ebay.co.uk/sch/i.html?_nkw=${q.replace(/\s+/g, "+")}&_sacat=9801&mkcid=1&mkrid=710-53481-19255-0&siteid=3&campid=5339148333&toolid=10001&mkevt=1` },
  { name: "Amazon UK", flag: "🇬🇧", gradient: "from-orange-500 to-amber-600", buildUrl: (q: string) => `https://www.amazon.co.uk/s?k=${q.replace(/\s+/g, "+")}` },
  { name: "Partmaster", flag: "🇬🇧", gradient: "from-slate-600 to-slate-800", buildUrl: googleSite("partmaster.co.uk") },
  { name: "LKQ Euro Car Parts", flag: "🇬🇧", gradient: "from-blue-500 to-blue-700", buildUrl: googleSite("lkqeurocarparts.com") },
  { name: "First Line", flag: "🇬🇧", gradient: "from-green-600 to-green-800", buildUrl: googleSite("firstline.co.uk") },
  // 🌍 International
  { name: "RockAuto", flag: "🌍", gradient: "from-yellow-600 to-orange-700", buildUrl: googleSite("rockauto.com") },
  { name: "PartsGeek", flag: "🌍", gradient: "from-red-600 to-red-800", buildUrl: googleSite("partsgeek.com") },
  { name: "CARiD", flag: "🌍", gradient: "from-indigo-500 to-violet-700", buildUrl: googleSite("carid.com") },
  { name: "Advance Auto Parts", flag: "🌍", gradient: "from-red-700 to-rose-900", buildUrl: googleSite("advanceautoparts.com") },
  { name: "AutoZone", flag: "🌍", gradient: "from-amber-600 to-red-600", buildUrl: googleSite("autozone.com") },
];

const SearchResults = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();

  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const [activeQuery, setActiveQuery] = useState(initialQuery);
  const [identifying, setIdentifying] = useState(false);
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
                  className="group glass rounded-xl overflow-hidden hover:border-primary/30 transition-all hover:scale-[1.02]"
                >
                  <div className={`h-16 bg-gradient-to-br ${supplier.gradient} flex items-center justify-center`}>
                    <span className="text-white font-display font-bold text-lg tracking-wide opacity-90 group-hover:opacity-100 transition-opacity">
                      {supplier.flag} {supplier.name}
                    </span>
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
