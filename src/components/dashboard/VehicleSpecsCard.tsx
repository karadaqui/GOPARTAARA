import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Fuel,
  Gauge,
  Cog,
  Zap,
  Car,
  Loader2,
  ChevronDown,
  ChevronUp,
  Leaf,
  Wrench,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface VehicleSpecs {
  fuelType?: string | null;
  cylinders?: number | null;
  displacement?: number | null;
  transmission?: string | null;
  drive?: string | null;
  vehicleClass?: string | null;
  cityMpg?: number | null;
  highwayMpg?: number | null;
  combinedMpg?: number | null;
  co2?: number | null;
  startStop?: boolean;
  turbocharger?: boolean;
  supercharger?: boolean;
  nhtsaVehicleType?: string | null;
}

interface Props {
  make: string;
  model: string;
  year: number;
}

const MANUAL_FUEL_TYPES = ["Petrol", "Diesel", "Hybrid", "Electric", "Plug-in Hybrid", "LPG"];
const MANUAL_TRANSMISSIONS = ["Manual", "Automatic", "CVT", "DCT", "Semi-Auto"];
const MANUAL_DRIVE_TYPES = ["FWD", "RWD", "AWD", "4WD"];
const MANUAL_ENGINE_SIZES = ["1.0L", "1.2L", "1.4L", "1.5L", "1.6L", "1.8L", "2.0L", "2.2L", "2.5L", "3.0L", "3.5L", "4.0L", "5.0L", "N/A"];

// Convert US MPG to UK MPG (imperial gallons)
const usToUkMpg = (usMpg: number) => Math.round(usMpg * 1.20095);
// Convert g/mile to g/km
const gPerMileToGPerKm = (gPerMile: number) => Math.round(gPerMile / 1.60934);

const VehicleSpecsCard = ({ make, model, year }: Props) => {
  const [specs, setSpecs] = useState<VehicleSpecs | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [manualSpecs, setManualSpecs] = useState<{
    engine?: string; fuel?: string; transmission?: string; drive?: string;
  }>({});

  useEffect(() => {
    const cacheKey = `vehicle-specs-${make}-${model}-${year}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed && Object.keys(parsed).length > 0) {
          setSpecs(parsed);
          setLoading(false);
          return;
        }
      } catch {}
    }

    // Check for manual specs
    const manualKey = `vehicle-manual-specs-${make}-${model}-${year}`;
    const manualCached = localStorage.getItem(manualKey);
    if (manualCached) {
      try {
        setManualSpecs(JSON.parse(manualCached));
      } catch {}
    }

    const fetchSpecs = async () => {
      try {
        const { data, error: fnError } = await supabase.functions.invoke("vehicle-specs", {
          body: { make, model, year },
        });
        if (fnError) throw fnError;
        if (data?.specs && Object.keys(data.specs).length > 0) {
          setSpecs(data.specs);
          localStorage.setItem(cacheKey, JSON.stringify(data.specs));
        } else {
          setError(true);
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchSpecs();
  }, [make, model, year]);

  const saveManualSpecs = (updated: typeof manualSpecs) => {
    setManualSpecs(updated);
    const manualKey = `vehicle-manual-specs-${make}-${model}-${year}`;
    localStorage.setItem(manualKey, JSON.stringify(updated));
  };

  if (loading) {
    return (
      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 size={12} className="animate-spin" />
        Loading vehicle specs…
      </div>
    );
  }

  // No specs found — show manual entry
  if (error || !specs) {
    const hasManual = manualSpecs.engine || manualSpecs.fuel || manualSpecs.transmission || manualSpecs.drive;

    if (hasManual) {
      const manualItems = [
        manualSpecs.engine && { icon: <Cog size={13} className="text-primary" />, label: "Engine", value: manualSpecs.engine },
        manualSpecs.fuel && { icon: <Fuel size={13} className="text-primary" />, label: "Fuel", value: manualSpecs.fuel },
        manualSpecs.transmission && { icon: <Zap size={13} className="text-primary" />, label: "Transmission", value: manualSpecs.transmission },
        manualSpecs.drive && { icon: <Car size={13} className="text-primary" />, label: "Drive", value: manualSpecs.drive },
      ].filter(Boolean) as { icon: React.ReactNode; label: string; value: string }[];

      return (
        <div className="mt-3">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground mb-2">
            <Wrench size={12} className="text-primary" />
            Manual Specs
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            {manualItems.map((item, i) => (
              <div key={i} className="flex items-center gap-1.5 min-w-0">
                {item.icon}
                <span className="text-[10px] text-muted-foreground shrink-0">{item.label}:</span>
                <span className="text-[10px] font-medium text-foreground truncate">{item.value}</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => setShowManual(!showManual)}
            className="text-[10px] text-primary hover:underline mt-1"
          >
            Edit specs
          </button>
          {showManual && (
            <ManualSpecsForm manualSpecs={manualSpecs} onSave={saveManualSpecs} />
          )}
        </div>
      );
    }

    return (
      <div className="mt-3">
        {!showManual ? (
          <button
            onClick={() => setShowManual(true)}
            className="flex items-center gap-1.5 text-[11px] text-primary hover:underline"
          >
            <Wrench size={12} />
            Add specs manually
          </button>
        ) : (
          <ManualSpecsForm manualSpecs={manualSpecs} onSave={saveManualSpecs} />
        )}
      </div>
    );
  }

  const hasEconomy = specs.cityMpg || specs.highwayMpg || specs.combinedMpg;
  const hasEngine = specs.cylinders || specs.displacement || specs.fuelType;

  if (!hasEconomy && !hasEngine && !specs.transmission && !specs.drive) return null;

  const specItems = [
    hasEngine && {
      icon: <Cog size={13} className="text-primary" />,
      label: "Engine",
      value: [
        specs.displacement ? `${specs.displacement}L` : null,
        specs.cylinders ? `${specs.cylinders}-cyl` : null,
        specs.turbocharger ? "Turbo" : null,
        specs.supercharger ? "S/C" : null,
      ].filter(Boolean).join(" "),
    },
    specs.fuelType && {
      icon: <Fuel size={13} className="text-primary" />,
      label: "Fuel",
      value: specs.fuelType,
    },
    specs.transmission && {
      icon: <Zap size={13} className="text-primary" />,
      label: "Transmission",
      value: specs.transmission.length > 25 ? specs.transmission.slice(0, 25) + "…" : specs.transmission,
    },
    specs.drive && {
      icon: <Car size={13} className="text-primary" />,
      label: "Drive",
      value: specs.drive,
    },
    specs.vehicleClass && {
      icon: <Car size={13} className="text-muted-foreground" />,
      label: "Class",
      value: specs.vehicleClass,
    },
    hasEconomy && specs.combinedMpg && {
      icon: <Gauge size={13} className="text-emerald-400" />,
      label: "MPG (UK)",
      value: `${usToUkMpg(specs.combinedMpg)} combined`,
    },
    hasEconomy && specs.combinedMpg && {
      icon: <Fuel size={13} className="text-blue-400" />,
      label: "L/100km",
      value: `${(282.481 / usToUkMpg(specs.combinedMpg)).toFixed(1)}`,
    },
    specs.co2 != null && {
      icon: <Leaf size={13} className="text-green-400" />,
      label: "CO₂",
      value: `${gPerMileToGPerKm(specs.co2)} g/km`,
    },
  ].filter(Boolean) as { icon: React.ReactNode; label: string; value: string }[];

  const visibleItems = expanded ? specItems : specItems.slice(0, 4);

  return (
    <div className="mt-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors mb-2"
      >
        <Gauge size={12} className="text-primary" />
        Vehicle Specs
        {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
      </button>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 animate-in fade-in duration-200">
        {visibleItems.map((item, i) => (
          <div key={i} className="flex items-center gap-1.5 min-w-0">
            {item.icon}
            <span className="text-[10px] text-muted-foreground shrink-0">{item.label}:</span>
            <span className="text-[10px] font-medium text-foreground truncate">{item.value}</span>
          </div>
        ))}
      </div>
      {specItems.length > 4 && !expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="text-[10px] text-primary hover:underline mt-1"
        >
          +{specItems.length - 4} more specs
        </button>
      )}
    </div>
  );
};

const ManualSpecsForm = ({
  manualSpecs,
  onSave,
}: {
  manualSpecs: { engine?: string; fuel?: string; transmission?: string; drive?: string };
  onSave: (specs: typeof manualSpecs) => void;
}) => {
  const [engine, setEngine] = useState(manualSpecs.engine || "");
  const [fuel, setFuel] = useState(manualSpecs.fuel || "");
  const [transmission, setTransmission] = useState(manualSpecs.transmission || "");
  const [drive, setDrive] = useState(manualSpecs.drive || "");

  return (
    <div className="mt-2 p-3 rounded-lg bg-secondary/50 border border-border space-y-2 animate-in fade-in duration-200">
      <p className="text-[11px] font-medium text-muted-foreground">Add specs manually</p>
      <div className="grid grid-cols-2 gap-2">
        <Select value={engine} onValueChange={setEngine}>
          <SelectTrigger className="h-8 text-xs rounded-lg"><SelectValue placeholder="Engine size" /></SelectTrigger>
          <SelectContent>
            {MANUAL_ENGINE_SIZES.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={fuel} onValueChange={setFuel}>
          <SelectTrigger className="h-8 text-xs rounded-lg"><SelectValue placeholder="Fuel type" /></SelectTrigger>
          <SelectContent>
            {MANUAL_FUEL_TYPES.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={transmission} onValueChange={setTransmission}>
          <SelectTrigger className="h-8 text-xs rounded-lg"><SelectValue placeholder="Transmission" /></SelectTrigger>
          <SelectContent>
            {MANUAL_TRANSMISSIONS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={drive} onValueChange={setDrive}>
          <SelectTrigger className="h-8 text-xs rounded-lg"><SelectValue placeholder="Drive type" /></SelectTrigger>
          <SelectContent>
            {MANUAL_DRIVE_TYPES.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <button
        onClick={() => onSave({ engine, fuel, transmission, drive })}
        className="w-full h-7 text-xs bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
      >
        Save Specs
      </button>
    </div>
  );
};

export default VehicleSpecsCard;
