import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Camera, Loader2, Car, ArrowUp, ImageIcon } from "lucide-react";
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
      const { data, error } = await supabase.functions.invoke("identify-part", { body: { image: base64 } });
      if (error) throw error;
      const partName = data?.partName || "Unknown car part";
      const confidence = data?.confidence || "low";
      if (partName === "Unknown car part" || confidence === "low") {
        toast({ title: "Part not recognized", description: data?.details || "Try a clearer photo or search manually.", variant: "destructive" });
        setIdentifying(false);
        return;
      }
      toast({ title: `Identified: ${partName}`, description: `Confidence: ${confidence}. Searching now...` });
      navigate(`/search?q=${encodeURIComponent(partName)}&photo=1`);
    } catch (err: any) {
      console.error("Photo identify failed:", err);
      toast({ title: "Identification failed", description: err.message || "Please try again or search manually.", variant: "destructive" });
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
      const { data, error } = await supabase.functions.invoke("vehicle-lookup", { body: { registrationNumber: cleaned } });
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

  const activeSupplier = { name: "eBay", description: "Global — works in all countries" };
  const comingSoonSuppliers = [
    { name: "Amazon" },
    { name: "Euro Car Parts" },
    { name: "GSF Car Parts" },
    { name: "Car Parts 4 Less" },
    { name: "Autodoc" },
  ];

  const handleShare = async () => {
    const shareText = "gopartara.com";
    try {
      await navigator.clipboard.writeText(shareText);
      toast({ title: "Link copied! Thanks for sharing 💙", duration: 2000 });
    } catch {
      toast({ title: "Couldn't copy link", variant: "destructive" });
    }
  };

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden animated-gradient-bg">
      {/* Background glow orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-primary/6 blur-[180px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-primary/4 blur-[140px] pointer-events-none" />

      <div className="container relative z-10 text-center px-4 py-12 sm:py-0">
        {/* Badge */}
        <div className={`transition-all duration-700 ease-out ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-border/40 bg-card/30 backdrop-blur-md text-xs text-muted-foreground mb-10">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            ⚡ 10,000+ searches completed this week
          </div>
        </div>

        {/* Heading */}
        <div className={`transition-all duration-700 ease-out delay-100 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <h1 className="font-display text-4xl sm:text-5xl md:text-7xl lg:text-[5.5rem] font-bold tracking-[-0.04em] leading-[0.9] mb-6 sm:mb-8">
            Find Any Car Part
            <br />
            <span className="text-gradient">Instantly</span>
          </h1>
        </div>

        {/* Subtitle */}
        <div className={`transition-all duration-700 ease-out delay-200 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <p className="text-muted-foreground text-base sm:text-lg md:text-xl max-w-2xl mx-auto mb-12 sm:mb-14 leading-relaxed">
            Search 1,000,000+ parts from trusted UK &amp; global suppliers.
            <br className="hidden sm:block" />
            Compare prices, check availability, and order — all in one place.
          </p>
        </div>

        {/* Search section */}
        <div className={`transition-all duration-700 ease-out delay-300 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
          <div id="search" className="max-w-3xl mx-auto">
            {/* Tabs */}
            <div className="flex items-center justify-center mb-5">
              <div className="inline-flex items-center rounded-xl bg-card/40 backdrop-blur-md border border-border/30 p-1">
                <button
                  onClick={() => setActiveTab("part")}
                  className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg transition-all duration-300 ${
                    activeTab === "part"
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Search size={14} />
                  Search by Part
                </button>
                <button
                  onClick={() => setActiveTab("plate")}
                  className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg transition-all duration-300 ${
                    activeTab === "plate"
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Car size={14} />
                  Search by Plate
                </button>
              </div>
            </div>

            {/* Part search */}
            {activeTab === "part" ? (
              <>
                <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2 sm:p-2.5 rounded-2xl glass glow-focus">
                  <div className="flex-1 flex items-center gap-3 px-4">
                    <SearchBarGarageDropdown onSelect={(vq) => setQuery((prev) => prev.trim() ? `${vq} ${prev.trim()}` : vq)} />
                    <Search className="text-muted-foreground shrink-0" size={20} />
                    <input
                      type="text"
                      placeholder="Search parts... e.g. BMW E46 bumper"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="w-full bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-sm sm:text-base py-3.5"
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
                      <div className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-secondary hover:bg-secondary/80 transition-all text-sm text-secondary-foreground hover:scale-[1.02] active:scale-[0.98]">
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
                        className="shrink-0 flex-1 sm:flex-none rounded-xl px-7 py-3.5 h-auto text-sm font-semibold"
                        onClick={() => navigate("/pricing")}
                      >
                        <ArrowUp size={14} className="mr-1" />
                        Upgrade
                      </Button>
                    ) : (
                      <Button type="submit" className="shrink-0 flex-1 sm:flex-none rounded-xl px-7 py-3.5 h-auto text-sm font-semibold" disabled={identifying}>
                        Search
                      </Button>
                    )}
                  </div>
                </form>
                <div className="flex flex-col items-center mt-4 gap-2">
                  <p className="text-xs text-muted-foreground text-center flex items-center gap-1.5">
                    <ImageIcon size={12} className="text-muted-foreground/70" />
                    Upload a photo of any car part — our system will identify it and find the best prices
                  </p>
                  {user && <SearchCounter limitData={searchLimit} />}
                </div>
              </>
            ) : (
              <>
                <form onSubmit={handleRegLookup} className="flex items-center gap-2 p-2 sm:p-2.5 rounded-2xl glass glow-focus">
                  <div className="flex-1 relative">
                    <Car size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={regNumber}
                      onChange={(e) => setRegNumber(e.target.value.toUpperCase())}
                      placeholder="Enter reg plate e.g. AB12 CDE"
                      className="pl-11 bg-transparent border-0 h-13 rounded-xl uppercase tracking-widest font-mono font-bold text-foreground placeholder:text-muted-foreground focus-visible:ring-0"
                      maxLength={10}
                      disabled={regLoading}
                    />
                  </div>
                  {user && searchLimit.limitReached ? (
                    <Button
                      type="button"
                      className="shrink-0 rounded-xl px-7 py-3.5 h-auto text-sm font-semibold"
                      onClick={() => navigate("/pricing")}
                    >
                      <ArrowUp size={14} className="mr-1" />
                      Upgrade
                    </Button>
                  ) : (
                    <Button type="submit" className="shrink-0 rounded-xl px-7 py-3.5 h-auto text-sm font-semibold" disabled={regLoading || !regNumber.trim()}>
                      {regLoading ? <Loader2 size={16} className="animate-spin" /> : "Lookup"}
                    </Button>
                  )}
                </form>
                <p className="text-xs text-muted-foreground mt-4 flex items-center justify-center gap-1.5">
                  <Car size={12} className="text-muted-foreground/70" />
                  Enter your UK number plate to find parts specific to your vehicle
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

        {/* Suppliers Section */}
        <div className={`transition-all duration-700 ease-out delay-500 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <div className="mt-12 sm:mt-16 space-y-6">
            {/* Active Supplier */}
            <div className="flex items-center justify-center gap-2">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Active Supplier</span>
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl border bg-[hsl(142,76%,36%,0.1)] border-[hsl(142,76%,36%,0.3)]">
                <span className="w-2 h-2 rounded-full bg-[hsl(142,76%,45%)] animate-pulse" />
                <span className="text-sm font-semibold text-[hsl(142,76%,45%)]">{activeSupplier.name}</span>
                <span className="text-xs text-[hsl(142,76%,45%,0.7)]">— {activeSupplier.description}</span>
                <span className="text-[hsl(142,76%,45%)]">✅</span>
              </div>
            </div>

            {/* Coming Soon */}
            <div>
              <p className="text-xs text-muted-foreground/60 uppercase tracking-wider mb-3">More suppliers coming soon</p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {comingSoonSuppliers.map((s) => (
                  <div
                    key={s.name}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border/20 bg-card/10 opacity-40 grayscale cursor-default"
                  >
                    <span className="text-xs font-medium text-muted-foreground">{s.name}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-muted text-muted-foreground">Soon</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Community Support Banner */}
            <div className="py-12 text-center max-w-xl mx-auto">
              <div className="text-4xl mb-4" aria-hidden="true">🤝</div>
              <h3 className="community-banner-title">Help us add more suppliers</h3>
              <p className="community-banner-copy">
                We're a small independent team. Every search, share and subscription helps us partner with more suppliers and build a better product for UK car owners.
              </p>
              <div className="community-banner-divider" aria-hidden="true" />
              <div className="community-banner-actions">
                <button
                  type="button"
                  onClick={handleShare}
                  className="community-banner-button community-banner-button-ghost"
                >
                  Share PARTARA 🔗
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/pricing")}
                  className="community-banner-button community-banner-button-accent"
                >
                  Support Us → Pro
                </button>
              </div>
              <p className="community-banner-footnote">Currently live: eBay (global)</p>
            </div>
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
