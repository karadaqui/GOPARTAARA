import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Car, Plus, Trash2, Loader2, X, Search } from "lucide-react";
import VehicleNotes from "@/components/dashboard/VehicleNotes";
import VehicleSpecsCard from "@/components/dashboard/VehicleSpecsCard";
import BusinessFeatureGate from "@/components/dashboard/BusinessFeatureGate";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getMakes, getModels, getYears, getAllYears } from "@/data/vehicleDatabase";

interface Vehicle {
  id: string;
  nickname: string | null;
  make: string;
  model: string;
  year: number;
  engine_size: string | null;
  registration_number: string | null;
  created_at: string;
}

const ENGINE_SIZES = ["1.0L", "1.2L", "1.4L", "1.5L", "1.6L", "1.8L", "2.0L", "2.2L", "2.4L", "2.5L", "3.0L", "3.5L", "4.0L", "5.0L", "Electric"];

interface Props {
  userId: string;
  isPro: boolean;
  isBusinessUser?: boolean;
}

const MyGarageSection = ({ userId, isPro, isBusinessUser = false }: Props) => {
  const { toast } = useToast();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [regPlate, setRegPlate] = useState("");
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState(false);
  const [vinInput, setVinInput] = useState("");
  const [vinLoading, setVinLoading] = useState(false);
  const [vinError, setVinError] = useState("");

  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [engineSize, setEngineSize] = useState("");
  const [nickname, setNickname] = useState("");

  useEffect(() => {
    fetchVehicles();
  }, [userId]);

  const fetchVehicles = async () => {
    const { data, error } = await supabase
      .from("user_vehicles")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (!error && data) setVehicles(data as Vehicle[]);
    setLoading(false);
  };

  const canAddMore = isPro || vehicles.length < 1;

  const handleAdd = async () => {
    if (!make || !model || !year) {
      toast({ title: "Missing fields", description: "Make, model and year are required.", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("user_vehicles").insert({
      user_id: userId,
      make,
      model,
      year: parseInt(year),
      engine_size: engineSize || null,
      nickname: nickname.trim() || null,
    } as any);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Vehicle added", description: `${make} ${model} saved to your garage.` });
      resetForm();
      fetchVehicles();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("user_vehicles").delete().eq("id", id);
    if (!error) setVehicles((prev) => prev.filter((v) => v.id !== id));
  };

  const resetForm = () => {
    setMake("");
    setModel("");
    setYear("");
    setEngineSize("");
    setNickname("");
    setShowForm(false);
  };

  return (
    <div className="glass rounded-2xl p-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg font-semibold flex items-center gap-2">
          <Car size={18} className="text-primary" />
          My Garage
        </h2>
        {canAddMore && (
          <Button
            size="sm"
            variant="outline"
            className="rounded-xl gap-1.5"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? <X size={14} /> : <Plus size={14} />}
            {showForm ? "Cancel" : "Add Vehicle"}
          </Button>
        )}
      </div>

      {!canAddMore && !showForm && (
        <p className="text-xs text-muted-foreground mb-3">
          Free plan allows 1 vehicle.{" "}
          <a href="/pricing" className="text-primary hover:underline">Upgrade to Pro</a> for unlimited.
        </p>
      )}

      {/* Add vehicle form */}
      {showForm && (
        <div className="mb-6 p-4 rounded-xl bg-secondary/50 border border-border space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <p className="text-sm font-medium text-foreground">Add a vehicle</p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Make *</label>
              <Select value={make} onValueChange={(v) => { setMake(v); setModel(""); setYear(""); }}>
                <SelectTrigger className="rounded-xl bg-secondary border-border h-10">
                  <SelectValue placeholder="Select make" />
                </SelectTrigger>
                <SelectContent>
                  {getMakes().map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Model *</label>
              {make && getModels(make).length > 0 ? (
                <Select value={model} onValueChange={(v) => { setModel(v); setYear(""); }}>
                  <SelectTrigger className="rounded-xl bg-secondary border-border h-10">
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    {getModels(make).map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="e.g. Model name"
                  className="rounded-xl bg-secondary border-border h-10"
                />
              )}
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Year *</label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger className="rounded-xl bg-secondary border-border h-10">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {(make && model ? getYears(make, model) : getAllYears()).map((y) => (
                    <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Engine Size</label>
              <Select value={engineSize} onValueChange={setEngineSize}>
                <SelectTrigger className="rounded-xl bg-secondary border-border h-10">
                  <SelectValue placeholder="Optional" />
                </SelectTrigger>
                <SelectContent>
                  {ENGINE_SIZES.map((es) => (
                    <SelectItem key={es} value={es}>{es}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Nickname (optional)</label>
            <Input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="e.g. My Daily Driver"
              className="rounded-xl bg-secondary border-border h-10"
            />
          </div>

          {/* UK Number Plate Lookup */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">UK Number Plate Lookup</label>
            <div className="flex gap-2">
              <Input
                value={regPlate}
                onChange={(e) => { setRegPlate(e.target.value.toUpperCase()); setRegError(false); }}
                placeholder="AB12 CDE"
                className="rounded-xl bg-secondary border-border h-10 uppercase tracking-widest font-mono font-bold flex-1"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="rounded-xl h-10 px-3"
                disabled={regLoading || !regPlate.trim()}
                onClick={async () => {
                  const cleaned = regPlate.replace(/\s/g, "").toUpperCase();
                  if (cleaned.length < 2) return;
                  setRegLoading(true);
                  setRegError(false);
                  try {
                    const { data, error } = await supabase.functions.invoke("vehicle-lookup", {
                      body: { registrationNumber: cleaned },
                    });
                    if (error || data?.error || !data?.make) {
                      setRegError(true);
                    } else {
                      setMake(data.make);
                      setModel(data.model || "");
                      setYear(data.yearOfManufacture?.toString() || "");
                      setEngineSize(data.engineCapacity ? `${(parseInt(data.engineCapacity) / 1000).toFixed(1)}L` : "");
                      toast({ title: "Vehicle found", description: `${data.make} ${data.model} (${data.yearOfManufacture})` });
                    }
                  } catch {
                    setRegError(true);
                  } finally {
                    setRegLoading(false);
                  }
                }}
              >
                {regLoading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
              </Button>
            </div>
            {!regError && (
              <p className="text-[10px] text-muted-foreground mt-1.5">
                🇬🇧 UK plates supported. More countries coming soon.
              </p>
            )}
            {regError && (
              <div className="mt-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20">
                <p className="text-xs text-muted-foreground">
                  We couldn't find this plate. Currently we support UK registration plates only.
                </p>
                <button
                  type="button"
                  onClick={() => { setRegError(false); setRegPlate(""); }}
                  className="mt-2 text-xs text-primary hover:underline flex items-center gap-1"
                >
                  👉 Try searching by part name instead →
                </button>
              </div>
            )}
          </div>

          {/* VIN Lookup */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">VIN Number (optional)</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  value={vinInput}
                  onChange={(e) => { setVinInput(e.target.value.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, "").slice(0, 17)); setVinError(""); }}
                  placeholder="17-character VIN"
                  className="rounded-xl bg-secondary border-border h-10 uppercase tracking-widest font-mono font-bold pr-14"
                  maxLength={17}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-mono">
                  {vinInput.length}/17
                </span>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="rounded-xl h-10 px-3"
                disabled={vinLoading || vinInput.length !== 17}
                onClick={async () => {
                  const cleaned = vinInput.replace(/\s/g, "").toUpperCase();
                  if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(cleaned)) { setVinError("Invalid VIN format"); return; }
                  setVinLoading(true); setVinError("");
                  try {
                    const response = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${cleaned}?format=json`);
                    const data = await response.json();
                    const results = data.Results;
                    const getValue = (variable: string) => {
                      const item = results.find((r: any) => r.Variable === variable);
                      return (item?.Value && item.Value !== "Not Applicable" && item.Value !== "") ? item.Value : null;
                    };
                    const vMake = getValue("Make");
                    const vModel = getValue("Model");
                    const vYear = getValue("ModelYear");
                    if (!vMake) { setVinError("VIN not found"); return; }
                    setMake(vMake);
                    if (vModel) setModel(vModel);
                    if (vYear) setYear(vYear);
                    const displacement = getValue("DisplacementL");
                    if (displacement) setEngineSize(`${parseFloat(displacement).toFixed(1)}L`);
                    toast({ title: "VIN decoded", description: `${vMake} ${vModel || ""} (${vYear || ""})` });
                  } catch {
                    setVinError("Failed to decode VIN");
                  } finally {
                    setVinLoading(false);
                  }
                }}
              >
                {vinLoading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
              </Button>
            </div>
            {vinError && <p className="text-[10px] text-destructive mt-1">{vinError}</p>}
            {!vinError && <p className="text-[10px] text-muted-foreground mt-1">🌍 Auto-fills make, model & year from VIN</p>}
          </div>

          <Button onClick={handleAdd} disabled={saving} className="rounded-xl gap-2 w-full">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Save Vehicle
          </Button>
        </div>
      )}

      {/* Vehicle list */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 size={20} className="animate-spin text-muted-foreground" />
        </div>
      ) : vehicles.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          No vehicles saved yet. Add your first car!
        </p>
      ) : (
        <div className="space-y-3">
          {vehicles.map((v) => (
            <div
              key={v.id}
              className="p-4 rounded-xl bg-secondary/30 border border-border hover:border-primary/20 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Car size={18} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display font-bold text-sm truncate">
                    {v.make} {v.model} ({v.year})
                  </p>
                  {v.nickname && (
                    <p className="text-xs text-muted-foreground truncate">"{v.nickname}"</p>
                  )}
                  {v.engine_size && (
                    <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded mt-1 inline-block">
                      {v.engine_size}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(v.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              {/* Vehicle Specs from NHTSA + FuelEconomy */}
              <VehicleSpecsCard make={v.make} model={v.model} year={v.year} />
              {/* Vehicle Notes — Business feature */}
              <BusinessFeatureGate isBusinessUser={isBusinessUser} label="Elite plan feature">
                <VehicleNotes vehicleId={v.id} userId={userId} />
              </BusinessFeatureGate>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyGarageSection;
