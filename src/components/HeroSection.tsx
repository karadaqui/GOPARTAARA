import { useState, useRef, useEffect } from "react";
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
  const [mounted, setMounted] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

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

    if (!searchLimit.isPro) {
      toast({ title: "Photo search is available on Pro and Elite plans", description: "Upgrade to unlock photo search.", variant: "destructive" });
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
    <section id="home" className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden animated-gradient-bg">
      {/* Background glow orbs */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-primary/8 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

      <div className="container relative z-10 text-center px-4">
        {/* Badge */}
        <div className={`transition-all duration-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border/60 bg-secondary/40 backdrop-blur-sm text-xs text-muted-foreground mb-8">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Join car enthusiasts across the UK &amp; beyond
          </div>
        </div>

        {/* Heading */}
        <div className={`transition-all duration-700 delay-100 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <h1 className="font-display text-3xl sm:text-4xl md:text-6xl lg:text-8xl font-bold tracking-tighter leading-[0.95] mb-5 sm:mb-7">
            Find Any Car Part
            <br />
            <span className="text-gradient">Instantly</span>
          </h1>
        </div>

        {/* Subtitle */}
        <div className={`transition-all duration-700 delay-200 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <p className="text-muted-foreground text-sm sm:text-lg md:text-xl max-w-2xl mx-auto mb-10 sm:mb-14 leading-relaxed">
            Search 1,000,000+ parts from trusted UK &amp; global suppliers. Compare prices, check availability, and order — all in one place.
          </p>
        </div>

        {/* Search section */}
        <div className={`transition-all duration-700 delay-300 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
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
                <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2 rounded-2xl glass glow-focus animate-float">
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
                      <div className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-all text-sm text-secondary-foreground hover:scale-[1.02]">
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
                        className="shrink-0 flex-1 sm:flex-none rounded-xl px-6 py-3 h-auto text-sm font-semibold btn-glow"
                        onClick={() => navigate("/pricing")}
                      >
                        <ArrowUp size={14} className="mr-1" />
                        Upgrade
                      </Button>
                    ) : (
                      <Button type="submit" className="shrink-0 flex-1 sm:flex-none rounded-xl px-6 py-3 h-auto text-sm font-semibold btn-glow" disabled={identifying}>
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
                <form onSubmit={handleRegLookup} className="flex items-center gap-2 p-2 rounded-2xl glass glow-focus animate-float">
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
                      className="shrink-0 rounded-xl px-6 py-3 h-auto text-sm font-semibold btn-glow"
                      onClick={() => navigate("/pricing")}
                    >
                      <ArrowUp size={14} className="mr-1" />
                      Upgrade
                    </Button>
                  ) : (
                    <Button type="submit" className="shrink-0 rounded-xl px-6 py-3 h-auto text-sm font-semibold btn-glow" disabled={regLoading || !regNumber.trim()}>
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
        </div>

        {/* Trust badges */}
        <div className={`transition-all duration-700 delay-500 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 mt-10 sm:mt-14 text-[10px] sm:text-xs text-muted-foreground">
            {["eBay UK", "Amazon UK", "Euro Car Parts", "GSF Car Parts", "Car Parts 4 Less", "Autodoc"].map((s) => (
              <span key={s} className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-border/50 bg-secondary/20 backdrop-blur-sm pill-glow">
                {s}
              </span>
            ))}
          </div>
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
