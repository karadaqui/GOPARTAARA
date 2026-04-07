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

const suppliers = [
  {
    name: "eBay Motors",
    initials: "eBay",
    gradient: "from-red-500 to-yellow-500",
    description: "Millions of new & used car parts",
    buildUrl: (q: string) => `https://www.ebay.co.uk/sch/i.html?_nkw=${q.replace(/\s+/g, "+")}&_sacat=9801`,
  },
  {
    name: "Amazon UK",
    initials: "AMZ",
    gradient: "from-orange-500 to-amber-600",
    description: "Fast delivery with Prime",
    buildUrl: (q: string) => `https://www.amazon.co.uk/s?k=${q.replace(/\s+/g, "+")}`,
  },
  {
    name: "AutoDoc",
    initials: "AD",
    gradient: "from-sky-500 to-blue-600",
    description: "European auto parts specialist",
    buildUrl: (q: string) => `https://www.autodoc.co.uk/search-results/${encodeURIComponent(q)}`,
  },
  {
    name: "Car Parts 4 Less",
    initials: "CP4L",
    gradient: "from-green-500 to-emerald-600",
    description: "Discount car parts online",
    buildUrl: (q: string) => `https://www.carparts4less.co.uk/search?term=${encodeURIComponent(q)}`,
  },
  {
    name: "GSF Car Parts",
    initials: "GSF",
    gradient: "from-emerald-600 to-teal-700",
    description: "Trade & retail car parts",
    buildUrl: (q: string) => `https://www.gsfcarparts.com/search?q=${encodeURIComponent(q)}`,
  },
  {
    name: "Euro Car Parts",
    initials: "ECP",
    gradient: "from-blue-600 to-indigo-700",
    description: "UK's #1 car parts retailer",
    buildUrl: (q: string) => `https://www.eurocarparts.com/search?q=${encodeURIComponent(q)}`,
  },
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

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {suppliers.map((supplier) => (
                <a
                  key={supplier.name}
                  href={supplier.buildUrl(activeQuery)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group glass rounded-2xl overflow-hidden hover:border-primary/30 transition-all hover:scale-[1.02]"
                >
                  <div className={`h-24 bg-gradient-to-br ${supplier.gradient} flex items-center justify-center`}>
                    <span className="text-white font-display font-bold text-3xl tracking-wide opacity-90 group-hover:opacity-100 transition-opacity">
                      {supplier.initials}
                    </span>
                  </div>
                  <div className="p-5">
                    <h3 className="font-display font-semibold text-base mb-1">
                      {supplier.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mb-4">
                      {supplier.description}
                    </p>
                    <div className="flex items-center gap-1.5 text-sm text-primary font-medium">
                      <ExternalLink size={14} />
                      Search Now
                    </div>
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
