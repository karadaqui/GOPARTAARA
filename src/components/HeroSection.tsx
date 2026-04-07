import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Camera, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

const HeroSection = () => {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />

      <div className="container relative z-10 text-center px-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border bg-secondary/50 text-xs text-muted-foreground mb-8">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          Trusted by 2,000+ mechanics &amp; enthusiasts
        </div>

        <h1 className="font-display text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight leading-tight mb-6">
          Find Any Car Part
          <br />
          <span className="text-gradient">Instantly</span>
        </h1>

        <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto mb-12">
          Search across 10+ trusted UK and global suppliers. Compare prices, check availability, and order — all in one place.
        </p>

        {/* Search bar */}
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSearch} className="flex items-center gap-2 p-2 rounded-2xl glass glow-red">
            <div className="flex-1 flex items-center gap-3 px-4">
              <Search className="text-muted-foreground shrink-0" size={20} />
              <input
                type="text"
                placeholder="Search parts... e.g. BMW E46 bumper"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-sm py-3"
              />
            </div>
            <label className="cursor-pointer shrink-0">
              <input type="file" accept="image/*" className="hidden" />
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors text-sm text-secondary-foreground">
                <Camera size={18} />
                <span className="hidden sm:inline">Upload Photo</span>
              </div>
            </label>
            <Button type="submit" className="shrink-0 rounded-xl px-6 py-3 h-auto text-sm font-semibold">
              Search
            </Button>
          </form>
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap items-center justify-center gap-6 mt-12 text-xs text-muted-foreground">
          {["Euro Car Parts", "GSF", "eBay Motors", "AutoDoc", "Car Parts 4 Less"].map((s) => (
            <span key={s} className="px-3 py-1.5 rounded-full border border-border bg-secondary/30">
              {s}
            </span>
          ))}
          <span className="text-primary font-medium">+5 more</span>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
