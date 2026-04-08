import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Camera, Loader2, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import SearchBarGarageDropdown from "@/components/SearchBarGarageDropdown";
import SearchCounter from "@/components/SearchCounter";

const HeroSection = () => {
  const [query, setQuery] = useState("");
  const [identifying, setIdentifying] = useState(false);
  const [regNumber, setRegNumber] = useState("");
  const [regLoading, setRegLoading] = useState(false);
  const [regVehicle, setRegVehicle] = useState<{ make: string; yearOfManufacture?: number; colour?: string; engineCapacity?: number } | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
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
      // Convert to base64
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
      const confidence = data?.confidence || "low";

      if (partName === "Unknown car part" || confidence === "low") {
        toast({
          title: "Part not recognized",
          description: data?.details || "Try a clearer photo or search manually.",
          variant: "destructive",
        });
        setIdentifying(false);
        return;
      }

      toast({
        title: `Identified: ${partName}`,
        description: `Confidence: ${confidence}. Searching now...`,
      });

      navigate(`/search?q=${encodeURIComponent(partName)}&photo=1`);
    } catch (err: any) {
      console.error("Photo identify failed:", err);
      toast({
        title: "Identification failed",
        description: err.message || "Please try again or search manually.",
        variant: "destructive",
      });
    } finally {
      setIdentifying(false);
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = "";
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
          Search across 15+ trusted UK and global suppliers. Compare prices, check availability, and order — all in one place.
        </p>

        {/* Search bar */}
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSearch} className="flex items-center gap-2 p-2 rounded-2xl glass glow-red">
            <div className="flex-1 flex items-center gap-3 px-4">
              <SearchBarGarageDropdown onSelect={(vq) => setQuery((prev) => prev.trim() ? `${vq} ${prev.trim()}` : vq)} />
              <Search className="text-muted-foreground shrink-0" size={20} />
              <input
                type="text"
                placeholder="Search parts... e.g. BMW E46 bumper"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-sm py-3"
                disabled={identifying}
              />
            </div>
            <label className={`cursor-pointer shrink-0 ${identifying ? "pointer-events-none opacity-60" : ""}`}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
                disabled={identifying}
              />
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors text-sm text-secondary-foreground">
                {identifying ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span className="hidden sm:inline">Identifying...</span>
                  </>
                ) : (
                  <>
                    <Camera size={18} />
                    <span className="hidden sm:inline">Photo Search</span>
                  </>
                )}
              </div>
            </label>
            <Button type="submit" className="shrink-0 rounded-xl px-6 py-3 h-auto text-sm font-semibold" disabled={identifying}>
              Search
            </Button>
          </form>
          <div className="flex items-center justify-between mt-3">
            <p className="text-xs text-muted-foreground">
              📸 Upload a photo of any car part — our advanced system will identify it and find the best prices
            </p>
            <SearchCounter />
          </div>
        </div>

        {/* Vehicle Reg Lookup - Coming Soon */}
        <div className="max-w-2xl mx-auto mt-10">
          <div className="relative rounded-2xl glass border border-border p-5 opacity-60 pointer-events-none select-none">
            <div className="absolute inset-0 flex items-center justify-center z-20">
              <span className="px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-bold tracking-wide uppercase shadow-lg">
                Coming Soon
              </span>
            </div>
            <div className="flex items-center gap-2 blur-[1px]">
              <div className="flex-1 relative">
                <Car size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Enter reg plate e.g. AB12 CDE"
                  disabled
                  className="w-full pl-10 bg-secondary border border-border rounded-xl h-11 text-sm uppercase tracking-widest font-mono font-bold text-muted-foreground"
                />
              </div>
              <div className="shrink-0 rounded-xl h-11 px-6 bg-primary text-primary-foreground flex items-center text-sm font-semibold">
                Lookup
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              🚗 Enter your UK number plate to find parts specific to your vehicle
            </p>
          </div>
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap items-center justify-center gap-6 mt-12 text-xs text-muted-foreground">
          {["eBay UK", "Amazon UK", "Euro Car Parts", "AutoDoc", "GSF"].map((s) => (
            <span key={s} className="px-3 py-1.5 rounded-full border border-border bg-secondary/30">
              {s}
            </span>
          ))}
          <span className="text-primary font-medium">+10 more</span>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
