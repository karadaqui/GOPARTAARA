import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Car, Loader2, Search, ChevronRight, Pencil, Calendar,
  Palette, Fuel, Gauge, ShieldCheck, Receipt, Check
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const MODEL_EXAMPLES: Record<string, string> = {
  VAUXHALL: "e.g. Astra, Corsa, Insignia, Mokka, Grandland",
  BMW: "e.g. 3 Series, 5 Series, X5, 1 Series, X3",
  MERCEDES: "e.g. C Class, E Class, A Class, GLC, S Class",
  AUDI: "e.g. A3, A4, Q5, A6, TT",
  FORD: "e.g. Focus, Fiesta, Kuga, Mondeo, Puma",
  TOYOTA: "e.g. Corolla, RAV4, Yaris, C-HR, Aygo",
  VOLKSWAGEN: "e.g. Golf, Polo, Tiguan, Passat, T-Roc",
  HONDA: "e.g. Civic, CR-V, Jazz, HR-V",
  NISSAN: "e.g. Qashqai, Juke, Micra, X-Trail",
  VOLVO: "e.g. XC60, XC90, V40, S60",
};
const getModelPlaceholder = (make?: string) => MODEL_EXAMPLES[make?.toUpperCase() || ""] || "e.g. enter your model name";

interface VehicleData {
  registrationNumber: string;
  make: string;
  model: string | null;
  colour: string | null;
  fuelType: string | null;
  yearOfManufacture: number | null;
  engineCapacity: number | null;
  motStatus: string | null;
  taxStatus: string | null;
}

interface VehicleLookupProps {
  onLookupStart?: () => void;
  onVehicleFound?: (vehicle: VehicleData) => void;
}

const VehicleLookup = ({ onLookupStart, onVehicleFound }: VehicleLookupProps) => {
  const [regNumber, setRegNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [vehicle, setVehicle] = useState<VehicleData | null>(null);
  const [modelInput, setModelInput] = useState("");
  const [modelConfirmed, setModelConfirmed] = useState(false);
  const [editingModel, setEditingModel] = useState(false);
  const [partQuery, setPartQuery] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = regNumber.replace(/\s+/g, "").toUpperCase();
    if (!cleaned || cleaned.length < 2) {
      toast({ title: "Enter a valid registration number", variant: "destructive" });
      return;
    }

    setLoading(true);
    setVehicle(null);
    setPartQuery("");
    setModelInput("");
    setModelConfirmed(false);
    setEditingModel(false);
    onLookupStart?.();
    try {
      const { data, error } = await supabase.functions.invoke("vehicle-lookup", {
        body: { registrationNumber: cleaned },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const nextVehicle: VehicleData = {
        ...data.vehicle,
        model: data.vehicle.model || null,
      };
      toast({ title: `Found: ${nextVehicle.make}`, description: `${nextVehicle.yearOfManufacture || ""} ${nextVehicle.colour || ""}`.trim() });

      if (onVehicleFound) {
        onVehicleFound(nextVehicle);
        return;
      }

      setVehicle(nextVehicle);
    } catch (err: any) {
      toast({ title: "Lookup failed", description: err.message || "Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleModelConfirm = () => {
    if (!vehicle || !modelInput.trim()) return;
    const updated = { ...vehicle, model: modelInput.trim().toUpperCase() };
    setVehicle(updated);
    setModelConfirmed(true);
    setEditingModel(false);
    toast({ title: `Model confirmed: ${updated.make} ${updated.model}` });
  };

  const handleEditModel = () => {
    if (!vehicle) return;
    setModelInput(vehicle.model || "");
    setEditingModel(true);
    setModelConfirmed(false);
  };

  const vehicleTitle = vehicle
    ? `${vehicle.make}${vehicle.model ? ` ${vehicle.model}` : ""}`
    : "";

  const handlePartSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicle || !partQuery.trim()) return;
    const q = `${vehicle.make} ${vehicle.model || ""} ${vehicle.yearOfManufacture || ""} ${partQuery.trim()}`.replace(/\s+/g, " ").trim();
    const vehicleParam = encodeURIComponent(JSON.stringify(vehicle));
    navigate(`/search?q=${encodeURIComponent(q)}&vehicle=${vehicleParam}`);
  };

  const handleFindParts = () => {
    if (!vehicle) return;
    const q = `${vehicle.make} ${vehicle.model || ""} ${vehicle.yearOfManufacture || ""}`.replace(/\s+/g, " ").trim();
    const vehicleParam = encodeURIComponent(JSON.stringify(vehicle));
    navigate(`/search?q=${encodeURIComponent(q)}&vehicle=${vehicleParam}`);
  };

  const DetailItem = ({ icon: Icon, label, value, statusColor }: { icon: any; label: string; value: string; statusColor?: string }) => (
    <div className="flex items-center gap-2.5 py-2">
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <Icon size={15} className="text-primary" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-muted-foreground uppercase tracking-wider leading-none mb-0.5">{label}</p>
        <p className={`text-sm font-semibold leading-tight ${statusColor || "text-foreground"}`}>{value}</p>
      </div>
    </div>
  );

  return (
    <div className="w-full">
      <form onSubmit={handleLookup} className="flex items-center gap-2">
        <div className="flex-1 relative">
          <Car size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={regNumber}
            onChange={(e) => setRegNumber(e.target.value.toUpperCase())}
            placeholder="Enter reg plate e.g. AB12 CDE"
            className="pl-10 bg-secondary border-border h-11 rounded-xl uppercase tracking-widest font-mono font-bold"
            maxLength={10}
            disabled={loading}
          />
        </div>
        <Button type="submit" className="rounded-xl h-11 px-6" disabled={loading || !regNumber.trim()}>
          {loading ? <Loader2 size={16} className="animate-spin" /> : "Lookup"}
        </Button>
      </form>

      {vehicle && (
        <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
          {/* Premium Vehicle Card */}
          <div className="rounded-2xl bg-card border border-border/60 overflow-hidden shadow-lg">
            {/* Header with reg plate badge */}
            <div className="px-5 pt-5 pb-3 border-b border-border/40">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                    <Car size={22} className="text-primary" />
                  </div>
                  <div className="min-w-0">
                    {modelConfirmed ? (
                      <div className="flex items-center gap-2">
                        <h3 className="font-display font-bold text-xl text-foreground tracking-tight">
                          {vehicleTitle}
                          {vehicle.yearOfManufacture && (
                            <span className="text-muted-foreground font-medium ml-1.5">({vehicle.yearOfManufacture})</span>
                          )}
                        </h3>
                        <button
                          onClick={handleEditModel}
                          className="p-1 rounded-md hover:bg-secondary transition-colors text-muted-foreground hover:text-primary"
                          title="Edit model"
                        >
                          <Pencil size={14} />
                        </button>
                      </div>
                    ) : (
                      <h3 className="font-display font-bold text-xl text-foreground tracking-tight">
                        {vehicle.make}
                        {vehicle.yearOfManufacture && (
                          <span className="text-muted-foreground font-medium ml-1.5">({vehicle.yearOfManufacture})</span>
                        )}
                      </h3>
                    )}
                  </div>
                </div>
                <span className="bg-secondary text-foreground text-xs font-mono font-bold px-3 py-1.5 rounded-lg tracking-wider border border-border/50 shrink-0">
                  {vehicle.registrationNumber}
                </span>
              </div>
            </div>

            {/* Model input section */}
            {(!modelConfirmed || editingModel) && (
              <div className="px-5 py-4 border-b border-border/40 bg-primary/[0.03]">
                <p className="text-xs text-muted-foreground mb-2.5 font-medium">
                  Enter your vehicle model for more accurate parts search
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <Input
                      value={modelInput}
                      onChange={(e) => setModelInput(e.target.value)}
                      placeholder={getModelPlaceholder(vehicle?.make)}
                      className="bg-secondary border-border h-11 rounded-xl text-sm font-medium"
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleModelConfirm(); } }}
                      autoFocus
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={handleModelConfirm}
                    className="rounded-xl h-11 px-5 gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                    disabled={!modelInput.trim()}
                  >
                    <Check size={16} />
                    Confirm
                  </Button>
                </div>
              </div>
            )}

            {/* Vehicle details grid */}
            <div className="px-5 py-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-0.5">
                {vehicle.yearOfManufacture && (
                  <DetailItem icon={Calendar} label="Year" value={String(vehicle.yearOfManufacture)} />
                )}
                {vehicle.colour && (
                  <DetailItem icon={Palette} label="Colour" value={vehicle.colour} />
                )}
                {vehicle.fuelType && (
                  <DetailItem icon={Fuel} label="Fuel Type" value={vehicle.fuelType} />
                )}
                {vehicle.engineCapacity && (
                  <DetailItem icon={Gauge} label="Engine" value={`${vehicle.engineCapacity}cc`} />
                )}
                {vehicle.motStatus && (
                  <DetailItem
                    icon={ShieldCheck}
                    label="MOT Status"
                    value={vehicle.motStatus}
                    statusColor={vehicle.motStatus === "Valid" ? "text-emerald-400" : "text-destructive"}
                  />
                )}
                {vehicle.taxStatus && (
                  <DetailItem
                    icon={Receipt}
                    label="Tax Status"
                    value={vehicle.taxStatus}
                    statusColor={vehicle.taxStatus === "Taxed" ? "text-emerald-400" : "text-destructive"}
                  />
                )}
              </div>
            </div>

            {/* Find Parts button */}
            {modelConfirmed && (
              <div className="px-5 pb-5 pt-2">
                <Button
                  onClick={handleFindParts}
                  className="w-full h-12 rounded-xl text-base font-bold gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md"
                >
                  <Search size={18} />
                  Find Parts for {vehicleTitle}
                  <ChevronRight size={16} />
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleLookup;
