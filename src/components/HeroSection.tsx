import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Camera, Loader2, Car, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import SearchBarGarageDropdown from "@/components/SearchBarGarageDropdown";
import SearchCounter from "@/components/SearchCounter";
import { useSearchLimit } from "@/hooks/useSearchLimit";
import AuthGateModal from "@/components/AuthGateModal";

const HeroSection = () => {
  const [query, setQuery] = useState("");
  const { user } = useAuth();
  const searchLimit = useSearchLimit();
  const [identifying, setIdentifying] = useState(false);
  const [activeTab, setActiveTab] = useState<"part" | "plate">("part");
  const [regNumber, setRegNumber] = useState("");
  const [regLoading, setRegLoading] = useState(false);
  const [regVehicle, setRegVehicle] = useState<{ make: string; yearOfManufacture?: number; colour?: string; engineCapacity?: number } | null>(null);
  const [authGateOpen, setAuthGateOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { setAuthGateOpen(true); return; }
    if (searchLimit.limitReached) {
      toast({ title: "Search limit reached", description: "Upgrade to Pro for unlimited searches.", variant: "destructive" });
      navigate("/pricing");
      return;
    }
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!user) {
      setAuthGateOpen(true);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // Block photo search for free users
    if (!searchLimit.isPro) {
      toast({ title: "Photo search is available on Pro and Business plans", description: "Upgrade to unlock photo search.", variant: "destructive" });
      navigate("/pricing");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

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
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRegLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { setAuthGateOpen(true); return; }
    if (searchLimit.limitReached) {
      toast({ title: "Search limit reached", description: "Upgrade to Pro for unlimited searches.", variant: "destructive" });
      navigate("/pricing");
      return;
    }
    const cleaned = regNumber.replace(/\s+/g, "").toUpperCase();
    if (!cleaned || cleaned.length < 2) {
      toast({ title: "Enter a valid registration number", variant: "destructive" });
      return;
    }
    setRegLoading(true);
    setRegVehicle(null);
    try {
      const { data, error } = await supabase.functions.invoke("vehicle-lookup", {
        body: { registrationNumber: cleaned },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const v = data.vehicle;
      setRegVehicle(v);
      toast({ title: `Found: ${v.make}`, description: `${v.yearOfManufacture || ""} ${v.colour || ""}`.trim() });
      const q = `${v.make} ${v.yearOfManufacture || ""}`.trim();
      const vehicleParam = encodeURIComponent(JSON.stringify(v));
      navigate(`/search?q=${encodeURIComponent(q)}&vehicle=${vehicleParam}`);
    } catch (err: any) {
      toast({ title: "Lookup failed", description: err.message || "Please try again.", variant: "destructive" });
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />

      <div className="container relative z-10 text-center px-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border bg-secondary/50 text-xs text-muted-foreground mb-8">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          Join car enthusiasts across the UK &amp; beyond
        </div>

        <h1 className="font-display text-2xl sm:text-3xl md:text-5xl lg:text-7xl font-bold tracking-tight leading-tight mb-4 sm:mb-6">
          Find Any Car Part
          <br />
          <span className="text-gradient">Instantly</span>
        </h1>

        <p className="text-muted-foreground text-sm sm:text-lg md:text-xl max-w-2xl mx-auto mb-8 sm:mb-12">
          Search 1,000,000+ parts from trusted UK &amp; global suppliers. Compare prices, check availability, and order — all in one place.
        </p>

        {/* Search section with tabs */}
        <div id="search" className="max-w-2xl mx-auto">
          {/* Tabs */}
          <div className="flex items-center justify-center gap-1 mb-4">
            <button
              onClick={() => setActiveTab("part")}
              className={`relative px-5 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                activeTab === "part"
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Search size={14} className="inline-block mr-1.5 -mt-0.5" />
              Search by Part
              {activeTab === "part" && (
                <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("plate")}
              className={`relative px-5 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                activeTab === "plate"
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Car size={14} className="inline-block mr-1.5 -mt-0.5" />
              Search by Plate
              {activeTab === "plate" && (
                <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          </div>

          {/* Tab content */}
          {activeTab === "part" ? (
            <>
              <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2 rounded-2xl glass glow-red">
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
                <div className="flex items-center gap-2">
                  <label className={`cursor-pointer shrink-0 flex-1 sm:flex-none ${identifying ? "pointer-events-none opacity-60" : ""}`}>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoUpload}
                      disabled={identifying}
                    />
                    <div className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors text-sm text-secondary-foreground">
                      {identifying ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          <span>Identifying...</span>
                        </>
                      ) : (
                        <>
                          <Camera size={18} />
                          <span className="sm:hidden">Photo</span>
                          <span className="hidden sm:inline">Photo Search</span>
                        </>
                      )}
                    </div>
                  </label>
                  {user && searchLimit.limitReached ? (
                    <Button
                      type="button"
                      className="shrink-0 flex-1 sm:flex-none rounded-xl px-6 py-3 h-auto text-sm font-semibold"
                      onClick={() => navigate("/pricing")}
                    >
                      <ArrowUp size={14} className="mr-1" />
                      Upgrade
                    </Button>
                  ) : (
                    <Button type="submit" className="shrink-0 flex-1 sm:flex-none rounded-xl px-6 py-3 h-auto text-sm font-semibold" disabled={identifying}>
                      Search
                    </Button>
                  )}
                </div>
              </form>
              <div className="flex flex-col items-center mt-3 gap-2">
                <p className="text-xs text-muted-foreground text-center">
                  📸 Upload a photo of any car part — our system will identify it and find the best prices
                </p>
                {user && <SearchCounter limitData={searchLimit} />}
              </div>
            </>
          ) : (
            <>
              <form onSubmit={handleRegLookup} className="flex items-center gap-2 p-2 rounded-2xl glass glow-red">
                <div className="flex-1 relative">
                  <Car size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={regNumber}
                    onChange={(e) => setRegNumber(e.target.value.toUpperCase())}
                    placeholder="Enter reg plate e.g. AB12 CDE"
                    className="pl-11 bg-transparent border-0 h-12 rounded-xl uppercase tracking-widest font-mono font-bold text-foreground placeholder:text-muted-foreground focus-visible:ring-0"
                    maxLength={10}
                    disabled={regLoading}
                  />
                </div>
                {user && searchLimit.limitReached ? (
                  <Button
                    type="button"
                    className="shrink-0 rounded-xl px-6 py-3 h-auto text-sm font-semibold"
                    onClick={() => navigate("/pricing")}
                  >
                    <ArrowUp size={14} className="mr-1" />
                    Upgrade
                  </Button>
                ) : (
                  <Button type="submit" className="shrink-0 rounded-xl px-6 py-3 h-auto text-sm font-semibold" disabled={regLoading || !regNumber.trim()}>
                    {regLoading ? <Loader2 size={16} className="animate-spin" /> : "Lookup"}
                  </Button>
                )}
              </form>
              <p className="text-xs text-muted-foreground mt-3">
                🚗 Enter your UK number plate to find parts specific to your vehicle
              </p>
              {user && (
                <div className="flex justify-center mt-2">
                  <SearchCounter limitData={searchLimit} />
                </div>
              )}
            </>
          )}
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-6 mt-8 sm:mt-12 text-[10px] sm:text-xs text-muted-foreground">
          {["eBay UK", "Amazon UK", "Euro Car Parts", "GSF Car Parts", "Car Parts 4 Less", "Autodoc"].map((s) => (
            <span key={s} className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border border-border bg-secondary/30">
              {s}
            </span>
          ))}
        </div>
      </div>

      <AuthGateModal
        open={authGateOpen}
        onOpenChange={setAuthGateOpen}
        title="Please sign in to search for car parts"
        description="Create a free account to search across 1,000,000+ parts from trusted UK & global suppliers."
      />
    </section>
  );
};

export default HeroSection;
