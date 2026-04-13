import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ExternalLink, Loader2, Package, Search, AlertTriangle } from "lucide-react";
import { buildEbayAffiliateUrl } from "@/lib/ebayAffiliate";

const CATEGORIES = ["Brakes", "Engine", "Suspension", "Filters", "Exhaust", "Electrics", "Cooling", "Body"];

interface TecDocVehicle {
  id: number;
  name: string;
  make: string;
  model: string;
  year?: number;
  ktype: number;
}

interface TecDocPart {
  id: number | string;
  name: string;
  brand: string;
  oemNumber: string;
  category: string;
  imageUrl: string | null;
}

interface CompatiblePartsProps {
  make: string;
  model: string | null;
  year: number | null;
}

const CompatibleParts = ({ make, model, year }: CompatiblePartsProps) => {
  const [tecdocVehicles, setTecdocVehicles] = useState<TecDocVehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<TecDocVehicle | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [parts, setParts] = useState<TecDocPart[]>([]);
  const [loading, setLoading] = useState(false);
  const [partsLoading, setPartsLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [partsSearched, setPartsSearched] = useState(false);
  const { toast } = useToast();

  const handleFindCompatible = async () => {
    setLoading(true);
    setSearched(true);
    setSelectedVehicle(null);
    setSelectedCategory(null);
    setParts([]);
    setPartsSearched(false);
    try {
      const { data, error } = await supabase.functions.invoke("tecdoc-lookup", {
        body: { action: "search_vehicle", make, model: model || undefined, year: year || undefined },
      });
      if (error) throw error;
      setTecdocVehicles(data?.vehicles || []);
      if (data?.vehicles?.length === 1) {
        setSelectedVehicle(data.vehicles[0]);
      }
    } catch (err: any) {
      toast({ title: "Lookup failed", description: err.message || "Could not search TecDoc.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = async (category: string) => {
    if (!selectedVehicle) return;
    setSelectedCategory(category);
    setPartsLoading(true);
    setPartsSearched(true);
    setParts([]);
    try {
      const { data, error } = await supabase.functions.invoke("tecdoc-lookup", {
        body: { action: "get_parts", vehicleId: selectedVehicle.id || selectedVehicle.ktype, category },
      });
      if (error) throw error;
      setParts(data?.parts || []);
    } catch (err: any) {
      toast({ title: "Parts lookup failed", description: err.message, variant: "destructive" });
    } finally {
      setPartsLoading(false);
    }
  };

  const buildEbaySearchUrl = (oemNumber: string, partName: string) => {
    const query = oemNumber || partName;
    const base = `https://www.ebay.co.uk/sch/i.html?_nkw=${encodeURIComponent(query)}`;
    return buildEbayAffiliateUrl(base);
  };

  return (
    <div className="mt-4 space-y-4">
      {/* Find Compatible Parts button */}
      {!searched && (
        <Button
          onClick={handleFindCompatible}
          variant="outline"
          className="w-full h-11 rounded-xl gap-2 font-semibold border-primary/30 text-primary hover:bg-primary/5"
          disabled={loading}
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Package size={16} />}
          Find Compatible Parts (TecDoc)
        </Button>
      )}

      {loading && (
        <div className="flex items-center justify-center py-6 text-muted-foreground text-sm gap-2">
          <Loader2 size={16} className="animate-spin" /> Searching TecDoc catalog…
        </div>
      )}

      {/* Vehicle selection if multiple results */}
      {searched && !loading && tecdocVehicles.length > 1 && !selectedVehicle && (
        <div className="rounded-xl border border-border/60 bg-card p-4 space-y-2">
          <p className="text-sm font-medium text-foreground">Select your exact vehicle:</p>
          <div className="grid gap-2">
            {tecdocVehicles.map((v) => (
              <button
                key={v.id}
                onClick={() => setSelectedVehicle(v)}
                className="text-left px-3 py-2.5 rounded-lg border border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-colors text-sm"
              >
                <span className="font-semibold">{v.name}</span>
                {v.year && <span className="text-muted-foreground ml-1.5">({v.year})</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* No vehicles found */}
      {searched && !loading && tecdocVehicles.length === 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/50 rounded-xl px-4 py-3">
          <AlertTriangle size={15} className="text-amber-500 shrink-0" />
          No compatible parts found in TecDoc. Try searching by part name instead.
        </div>
      )}

      {/* Category buttons */}
      {selectedVehicle && (
        <div className="rounded-xl border border-border/60 bg-card p-4 space-y-3">
          <p className="text-sm font-medium text-foreground">
            Browse parts for <span className="text-primary">{selectedVehicle.name}</span>:
          </p>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <Button
                key={cat}
                size="sm"
                variant={selectedCategory === cat ? "default" : "outline"}
                className="rounded-lg text-xs h-8 px-3"
                onClick={() => handleCategoryClick(cat)}
                disabled={partsLoading}
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Parts loading */}
      {partsLoading && (
        <div className="flex items-center justify-center py-6 text-muted-foreground text-sm gap-2">
          <Loader2 size={16} className="animate-spin" /> Loading {selectedCategory} parts…
        </div>
      )}

      {/* Parts list */}
      {partsSearched && !partsLoading && parts.length > 0 && (
        <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border/40 bg-secondary/30">
            <p className="text-sm font-semibold text-foreground">
              {selectedCategory} — {parts.length} compatible parts
            </p>
          </div>
          <div className="divide-y divide-border/30 max-h-[400px] overflow-y-auto">
            {parts.map((part) => (
              <div key={part.id} className="px-4 py-3 flex items-center gap-3 hover:bg-secondary/20 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{part.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {part.brand && (
                      <span className="text-xs text-muted-foreground">{part.brand}</span>
                    )}
                    {part.oemNumber && (
                      <span className="text-xs font-mono bg-secondary/60 px-1.5 py-0.5 rounded text-muted-foreground">
                        {part.oemNumber}
                      </span>
                    )}
                  </div>
                </div>
                <a
                  href={buildEbaySearchUrl(part.oemNumber, part.name)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0"
                >
                  <Button size="sm" variant="outline" className="h-8 rounded-lg text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/5">
                    <Search size={13} />
                    Find on eBay
                    <ExternalLink size={11} />
                  </Button>
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No parts for category */}
      {partsSearched && !partsLoading && parts.length === 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/50 rounded-xl px-4 py-3">
          <AlertTriangle size={15} className="text-amber-500 shrink-0" />
          No {selectedCategory} parts found. Try a different category or search by part name.
        </div>
      )}
    </div>
  );
};

export default CompatibleParts;
