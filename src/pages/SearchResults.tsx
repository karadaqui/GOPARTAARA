import { useState, useMemo, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  Check,
  ExternalLink,
  Bookmark,
  Loader2,
  Package,
  TruckIcon,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type PartResult = {
  id: string;
  partName: string;
  partNumber: string;
  supplier: string;
  price: number;
  originalPrice?: number | null;
  availability: "in_stock" | "low_stock" | "out_of_stock";
  deliveryDays: number;
  imageUrl: string;
  url: string;
  rating: number;
};

const availabilityConfig = {
  in_stock: { label: "In Stock", className: "text-green-400 bg-green-400/10" },
  low_stock: { label: "Low Stock", className: "text-yellow-400 bg-yellow-400/10" },
  out_of_stock: { label: "Out of Stock", className: "text-red-400 bg-red-400/10" },
};

type SortKey = "price_asc" | "price_desc" | "delivery" | "rating";

const SearchResults = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const [activeQuery, setActiveQuery] = useState(initialQuery);
  const [sortBy, setSortBy] = useState<SortKey>("price_asc");
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [results, setResults] = useState<PartResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const fetchResults = useCallback(async (q: string) => {
    if (!q.trim()) return;
    setSearching(true);
    setSearchError(null);
    try {
      const { data, error } = await supabase.functions.invoke("search-parts", {
        body: { query: q.trim() },
      });
      if (error) throw error;
      setResults(data?.results || []);
    } catch (err: any) {
      console.error("Search failed:", err);
      setSearchError(err.message || "Search failed. Please try again.");
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  // Search on mount if query param exists
  useEffect(() => {
    if (initialQuery) fetchResults(initialQuery);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Derive unique suppliers from results for filter chips
  const supplierList = useMemo(
    () => [...new Set(results.map((r) => r.supplier))].sort(),
    [results]
  );

  const filtered = useMemo(() => {
    let items = [...results];
    if (selectedSuppliers.length > 0) {
      items = items.filter((r) => selectedSuppliers.includes(r.supplier));
    }
    items.sort((a, b) => {
      switch (sortBy) {
        case "price_asc": return a.price - b.price;
        case "price_desc": return b.price - a.price;
        case "delivery": return a.deliveryDays - b.deliveryDays;
        case "rating": return b.rating - a.rating;
        default: return 0;
      }
    });
    return items;
  }, [results, selectedSuppliers, sortBy]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setActiveQuery(query.trim());
    setSearchParams({ q: query.trim() });
    setSelectedSuppliers([]);
    fetchResults(query.trim());
  };

  const toggleSupplier = (s: string) => {
    setSelectedSuppliers((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  const handleSave = async (part: PartResult) => {
    if (!user) {
      navigate("/auth");
      return;
    }
    setSavingId(part.id);
    const { error } = await supabase.from("saved_parts").insert({
      user_id: user.id,
      part_name: part.partName,
      part_number: part.partNumber,
      supplier: part.supplier,
      price: part.price,
      image_url: part.imageUrl,
      url: part.url,
    });
    setSavingId(null);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Saved", description: `${part.partName} added to saved parts.` });
    }
  };

  const sortOptions: { key: SortKey; label: string }[] = [
    { key: "price_asc", label: "Price: Low → High" },
    { key: "price_desc", label: "Price: High → Low" },
    { key: "delivery", label: "Fastest Delivery" },
    { key: "rating", label: "Best Rated" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      {/* Search bar */}
      <div className="border-b border-border bg-card/40 backdrop-blur-lg sticky top-0 z-20 pt-16">
        <div className="container max-w-6xl py-4 px-4">
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search car parts..."
                className="pl-10 bg-secondary border-border h-11 rounded-xl"
                disabled={searching}
              />
            </div>
            <Button type="submit" className="rounded-xl h-11 px-6" disabled={searching}>
              {searching ? <Loader2 size={16} className="animate-spin" /> : "Search"}
            </Button>
          </form>
        </div>
      </div>

      <div className="container max-w-6xl flex-1 px-4 py-6">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <p className="text-sm text-muted-foreground">
            {searching ? (
              <span className="flex items-center gap-2">
                <Loader2 size={14} className="animate-spin" />
                Searching suppliers...
              </span>
            ) : activeQuery ? (
              <>
                <span className="text-foreground font-medium">{filtered.length}</span> results for{" "}
                <span className="text-foreground font-medium">"{activeQuery}"</span>
              </>
            ) : (
              "Enter a search to find parts"
            )}
          </p>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl gap-2"
              onClick={() => setShowFilters((v) => !v)}
            >
              <SlidersHorizontal size={14} />
              Filters
              {selectedSuppliers.length > 0 && (
                <span className="ml-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                  {selectedSuppliers.length}
                </span>
              )}
            </Button>

            <div className="relative group">
              <Button variant="outline" size="sm" className="rounded-xl gap-2">
                <ArrowUpDown size={14} />
                Sort
              </Button>
              <div className="absolute right-0 top-full mt-1 w-48 rounded-xl bg-card border border-border shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-30">
                {sortOptions.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => setSortBy(opt.key)}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-secondary transition-colors first:rounded-t-xl last:rounded-b-xl flex items-center justify-between"
                  >
                    {opt.label}
                    {sortBy === opt.key && <Check size={14} className="text-primary" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Filters panel */}
        {showFilters && supplierList.length > 0 && (
          <div className="glass rounded-2xl p-5 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">Suppliers</h3>
              {selectedSuppliers.length > 0 && (
                <button
                  onClick={() => setSelectedSuppliers([])}
                  className="text-xs text-primary hover:underline"
                >
                  Clear all
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {supplierList.map((s) => {
                const active = selectedSuppliers.includes(s);
                return (
                  <button
                    key={s}
                    onClick={() => toggleSupplier(s)}
                    className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                      active
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border hover:border-muted-foreground"
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Error state */}
        {searchError && (
          <div className="glass rounded-2xl p-8 text-center mb-6">
            <AlertCircle size={32} className="text-destructive mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">{searchError}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4 rounded-xl"
              onClick={() => fetchResults(activeQuery)}
            >
              Try again
            </Button>
          </div>
        )}

        {/* Loading state */}
        {searching && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="glass rounded-2xl overflow-hidden animate-pulse">
                <div className="aspect-[4/3] bg-secondary/50" />
                <div className="p-5 space-y-3">
                  <div className="h-3 bg-secondary rounded w-1/3" />
                  <div className="h-4 bg-secondary rounded w-3/4" />
                  <div className="h-3 bg-secondary rounded w-1/2" />
                  <div className="h-6 bg-secondary rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Results grid */}
        {!searching && !searchError && activeQuery && filtered.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((part) => {
              const avail = availabilityConfig[part.availability];
              return (
                <div
                  key={part.id}
                  className="glass rounded-2xl overflow-hidden flex flex-col hover:border-primary/30 transition-colors"
                >
                  <div className="aspect-[4/3] bg-secondary/50 flex items-center justify-center p-6">
                    <Package size={48} className="text-muted-foreground/30" />
                  </div>

                  <div className="p-5 flex flex-col flex-1">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                      {part.supplier}
                    </span>

                    <h3 className="font-display font-semibold text-sm leading-snug mb-2 line-clamp-2">
                      {part.partName}
                    </h3>

                    <p className="text-xs text-muted-foreground mb-3">#{part.partNumber}</p>

                    <div className="flex items-baseline gap-2 mb-3">
                      <span className="font-display text-xl font-bold text-foreground">
                        £{part.price.toFixed(2)}
                      </span>
                      {part.originalPrice && (
                        <span className="text-xs text-muted-foreground line-through">
                          £{part.originalPrice.toFixed(2)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 mb-4 text-xs">
                      <span className={`px-2 py-0.5 rounded-full font-medium ${avail.className}`}>
                        {avail.label}
                      </span>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <TruckIcon size={12} />
                        {part.deliveryDays === 1 ? "Next day" : `${part.deliveryDays} days`}
                      </span>
                    </div>

                    <div className="mt-auto flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1 rounded-xl text-xs h-9 gap-1.5"
                        asChild={part.url !== "#"}
                      >
                        {part.url !== "#" ? (
                          <a href={part.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink size={13} />
                            View
                          </a>
                        ) : (
                          <>
                            <ExternalLink size={13} />
                            View
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl h-9 w-9 p-0"
                        onClick={() => handleSave(part)}
                        disabled={savingId === part.id}
                      >
                        {savingId === part.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Bookmark size={14} />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty state after search */}
        {!searching && !searchError && activeQuery && filtered.length === 0 && results.length > 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <SlidersHorizontal size={48} className="text-muted-foreground/20 mb-4" />
            <h2 className="font-display text-xl font-semibold mb-2">No matching results</h2>
            <p className="text-sm text-muted-foreground max-w-md">
              Try adjusting your filters to see more results.
            </p>
          </div>
        )}

        {/* Initial empty state */}
        {!searching && !searchError && !activeQuery && (
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
