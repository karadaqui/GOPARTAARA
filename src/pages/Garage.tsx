import { useState, useEffect } from "react";
import AuthGateModal from "@/components/AuthGateModal";
import UpgradeModal from "@/components/UpgradeModal";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import BackToTop from "@/components/BackToTop";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Car, Plus, Trash2, Loader2, X, Search, Fuel, Calendar, Palette, Gauge,
  Truck, CarFront,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { getMakes, getModels, getYears, getAllYears } from "@/data/vehicleDatabase";
import VehicleExpiryBadges from "@/components/garage/VehicleExpiryBadges";
import VehicleExpiryEditor from "@/components/garage/VehicleExpiryEditor";

interface Vehicle {
  id: string;
  nickname: string | null;
  make: string;
  model: string;
  year: number;
  engine_size: string | null;
  registration_number: string | null;
  created_at: string;
  mot_expiry_date?: string | null;
  tax_expiry_date?: string | null;
}

const ENGINE_SIZES = ["1.0L","1.2L","1.4L","1.5L","1.6L","1.8L","2.0L","2.2L","2.4L","2.5L","3.0L","3.5L","4.0L","5.0L","Electric"];

// Detect vehicle type icon from make/model
const getVehicleIcon = (make: string, model: string) => {
  const m = `${make} ${model}`.toLowerCase();
  const suvKeywords = ["suv","x1","x3","x5","x6","x7","rav4","cr-v","crv","tucson","sportage","tiguan","q3","q5","q7","evoque","discovery","defender","range rover","cayenne","macan","outlander","qashqai","juke","kuga","ecosport","t-roc","karoq","kodiaq","ateca","forester","vitara"];
  const estateKeywords = ["estate","touring","avant","sw","wagon","sportback","variant","combi","break","tourer"];
  const truckKeywords = ["pickup","hilux","ranger","navara","l200","amarok","truck"];
  if (suvKeywords.some(k => m.includes(k))) return Truck;
  if (estateKeywords.some(k => m.includes(k))) return Car;
  if (truckKeywords.some(k => m.includes(k))) return Truck;
  return CarFront;
};

const Garage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPro, setIsPro] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [authGateOpen, setAuthGateOpen] = useState(false);

  // Form state
  const [mode, setMode] = useState<"manual" | "plate">("manual");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [engineSize, setEngineSize] = useState("");
  const [nickname, setNickname] = useState("");
  const [regNumber, setRegNumber] = useState("");
  const [regLoading, setRegLoading] = useState(false);
  const [dvlaVehicle, setDvlaVehicle] = useState<any>(null);
  const [needsModelConfirm, setNeedsModelConfirm] = useState(false);
  const [confirmedModel, setConfirmedModel] = useState("");

  const PAID_PLANS = ["pro","elite","admin"];

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    const [{ data: vehs }, { data: profile }] = await Promise.all([
      supabase.from("user_vehicles").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("profiles").select("subscription_plan").eq("user_id", user.id).single(),
    ]);
    setVehicles((vehs as Vehicle[]) || []);
    setIsPro(PAID_PLANS.includes(profile?.subscription_plan || "free"));
    setLoading(false);
  };

  const canAddMore = isPro || vehicles.length < 1;

  const handleAddClick = () => {
    if (!user) { setAuthGateOpen(true); return; }
    if (!canAddMore) { setUpgradeOpen(true); return; }
    setShowForm(true);
  };

  const handleRegLookup = async () => {
    const cleaned = regNumber.replace(/\s+/g, "").toUpperCase();
    if (!cleaned || cleaned.length < 2) return;
    setRegLoading(true);
    setDvlaVehicle(null);
    setNeedsModelConfirm(false);
    try {
      const { data, error } = await supabase.functions.invoke("vehicle-lookup", {
        body: { registrationNumber: cleaned },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const v = data.vehicle;
      setDvlaVehicle(v);
      setMake(v.make || "");
      setYear(v.yearOfManufacture?.toString() || "");
      if (v.engineCapacity) {
        const litres = (v.engineCapacity / 1000).toFixed(1) + "L";
        setEngineSize(litres);
      }
      setNeedsModelConfirm(true);
      setConfirmedModel("");
      toast({ title: `Found: ${v.make}`, description: `${v.yearOfManufacture || ""} ${v.colour || ""}`.trim() });
    } catch (err: any) {
      toast({ title: "Lookup failed", description: err.message, variant: "destructive" });
    } finally {
      setRegLoading(false);
    }
  };

  const handleSave = async () => {
    const finalModel = needsModelConfirm ? confirmedModel : model;
    if (!make || !finalModel || !year) {
      toast({ title: "Missing fields", description: "Make, model and year are required.", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("user_vehicles").insert({
      user_id: user!.id,
      make,
      model: finalModel,
      year: parseInt(year),
      engine_size: engineSize || null,
      nickname: nickname.trim() || null,
      registration_number: regNumber.trim().toUpperCase() || null,
    } as any);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Vehicle added!" });
      resetForm();
      await loadData();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("user_vehicles").delete().eq("id", id);
    setVehicles(prev => prev.filter(v => v.id !== id));
  };

  const resetForm = () => {
    setMake(""); setModel(""); setYear(""); setEngineSize(""); setNickname("");
    setRegNumber(""); setDvlaVehicle(null); setNeedsModelConfirm(false);
    setConfirmedModel(""); setShowForm(false); setMode("manual");
  };

  const getModelPlaceholder = (mk: string) => {
    const placeholders: Record<string, string> = {
      "Ford": "e.g. Focus, Fiesta, Mustang",
      "BMW": "e.g. 3 Series, X5, M3",
      "Mercedes-Benz": "e.g. C-Class, E-Class, GLC",
      "Audi": "e.g. A3, A4, Q5",
      "Volkswagen": "e.g. Golf, Polo, Tiguan",
      "Toyota": "e.g. Yaris, Corolla, RAV4",
      "Honda": "e.g. Civic, CR-V, Jazz",
      "Vauxhall": "e.g. Corsa, Astra, Mokka",
    };
    return placeholders[mk] || "e.g. Model name";
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="My Garage | PARTARA" description="Save and manage your vehicles to find compatible parts faster." path="/garage" />
      <Navbar />

      <div className="container max-w-4xl py-20 px-6 md:px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
              My <span className="text-primary">Garage</span>
            </h1>
            <p className="text-muted-foreground">Save your vehicles and find compatible parts faster.</p>
          </div>
          <Button onClick={handleAddClick} className="rounded-xl gap-2">
            <Plus size={16} />
            <span className="hidden sm:inline">Add Vehicle</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>

        {!user && (
          <div className="glass rounded-2xl p-12 text-center">
            <Car size={48} className="text-primary mx-auto mb-4" />
            <h2 className="font-display text-xl font-bold mb-2">Sign in to use My Garage</h2>
            <p className="text-muted-foreground mb-6">Save your vehicles and get personalised part searches.</p>
            <Button onClick={() => navigate("/auth")} className="rounded-xl">Get Started</Button>
          </div>
        )}

        {user && loading && (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        )}

        {/* Add Vehicle Form */}
        {showForm && (
          <div className="glass rounded-2xl p-6 md:p-8 mb-8 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-lg font-semibold">Add a Vehicle</h2>
              <button onClick={resetForm} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
            </div>

            {/* Mode toggle */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setMode("manual")}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${mode === "manual" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
              >
                Manual Entry
              </button>
              <button
                onClick={() => setMode("plate")}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${mode === "plate" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
              >
                🇬🇧 Plate Lookup
              </button>
            </div>

            {mode === "plate" && (
              <div className="mb-6">
                <label className="text-xs text-muted-foreground mb-1.5 block">UK Number Plate</label>
                <div className="flex gap-2">
                  <Input
                    value={regNumber}
                    onChange={e => setRegNumber(e.target.value.toUpperCase())}
                    placeholder="AB12 CDE"
                    className="rounded-xl bg-secondary border-border uppercase tracking-widest font-mono font-bold"
                    maxLength={10}
                  />
                  <Button onClick={handleRegLookup} disabled={regLoading || !regNumber.trim()} className="rounded-xl px-6">
                    {regLoading ? <Loader2 size={16} className="animate-spin" /> : "Lookup"}
                  </Button>
                </div>

                {dvlaVehicle && (
                  <div className="mt-4 p-4 rounded-xl bg-secondary/50 border border-border space-y-2">
                    <p className="text-sm font-semibold text-foreground">{dvlaVehicle.make} — {dvlaVehicle.yearOfManufacture}</p>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      {dvlaVehicle.colour && (
                        <span className="flex items-center gap-1"><Palette size={12} /> {dvlaVehicle.colour}</span>
                      )}
                      {dvlaVehicle.fuelType && (
                        <span className="flex items-center gap-1"><Fuel size={12} /> {dvlaVehicle.fuelType}</span>
                      )}
                      {dvlaVehicle.engineCapacity && (
                        <span className="flex items-center gap-1"><Gauge size={12} /> {dvlaVehicle.engineCapacity}cc</span>
                      )}
                    </div>
                    <div className="mt-3">
                      <label className="text-xs text-muted-foreground mb-1 block">Confirm Model *</label>
                      {dvlaVehicle?.make && getModels(dvlaVehicle.make).length > 0 ? (
                        <Select value={confirmedModel} onValueChange={setConfirmedModel}>
                          <SelectTrigger className="rounded-xl bg-secondary border-border"><SelectValue placeholder="Select model" /></SelectTrigger>
                          <SelectContent>
                            {getModels(dvlaVehicle.make).map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          value={confirmedModel}
                          onChange={e => setConfirmedModel(e.target.value)}
                          placeholder={getModelPlaceholder(dvlaVehicle.make)}
                          className="rounded-xl bg-secondary border-border"
                        />
                      )}
                      <p className="text-[10px] text-muted-foreground mt-1">DVLA doesn't provide the model — please select or enter it for accurate search results.</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {(mode === "manual" || dvlaVehicle) && (
              <div className="space-y-4">
                {mode === "manual" && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Make *</label>
                        <Select value={make} onValueChange={(v) => { setMake(v); setModel(""); setYear(""); }}>
                          <SelectTrigger className="rounded-xl bg-secondary border-border"><SelectValue placeholder="Select make" /></SelectTrigger>
                          <SelectContent>
                            {getMakes().map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Model *</label>
                        {make && getModels(make).length > 0 ? (
                          <Select value={model} onValueChange={(v) => { setModel(v); setYear(""); }}>
                            <SelectTrigger className="rounded-xl bg-secondary border-border"><SelectValue placeholder="Select model" /></SelectTrigger>
                            <SelectContent>
                              {getModels(make).map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input value={model} onChange={e => setModel(e.target.value)} placeholder={getModelPlaceholder(make)} className="rounded-xl bg-secondary border-border" />
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Year *</label>
                        <Select value={year} onValueChange={setYear}>
                          <SelectTrigger className="rounded-xl bg-secondary border-border"><SelectValue placeholder="Select year" /></SelectTrigger>
                          <SelectContent>
                            {(make && model ? getYears(make, model) : getAllYears()).map(y => (
                              <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Engine Size</label>
                        <Select value={engineSize} onValueChange={setEngineSize}>
                          <SelectTrigger className="rounded-xl bg-secondary border-border"><SelectValue placeholder="Optional" /></SelectTrigger>
                          <SelectContent>{ENGINE_SIZES.map(es => <SelectItem key={es} value={es}>{es}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </div>
                  </>
                )}
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Nickname (optional)</label>
                  <Input value={nickname} onChange={e => setNickname(e.target.value)} placeholder="e.g. My Daily Driver" className="rounded-xl bg-secondary border-border" />
                </div>
                <Button onClick={handleSave} disabled={saving} className="w-full rounded-xl gap-2">
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                  Save Vehicle
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Vehicle cards */}
        {user && !loading && vehicles.length === 0 && !showForm && (
          <div className="glass rounded-2xl p-12 text-center">
            <Car size={48} className="text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No vehicles saved yet. Add your first car!</p>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          {vehicles.map(v => {
            const VehicleIcon = getVehicleIcon(v.make, v.model);
            return (
              <div key={v.id} className="glass rounded-2xl p-6 group hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <VehicleIcon size={24} className="text-primary" />
                  </div>
                  <button
                    onClick={() => handleDelete(v.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive p-1"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <h3 className="font-display text-lg font-bold mb-1">{v.make} {v.model}</h3>
                {v.nickname && <p className="text-sm text-muted-foreground mb-2">"{v.nickname}"</p>}
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className="text-xs px-2.5 py-1 rounded-full bg-secondary border border-border flex items-center gap-1">
                    <Calendar size={10} /> {v.year}
                  </span>
                  {v.engine_size && (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-secondary border border-border flex items-center gap-1">
                      <Gauge size={10} /> {v.engine_size}
                    </span>
                  )}
                  {v.registration_number && (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-secondary border border-border font-mono uppercase">
                      {v.registration_number}
                    </span>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-4 rounded-xl gap-2"
                  onClick={() => navigate(`/search?q=${encodeURIComponent(`${v.make} ${v.model} ${v.year}`)}&fromGarage=true`)}
                >
                  <Search size={14} />
                  Search Parts
                </Button>
              </div>
            );
          })}
        </div>

        {!isPro && user && (
          <p className="text-xs text-muted-foreground text-center mt-6">
            Free plan: 1 vehicle. <button onClick={() => navigate("/pricing")} className="text-primary hover:underline">Upgrade to Pro</button> for unlimited.
          </p>
        )}
      </div>

      {/* Upgrade dialog */}
      <UpgradeModal
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        feature="garageVehicles"
        featureLabel="Adding more vehicles"
        requiredPlan="Pro"
      />

      <AuthGateModal
        open={authGateOpen}
        onOpenChange={setAuthGateOpen}
        title="Create a free account to save your vehicles"
        description="Sign in to add vehicles to your garage and find compatible parts faster."
      />

      <Footer />
      <BackToTop />
    </div>
  );
};

export default Garage;
