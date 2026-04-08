import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Car, Loader2, Search, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface VehicleData {
  registrationNumber: string;
  make: string;
  colour: string | null;
  fuelType: string | null;
  yearOfManufacture: number | null;
  engineCapacity: number | null;
  motStatus: string | null;
  taxStatus: string | null;
}

const VehicleLookup = () => {
  const [regNumber, setRegNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [vehicle, setVehicle] = useState<VehicleData | null>(null);
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
    try {
      const { data, error } = await supabase.functions.invoke("vehicle-lookup", {
        body: { registrationNumber: cleaned },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setVehicle(data.vehicle);
      toast({ title: `Found: ${data.vehicle.make}`, description: `${data.vehicle.yearOfManufacture || ""} ${data.vehicle.colour || ""}`.trim() });
    } catch (err: any) {
      toast({ title: "Lookup failed", description: err.message || "Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handlePartSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicle || !partQuery.trim()) return;
    const q = `${vehicle.make} ${vehicle.yearOfManufacture || ""} ${partQuery.trim()}`.trim();
    const vehicleParam = encodeURIComponent(JSON.stringify(vehicle));
    navigate(`/search?q=${encodeURIComponent(q)}&vehicle=${vehicleParam}`);
  };

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

      {/* Vehicle details */}
      {vehicle && (
        <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="glass rounded-xl p-4 border border-primary/20">
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 rounded-lg p-2 shrink-0">
                <Car size={20} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-display font-bold text-lg text-foreground">
                  {vehicle.make} {vehicle.yearOfManufacture && `(${vehicle.yearOfManufacture})`}
                </h3>
                <div className="flex flex-wrap gap-2 mt-1.5 text-xs text-muted-foreground">
                  {vehicle.colour && (
                    <span className="bg-secondary px-2 py-0.5 rounded-md">{vehicle.colour}</span>
                  )}
                  {vehicle.fuelType && (
                    <span className="bg-secondary px-2 py-0.5 rounded-md">{vehicle.fuelType}</span>
                  )}
                  {vehicle.engineCapacity && (
                    <span className="bg-secondary px-2 py-0.5 rounded-md">{vehicle.engineCapacity}cc</span>
                  )}
                  {vehicle.motStatus && (
                    <span className={`px-2 py-0.5 rounded-md ${vehicle.motStatus === "Valid" ? "bg-emerald-500/20 text-emerald-400" : "bg-destructive/20 text-destructive"}`}>
                      MOT: {vehicle.motStatus}
                    </span>
                  )}
                  {vehicle.taxStatus && (
                    <span className={`px-2 py-0.5 rounded-md ${vehicle.taxStatus === "Taxed" ? "bg-emerald-500/20 text-emerald-400" : "bg-destructive/20 text-destructive"}`}>
                      Tax: {vehicle.taxStatus}
                    </span>
                  )}
                  <span className="bg-secondary px-2 py-0.5 rounded-md">{vehicle.registrationNumber}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Part search for this vehicle */}
          <form onSubmit={handlePartSearch} className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={partQuery}
                onChange={(e) => setPartQuery(e.target.value)}
                placeholder={`Search parts for ${vehicle.make}...`}
                className="pl-10 bg-secondary border-border h-11 rounded-xl"
              />
            </div>
            <Button type="submit" className="rounded-xl h-11 px-5 gap-1.5" disabled={!partQuery.trim()}>
              Find Parts <ChevronRight size={14} />
            </Button>
          </form>
        </div>
      )}
    </div>
  );
};

export default VehicleLookup;
