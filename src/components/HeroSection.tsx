import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Camera, Loader2, Car, ArrowUp, ImageIcon, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import SearchBarGarageDropdown from "@/components/SearchBarGarageDropdown";
import SearchCounter from "@/components/SearchCounter";
import { useSearchLimit } from "@/hooks/useSearchLimit";
import AuthGateModal from "@/components/AuthGateModal";
import SearchAutocomplete from "@/components/SearchAutocomplete";

const buildPhotoSearchTerms = (
  partName: string,
  _aiResult: { detectedMake?: string | null; detectedPartNumber?: string | null } | null,
  garageVehicle?: { make: string; model: string; year?: string | number } | null,
): { term: string; label: string; icon: string }[] => {
  const cleanPart = partName
    .replace(/\b(R-VTEC|i-VTEC|VTEC|VVTi|TDi|TDCi|HDi|CDTi|TSi|TFSI|DOHC|SOHC|CRDi|EcoBoost|BlueHDi|Multijet|D4D)\b/gi, '')
    .replace(/\s+/g, ' ').trim()
    .split(' ').slice(0, 4).join(' ');

  const make = garageVehicle?.make || '';
  const model = garageVehicle?.model || '';

  const dedupe = (term: string) => {
    const seen = new Set<string>();
    return term.split(' ').filter(w => {
      const low = w.toLowerCase();
      if (seen.has(low)) return false;
      seen.add(low);
      return true;
    }).join(' ');
  };

  const raw: { term: string; label: string; icon: string }[] = [];

  if (make && model) {
    raw.push({ term: dedupe(`${make} ${model} ${cleanPart}`), label: "Your vehicle", icon: "🎯" });
    raw.push({ term: dedupe(`${make} ${cleanPart}`), label: "Broader search", icon: "🔍" });
  } else if (make) {
    raw.push({ term: dedupe(`${make} ${cleanPart}`), label: "Your vehicle make", icon: "🎯" });
    raw.push({ term: dedupe(cleanPart), label: "Universal search", icon: "🌐" });
  } else {
    raw.push({ term: dedupe(cleanPart), label: "Universal search", icon: "🌐" });
  }

  const seen = new Set<string>();
  return raw.filter(t => {
    if (t.term.length < 3 || seen.has(t.term)) return false;
    seen.add(t.term);
    return true;
  }).slice(0, 3);
};
interface PhotoResult {
  partName: string;
  category: string;
  condition: string;
  compatibleVehicles: string[];
  brands: string[];
  searchTerms: string[];
  confidence: string;
  details: string;
  detectedMake?: string | null;
  detectedPartNumber?: string | null;
  _smartLabels?: { label: string; icon: string }[];
}

const HeroSection = () => {
  const [query, setQuery] = useState("");
  const { user } = useAuth();
  const searchLimit = useSearchLimit();
  const [identifying, setIdentifying] = useState(false);
  const [photoResult, setPhotoResult] = useState<PhotoResult | null>(null);
  const [editingPartName, setEditingPartName] = useState(false);
  const [editedPartName, setEditedPartName] = useState("");
  const [activeTab, setActiveTab] = useState<"part" | "plate" | "vin">("part");
  const [regNumber, setRegNumber] = useState("");
  const [regLoading, setRegLoading] = useState(false);
  const [regVehicle, setRegVehicle] = useState<{ make: string; yearOfManufacture?: number; colour?: string; engineCapacity?: number } | null>(null);
  const [vinNumber, setVinNumber] = useState("");
  const [vinLoading, setVinLoading] = useState(false);
  const [vinVehicle, setVinVehicle] = useState<Record<string, string | null> | null>(null);
  const [vinError, setVinError] = useState("");
  const [authGateOpen, setAuthGateOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [viewers, setViewers] = useState(() => Math.floor(Math.random() * 170) + 180);
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const heroInputRef = useRef<HTMLInputElement>(null);
  const [autoOpen, setAutoOpen] = useState(false);
  const [garageVehicle, setGarageVehicle] = useState<{ make: string; model: string; year?: number } | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  // Global "/" shortcut → focus hero search bar
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      const isTyping = tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable;
      if (e.key === "/" && !isTyping && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        heroInputRef.current?.focus();
        heroInputRef.current?.select();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Live viewer counter — fluctuate every 8s by -3..+5, clamp 180–350
  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setViewers((prev) => {
        const change = Math.floor(Math.random() * 9) - 3; // -3..+5
        const next = prev + change;
        return Math.max(180, Math.min(350, next));
      });
    }, 8000);
    return () => window.clearInterval(intervalId);
  }, []);

  // Returning visitor detection
  const [isReturning, setIsReturning] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const firstVisit = localStorage.getItem("first_visit");
      if (!firstVisit) {
        localStorage.setItem("first_visit", String(Date.now()));
      }
      const prev = parseInt(localStorage.getItem("visit_count") || "0", 10) || 0;
      const next = prev + 1;
      localStorage.setItem("visit_count", String(next));
      if (next > 1) setIsReturning(true);
    } catch {
      /* ignore storage errors */
    }
  }, []);

  // Fetch user's first garage vehicle (deduped per session)
  const garageFetchedRef = useRef(false);
  useEffect(() => {
    if (!user) {
      setGarageVehicle(null);
      garageFetchedRef.current = false;
      return;
    }
    if (garageFetchedRef.current) return;
    garageFetchedRef.current = true;
    supabase
      .from("user_vehicles")
      .select("make, model, year")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (data?.[0]) setGarageVehicle(data[0]);
      });
  }, [user?.id]);

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
    setPhotoResult(null);
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
      // Generate search terms: garage vehicle > AI make only (never AI model)
      const smartTerms = buildPhotoSearchTerms(
        partName,
        { detectedMake: data?.detectedMake, detectedPartNumber: data?.detectedPartNumber },
        garageVehicle,
      );

      setEditedPartName(partName);
      setEditingPartName(false);
      setPhotoResult({
        partName,
        category: data?.category || "",
        condition: data?.condition || "",
        compatibleVehicles: data?.compatibleVehicles || [],
        brands: data?.brands || [],
        searchTerms: smartTerms.map(t => t.term),
        confidence,
        details: data?.details || "",
        detectedMake: data?.detectedMake || null,
        detectedPartNumber: data?.detectedPartNumber || null,
        _smartLabels: smartTerms.map(t => ({ label: t.label, icon: t.icon })),
      });
      toast({ title: `Identified: ${partName}`, description: `Confidence: ${confidence}` });
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

  const isValidVin = (vin: string) => {
    const cleaned = vin.replace(/\s/g, "").toUpperCase();
    if (cleaned.length !== 17) return false;
    return /^[A-HJ-NPR-Z0-9]{17}$/.test(cleaned);
  };

  const handleVinLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { setAuthGateOpen(true); return; }
    if (searchLimit.limitReached) {
      toast({ title: "Search limit reached", description: "Upgrade to Pro for unlimited searches.", variant: "destructive" });
      navigate("/pricing");
      return;
    }
    const cleaned = vinNumber.replace(/\s/g, "").toUpperCase();
    if (cleaned.length !== 17) { setVinError("VIN must be exactly 17 characters"); return; }
    if (!isValidVin(cleaned)) { setVinError("Invalid VIN — letters I, O, Q are not allowed"); return; }

    setVinLoading(true);
    setVinError("");
    setVinVehicle(null);
    try {
      const { data, error } = await supabase.functions.invoke("vin-decode", {
        body: { vin: cleaned },
      });
      if (error || data?.error || !data?.vehicle?.make) {
        setVinError(data?.error || "VIN not found. Please check and try again.");
        return;
      }
      const vehicle = data.vehicle;
      setVinVehicle(vehicle);
      const searchQuery = vehicle.model
        ? `${vehicle.make} ${vehicle.model} ${vehicle.year}`.trim()
        : `${vehicle.make} ${vehicle.year}`.trim();
      navigate(`/search?q=${encodeURIComponent(searchQuery)}&vin=${cleaned}&vehicle=${encodeURIComponent(JSON.stringify(vehicle))}`);
    } catch {
      setVinError("Failed to decode VIN. Please try again.");
    } finally {
      setVinLoading(false);
    }
  };




  return (
    <section
      id="home"
      className="relative flex items-center justify-center pt-16 overflow-x-visible overflow-y-hidden animated-gradient-bg"
      style={{
        minHeight: "70vh",
        backgroundImage:
          "radial-gradient(ellipse 80% 40% at 50% -10%, rgba(204,17,17,0.12) 0%, transparent 70%), radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)",
        backgroundSize: "auto, 24px 24px",
        backgroundRepeat: "no-repeat, repeat",
      }}
    >
      {/* Background glow orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-primary/6 blur-[180px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-primary/4 blur-[140px] pointer-events-none" />

      <div className="container relative z-10 text-center px-4 py-10 sm:py-14">
        {/* Badge */}
        <div className={`transition-[colors,transform] ease-out ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-border/40 bg-card/30 backdrop-blur-md text-xs text-muted-foreground mb-10">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            ⚡ 1,000,000+ parts searchable · Free to compare
          </div>
        </div>

        {/* Heading */}
        <div className={`transition-[colors,transform] ease-out delay-100 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <h1
            className="font-display mb-5"
            style={{
              fontSize: "clamp(44px, 5.5vw, 72px)",
              fontWeight: 800,
              letterSpacing: "-0.04em",
              lineHeight: 1.0,
              color: "#ffffff",
            }}
          >
            Find Any Car Part
            <br />
            <span style={{ color: "#cc1111", letterSpacing: "-0.04em" }}>Instantly.</span>
          </h1>
        </div>

        {/* Subtitle */}
        <div className={`transition-[colors,transform] ease-out delay-200 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <p
            style={{
              fontSize: "17px",
              color: "#71717a",
              fontWeight: 400,
              maxWidth: "460px",
              margin: "0 auto",
              lineHeight: 1.65,
            }}
          >
            Search 1,000,000+ parts from trusted UK & global suppliers.
          </p>
          {isReturning && (
            <p
              className="animate-fade-in"
              style={{
                fontSize: "13px",
                color: "#a1a1aa",
                marginTop: "10px",
                fontWeight: 500,
              }}
            >
              👋 Welcome back! Ready to find your part?
            </p>
          )}
        </div>

        {/* Trust strip */}
        <div
          className={`flex justify-center transition-[colors,transform] ease-out delay-200 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          style={{ gap: "8px", margin: "16px 0", flexWrap: "wrap" }}
        >
          {["✓ Free to use", "✓ No account needed", "✓ 1M+ parts"].map((label) => (
            <span
              key={label}
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#71717a",
                fontSize: "12px",
                fontWeight: 500,
                padding: "4px 12px",
                borderRadius: "999px",
                whiteSpace: "nowrap",
              }}
            >
              {label}
            </span>
          ))}
        </div>

        {/* Search section */}
        <div className={`transition-[colors,transform] ease-out delay-300 mt-6 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
          <div id="search" className="max-w-3xl mx-auto">
            {/* Tabs — Mobile (scrollable) */}
            <div
              className="md:hidden tab-scroll-container flex"
              style={{
                gap: "8px",
                paddingLeft: "16px",
                paddingRight: "16px",
                paddingBottom: "8px",
                marginBottom: "12px",
                overflowX: "auto",
                overflowY: "visible",
                WebkitOverflowScrolling: "touch",
                scrollbarWidth: "none",
                msOverflowStyle: "none",
                width: "100%",
              }}
            >
              <button
                onClick={() => setActiveTab("part")}
                style={{
                  flexShrink: 0,
                  whiteSpace: "nowrap",
                  padding: "7px 12px",
                  fontSize: "13px",
                  borderRadius: "999px",
                  border: activeTab === "part" ? "none" : "1px solid rgba(255,255,255,0.1)",
                  background: activeTab === "part" ? "hsl(var(--primary))" : "rgba(255,255,255,0.06)",
                  color: activeTab === "part" ? "hsl(var(--primary-foreground))" : "rgba(255,255,255,0.55)",
                  fontWeight: activeTab === "part" ? 600 : 500,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                <Search size={13} style={{ flexShrink: 0 }} />
                Parts
              </button>
              <button
                onClick={() => setActiveTab("plate")}
                style={{
                  flexShrink: 0,
                  whiteSpace: "nowrap",
                  padding: "7px 12px",
                  fontSize: "13px",
                  borderRadius: "999px",
                  border: activeTab === "plate" ? "none" : "1px solid rgba(255,255,255,0.1)",
                  background: activeTab === "plate" ? "hsl(var(--primary))" : "rgba(255,255,255,0.06)",
                  color: activeTab === "plate" ? "hsl(var(--primary-foreground))" : "rgba(255,255,255,0.55)",
                  fontWeight: activeTab === "plate" ? 600 : 500,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                <Car size={13} style={{ flexShrink: 0 }} />
                Reg Plate UK
              </button>
              <button
                onClick={() => setActiveTab("vin")}
                style={{
                  flexShrink: 0,
                  whiteSpace: "nowrap",
                  padding: "7px 12px",
                  fontSize: "13px",
                  borderRadius: "999px",
                  border: activeTab === "vin" ? "none" : "1px solid rgba(255,255,255,0.1)",
                  background: activeTab === "vin" ? "hsl(var(--primary))" : "rgba(255,255,255,0.06)",
                  color: activeTab === "vin" ? "hsl(var(--primary-foreground))" : "rgba(255,255,255,0.55)",
                  fontWeight: activeTab === "vin" ? 600 : 500,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                🌍 VIN
              </button>
              <button
                onClick={() => navigate("/tyres")}
                style={{
                  flexShrink: 0,
                  whiteSpace: "nowrap",
                  padding: "7px 12px",
                  fontSize: "13px",
                  borderRadius: "999px",
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(255,255,255,0.06)",
                  color: "rgba(255,255,255,0.55)",
                  fontWeight: 500,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                <img
                  src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f6de.png"
                  width={13}
                  height={13}
                  alt=""
                  loading="lazy"
                  style={{ flexShrink: 0 }}
                />
                Tyres
              </button>
            </div>

            {/* Tabs — Desktop (animated underline) */}
            <DesktopTabsBar activeTab={activeTab} setActiveTab={setActiveTab} navigate={navigate} />


            {/* Part search */}
            {activeTab === "part" ? (
              <>
                <div className="relative">
                <form
                  onSubmit={(e) => { setAutoOpen(false); handleSearch(e); }}
                  className="hero-search-form flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "14px",
                    transition: "border-color 150ms ease, box-shadow 150ms ease",
                  }}
                >
                  <div className="flex-1 flex items-center gap-3 px-3 sm:min-h-[52px]">
                    <SearchBarGarageDropdown onSelect={(vq) => setQuery((prev) => prev.trim() ? `${vq} ${prev.trim()}` : vq)} />
                    <Search style={{ color: "#52525b", flexShrink: 0 }} size={18} />
                    <input
                      ref={heroInputRef}
                      type="text"
                      placeholder="e.g. BMW E46 brake pads, Ford Focus clutch..."
                      value={query}
                      onChange={(e) => { setQuery(e.target.value); setAutoOpen(true); }}
                      onFocus={() => setAutoOpen(true)}
                      className="hero-search-input w-full bg-transparent outline-none text-sm sm:text-[15px] py-3"
                      style={{ color: "#ffffff" }}
                      disabled={identifying}
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck={false}
                      title="Press / to search"
                    />
                  </div>
                  <div className="flex items-center gap-2 px-1">
                    <label className={`cursor-pointer shrink-0 flex-1 sm:flex-none ${identifying ? "pointer-events-none opacity-60" : ""}`}>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePhotoUpload}
                        disabled={identifying}
                      />
                      <div
                        className="flex items-center justify-center gap-2 transition-colors"
                        style={{
                          background: "transparent",
                          border: "1px solid rgba(255,255,255,0.1)",
                          color: "#a1a1aa",
                          borderRadius: "10px",
                          fontSize: "13px",
                          padding: "0 14px",
                          height: "44px",
                        }}
                      >
                        {identifying ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            <span>Identifying...</span>
                          </>
                        ) : (
                          <>
                            <Camera size={16} />
                            <span className="sm:hidden">Photo</span>
                            <span className="hidden sm:inline">Photo Search</span>
                          </>
                        )}
                      </div>
                    </label>
                    {user && searchLimit.limitReached ? (
                      <button
                        type="button"
                        onClick={() => navigate("/pricing")}
                        className="shrink-0 flex-1 sm:flex-none flex items-center justify-center gap-1 transition-colors"
                        style={{
                          background: "#cc1111",
                          color: "#ffffff",
                          borderRadius: "10px",
                          fontWeight: 600,
                          fontSize: "15px",
                          height: "44px",
                          padding: "0 24px",
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        <ArrowUp size={14} />
                        Upgrade
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={identifying}
                        className="shrink-0 flex-1 sm:flex-none transition-transform disabled:opacity-60 hover:scale-[1.02]"
                        style={{
                          background: "#cc1111",
                          color: "#ffffff",
                          borderRadius: "10px",
                          fontWeight: 600,
                          fontSize: "15px",
                          height: "44px",
                          padding: "0 24px",
                          border: "none",
                          cursor: identifying ? "not-allowed" : "pointer",
                          transitionDuration: "150ms",
                        }}
                      >
                        Search
                      </button>
                    )}
                  </div>
                </form>
                <SearchAutocomplete
                  query={query}
                  open={autoOpen}
                  inputRef={heroInputRef}
                  onClose={() => setAutoOpen(false)}
                  onSelect={(q) => {
                    setQuery(q);
                    setAutoOpen(false);
                    if (!user) { setAuthGateOpen(true); return; }
                    if (searchLimit.limitReached) {
                      toast({ title: "Search limit reached", description: "Upgrade to Pro for unlimited searches.", variant: "destructive" });
                      navigate("/pricing");
                      return;
                    }
                    navigate(`/search?q=${encodeURIComponent(q)}`);
                  }}
                />
                </div>
                <div className="flex flex-col items-center mt-4 gap-2">
                  <p
                    style={{
                      color: "#71717a",
                      fontSize: "12px",
                      marginTop: "8px",
                      textAlign: "center",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <span
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "999px",
                        background: "#4ade80",
                        boxShadow: "0 0 8px rgba(74,222,128,0.6)",
                        display: "inline-block",
                      }}
                      className="animate-pulse"
                    />
                    <span key={viewers} style={{ color: "#d4d4d8", fontWeight: 500 }} className="animate-fade-in">
                      {viewers}
                    </span>
                    people searching right now
                  </p>
                  <p
                    className="text-xs text-muted-foreground flex items-center justify-center gap-1.5 text-center leading-tight"
                    style={{ flexWrap: "nowrap" }}
                  >
                    <ImageIcon
                      size={12}
                      className="text-muted-foreground/70"
                      style={{ flexShrink: 0, width: 14, height: 14 }}
                    />
                    <span style={{ whiteSpace: "nowrap" }}>Upload a photo to identify any part</span>
                  </p>
                  {user && <SearchCounter limitData={searchLimit} />}
                  <div className="flex items-center justify-center mt-3">
                    <a
                      href="#mission"
                      onClick={(e) => {
                        e.preventDefault();
                        document.getElementById('mission-section')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors group"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse flex-shrink-0" />
                      ✨ New? Get your first month Pro free · No card needed →
                    </a>
                  </div>
                </div>

                {/* Photo identification results */}
                {photoResult && (
                  <div className="mt-6 bg-card border border-border rounded-2xl p-5 text-left max-w-3xl mx-auto">
                    {/* Garage vehicle banner */}
                    {garageVehicle ? (
                      <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-blue-950/30 border border-blue-800/30 rounded-xl">
                        <span className="text-blue-400 text-sm">🚗</span>
                        <span className="text-blue-300 text-xs">
                          Searching for your {garageVehicle.make} {garageVehicle.model}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-secondary/50 border border-border/30 rounded-xl">
                        <span className="text-muted-foreground text-xs">
                          💡 Add your car to My Garage for more accurate results
                        </span>
                        <a href="/garage" className="text-primary text-xs underline ml-auto">
                          Add car →
                        </a>
                      </div>
                    )}
                    {/* Part identified */}
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary flex-shrink-0">
                        🔍
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">
                          Part Identified
                        </p>
                        {editingPartName ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editedPartName}
                              onChange={(e) => setEditedPartName(e.target.value)}
                              className="bg-secondary border border-border rounded-lg px-3 py-1.5 text-foreground font-bold text-lg flex-1 outline-none focus:ring-1 focus:ring-primary"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && editedPartName.trim()) {
                                  const smartTerms = buildPhotoSearchTerms(
                                    editedPartName.trim(),
                                    { detectedMake: photoResult.detectedMake, detectedPartNumber: photoResult.detectedPartNumber },
                                    garageVehicle,
                                  );
                                  setPhotoResult({
                                    ...photoResult,
                                    partName: editedPartName.trim(),
                                    searchTerms: smartTerms.map(t => t.term),
                                    _smartLabels: smartTerms.map(t => ({ label: t.label, icon: t.icon })),
                                  });
                                  setEditingPartName(false);
                                }
                              }}
                            />
                            <button
                              onClick={() => {
                                if (editedPartName.trim()) {
                                  const smartTerms = buildPhotoSearchTerms(
                                    editedPartName.trim(),
                                    { detectedMake: photoResult.detectedMake, detectedPartNumber: photoResult.detectedPartNumber },
                                    garageVehicle,
                                  );
                                  setPhotoResult({
                                    ...photoResult,
                                    partName: editedPartName.trim(),
                                    searchTerms: smartTerms.map(t => t.term),
                                    _smartLabels: smartTerms.map(t => ({ label: t.label, icon: t.icon })),
                                  });
                                  setEditingPartName(false);
                                }
                              }}
                              className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                            >
                              Update
                            </button>
                            <button
                              onClick={() => { setEditingPartName(false); setEditedPartName(photoResult.partName); }}
                              className="px-3 py-1.5 bg-secondary text-muted-foreground rounded-lg text-sm hover:bg-secondary/80 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <p className="text-foreground font-bold text-lg">{photoResult.partName}</p>
                            <button
                              onClick={() => { setEditingPartName(true); setEditedPartName(photoResult.partName); }}
                              className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                              title="Edit part name"
                            >
                              <Pencil size={14} />
                            </button>
                          </div>
                        )}
                        <div className="flex gap-2 mt-1">
                          {photoResult.category && (
                            <span className="text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded-full">
                              {photoResult.category}
                            </span>
                          )}
                          {photoResult.condition && (
                            <span className="text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded-full">
                              {photoResult.condition}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Compatible vehicles */}
                    {photoResult.compatibleVehicles.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                          Compatible Vehicles
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {photoResult.compatibleVehicles.map((v) => (
                            <span key={v} className="px-2.5 py-1 bg-blue-950/40 border border-blue-800/30 text-blue-300 text-xs rounded-full">
                              🚗 {v}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recommended brands */}
                    {photoResult.brands.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                          Top Brands
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {photoResult.brands.map((b) => (
                            <span key={b} className="px-2.5 py-1 bg-secondary text-muted-foreground text-xs rounded-full font-medium">
                              {b}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Search buttons */}
                    {photoResult.searchTerms.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                          Search Results
                        </p>
                        {photoResult.searchTerms.map((term, i) => {
                          const smartLabel = photoResult._smartLabels?.[i];
                          return (
                            <button
                              key={i}
                              onClick={() => navigate(`/search?q=${encodeURIComponent(term)}&photo=1`)}
                              className="flex items-center justify-between w-full p-3 bg-secondary hover:bg-secondary/80 rounded-xl transition-colors group text-left"
                            >
                              <div className="flex items-center gap-2">
                                {smartLabel && <span className="text-sm">{smartLabel.icon}</span>}
                                <div>
                                  {smartLabel && (
                                    <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider block">
                                      {smartLabel.label}
                                    </span>
                                  )}
                                  <span className="text-sm text-muted-foreground group-hover:text-foreground">
                                    {term}
                                  </span>
                                </div>
                              </div>
                              <span className="text-xs text-muted-foreground/60 group-hover:text-muted-foreground">
                                Search →
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Confidence indicator */}
                    <p className="text-xs text-muted-foreground/50 mt-3 text-center">
                      Confidence: {photoResult.confidence === "high" ? "🟢 High" : photoResult.confidence === "medium" ? "🟡 Medium" : "🔴 Low"}
                    </p>
                  </div>
                )}
              </>
            ) : activeTab === "plate" ? (
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
            ) : (
              <>
                <form onSubmit={handleVinLookup} className="flex items-center gap-2 p-2 sm:p-2.5 rounded-2xl glass glow-focus">
                  <div className="flex-1 relative">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={vinNumber}
                      onChange={(e) => { setVinNumber(e.target.value.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, "").slice(0, 17)); setVinError(""); }}
                      placeholder="Enter 17-character VIN"
                      className="pl-11 bg-transparent border-0 h-13 rounded-xl uppercase tracking-widest font-mono font-bold text-foreground placeholder:text-muted-foreground focus-visible:ring-0"
                      maxLength={17}
                      disabled={vinLoading}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-mono">
                      {vinNumber.length}/17
                    </span>
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
                    <Button type="submit" className="shrink-0 rounded-xl px-7 py-3.5 h-auto text-sm font-semibold" disabled={vinLoading || vinNumber.length !== 17}>
                      {vinLoading ? <Loader2 size={16} className="animate-spin" /> : "Lookup"}
                    </Button>
                  )}
                </form>
                {vinError && (
                  <p className="text-xs text-destructive mt-3 text-center">{vinError}</p>
                )}
                {vinVehicle && (
                  <div className="mt-4 bg-card/60 backdrop-blur-md border border-border/40 rounded-2xl p-5 text-left">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">🌍</span>
                        <div>
                          <h3 className="text-lg font-bold text-foreground">
                            {vinVehicle.make} {vinVehicle.model}
                            {vinVehicle.year && <span className="text-muted-foreground font-normal ml-2">({vinVehicle.year})</span>}
                          </h3>
                          {vinVehicle.series && <p className="text-xs text-muted-foreground">{vinVehicle.series}</p>}
                        </div>
                      </div>
                      <span className="text-xs font-mono bg-secondary px-3 py-1 rounded-lg text-muted-foreground">{vinVehicle.vin}</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {vinVehicle.engine && <div><p className="text-[10px] text-muted-foreground uppercase tracking-wide">Engine</p><p className="text-sm font-semibold text-foreground">{vinVehicle.engine}</p></div>}
                      {vinVehicle.fuel && <div><p className="text-[10px] text-muted-foreground uppercase tracking-wide">Fuel</p><p className="text-sm font-semibold text-foreground">{vinVehicle.fuel}</p></div>}
                      {vinVehicle.transmission && <div><p className="text-[10px] text-muted-foreground uppercase tracking-wide">Transmission</p><p className="text-sm font-semibold text-foreground">{vinVehicle.transmission}</p></div>}
                      {vinVehicle.bodyClass && <div><p className="text-[10px] text-muted-foreground uppercase tracking-wide">Body</p><p className="text-sm font-semibold text-foreground">{vinVehicle.bodyClass}</p></div>}
                      {vinVehicle.country && <div><p className="text-[10px] text-muted-foreground uppercase tracking-wide">Made in</p><p className="text-sm font-semibold text-foreground">{vinVehicle.country}</p></div>}
                      {vinVehicle.drive && <div><p className="text-[10px] text-muted-foreground uppercase tracking-wide">Drive</p><p className="text-sm font-semibold text-foreground">{vinVehicle.drive}</p></div>}
                    </div>
                  </div>
                )}
                {!vinError && !vinVehicle && (
                  <p className="text-xs text-muted-foreground mt-4 text-center">
                    Works for vehicles from USA, Germany, Japan, and 50+ countries
                  </p>
                )}
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
        <div className={`transition-[colors,transform] ease-out delay-500 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <section className="py-12 px-4 max-w-2xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-[10px] uppercase tracking-[0.2em] text-green-400 font-bold">
                  Partners
                </span>
                <h2 className="text-base font-bold text-white tracking-tight">
                  Active Integrations
                </h2>
              </div>
              <div className="inline-flex items-center gap-1.5 text-[10px] bg-green-500/10 border border-green-500/20 text-green-400 rounded-full px-2 py-0.5 font-bold">
                <span className="w-1 h-1 rounded-full bg-green-400 animate-pulse" />
                7 Live
              </div>
            </div>

            {/* Compact inline list */}
            <div className="divide-y divide-zinc-800/40">
              {[
                { name: 'eBay Global', cat: 'All Car Parts', coverage: 'Worldwide · 1M+ parts', twemoji: '1f30d', url: null as string | null },
                { name: 'mytyres.co.uk', cat: 'Tyres', coverage: 'UK + 35 countries', twemoji: '1f1ec-1f1e7', url: 'https://www.awin1.com/cread.php?awinmid=4118&awinaffid=2845282&clickref=partara-suppliers&p=https%3A%2F%2Fwww.mytyres.co.uk' },
                { name: 'Tyres UK', cat: 'Tyres', coverage: '64 countries', twemoji: '1f30d', url: 'https://www.awin1.com/cread.php?awinmid=12715&awinaffid=2845282&clickref=partara-suppliers&p=https%3A%2F%2Fwww.tyres.net' },
                { name: 'Green Spark Plug Co.', cat: 'Classic Parts', coverage: 'Worldwide shipping', twemoji: '1f1ec-1f1e7', url: 'https://www.awin1.com/cread.php?awinmid=16976&awinaffid=2845282&clickref=partara-suppliers&p=https%3A%2F%2Fwww.greenspark.co.uk' },
                { name: 'neumaticos-online.es', cat: 'Tyres', coverage: 'Spain only', twemoji: '1f1ea-1f1f8', url: 'https://www.awin1.com/cread.php?awinmid=10499&awinaffid=2845282&clickref=partara-suppliers&p=https%3A%2F%2Fwww.neumaticos-online.es' },
                { name: 'Pneumatici IT', cat: 'Tyres', coverage: 'Italy only', twemoji: '1f1ee-1f1f9', url: 'https://www.awin1.com/cread.php?awinmid=12716&awinaffid=2845282&clickref=partara-suppliers&p=https%3A%2F%2Fwww.pneumatici.it' },
                { name: 'ReifenDirekt EE', cat: 'Tyres', coverage: 'Estonia, Latvia, Lithuania', twemoji: '1f1ea-1f1ea', url: 'https://www.awin1.com/cread.php?awinmid=10747&awinaffid=2845282&clickref=partara-suppliers&p=https%3A%2F%2Fwww.reifendirekt.co.ee' },
              ].map(s => {
                const rowClass = "flex items-center gap-3 py-2.5 hover:bg-zinc-900/40 -mx-2 px-2 rounded-lg transition-colors group";
                const inner = (
                  <>
                    <img
                      src={`https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/${s.twemoji}.png`}
                      width={18}
                      height={18}
                      loading="lazy"
                      decoding="async"
                      alt=""
                      className="flex-shrink-0 opacity-90"
                    />
                    <span className="text-white text-sm font-medium truncate">{s.name}</span>
                    <span className="text-zinc-600 text-xs hidden sm:inline">·</span>
                    <span className="text-zinc-500 text-xs hidden sm:inline truncate">{s.cat}</span>
                    <span className="text-zinc-600 text-xs hidden md:inline truncate ml-auto">{s.coverage}</span>
                    <span className="flex-shrink-0 text-[9px] text-green-400 font-bold tracking-wider sm:ml-0 ml-auto">
                      LIVE
                    </span>
                  </>
                );
                return s.url ? (
                  <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer sponsored" className={rowClass}>
                    {inner}
                  </a>
                ) : (
                  <div key={s.name} className={rowClass}>{inner}</div>
                );
              })}
            </div>

            {/* Coming soon */}
            <div className="mt-5 flex flex-wrap items-center gap-1.5">
              <span className="text-zinc-600 text-[10px] font-semibold uppercase tracking-wider mr-1">
                Coming soon:
              </span>
              {['Amazon','Euro Car Parts','GSF Car Parts','Autodoc','Halfords','Black Circles'].map(n => (
                <span key={n} className="text-[10px] text-zinc-500">{n}</span>
              ))}
            </div>
          </section>
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

/* ── Desktop tab bar with smoothly sliding underline ─────────────────── */
type TabKey = "part" | "plate" | "vin";
const DESKTOP_TABS: { key: TabKey | "tyres"; label: string; icon: React.ReactNode }[] = [
  { key: "part", label: "Parts", icon: <Search size={14} style={{ flexShrink: 0 }} /> },
  { key: "plate", label: "Reg Plate UK", icon: <Car size={14} style={{ flexShrink: 0 }} /> },
  { key: "vin", label: "VIN", icon: <span style={{ fontSize: 13 }}>🌍</span> },
  {
    key: "tyres",
    label: "Tyres",
    icon: (
      <img
        src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f6de.png"
        width={14}
        height={14}
        alt=""
        loading="lazy"
        style={{ flexShrink: 0 }}
      />
    ),
  },
];

const DesktopTabsBar = ({
  activeTab,
  setActiveTab,
  navigate,
}: {
  activeTab: TabKey;
  setActiveTab: (t: TabKey) => void;
  navigate: (path: string) => void;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [indicator, setIndicator] = useState<{ left: number; width: number }>({ left: 0, width: 0 });

  useEffect(() => {
    const el = tabRefs.current[activeTab];
    const wrap = containerRef.current;
    if (!el || !wrap) return;
    const elRect = el.getBoundingClientRect();
    const wrapRect = wrap.getBoundingClientRect();
    setIndicator({ left: elRect.left - wrapRect.left, width: elRect.width });
  }, [activeTab]);

  return (
    <div
      ref={containerRef}
      className="hidden md:flex md:items-center md:justify-center md:gap-7 md:mb-5 relative"
      style={{ borderBottom: "1px solid #1f1f1f" }}
    >
      {DESKTOP_TABS.map((tab) => {
        const isActive = tab.key === activeTab;
        const handleClick = () => {
          if (tab.key === "tyres") {
            navigate("/tyres");
          } else {
            setActiveTab(tab.key as TabKey);
          }
        };
        return (
          <button
            key={tab.key}
            ref={(el) => (tabRefs.current[tab.key] = el)}
            onClick={handleClick}
            style={{
              flexShrink: 0,
              whiteSpace: "nowrap",
              padding: "8px 2px",
              background: "transparent",
              border: "none",
              color: isActive ? "#ffffff" : "#52525b",
              fontSize: "13px",
              fontWeight: isActive ? 600 : 400,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "color 200ms ease",
            }}
            onMouseEnter={(e) => {
              if (!isActive) e.currentTarget.style.color = "#a1a1aa";
            }}
            onMouseLeave={(e) => {
              if (!isActive) e.currentTarget.style.color = "#52525b";
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        );
      })}
      <span
        aria-hidden
        style={{
          position: "absolute",
          bottom: -1,
          left: indicator.left,
          width: indicator.width,
          height: 2,
          background: "#cc1111",
          borderRadius: 2,
          transition: "left 300ms cubic-bezier(0.4, 0, 0.2, 1), width 300ms cubic-bezier(0.4, 0, 0.2, 1)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
};
