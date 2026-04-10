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
  DollarSign,
} from "lucide-react";

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
  fuelCostAnnual?: number | null;
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

const VehicleSpecsCard = ({ make, model, year }: Props) => {
  const [specs, setSpecs] = useState<VehicleSpecs | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState(false);

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

  if (loading) {
    return (
      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 size={12} className="animate-spin" />
        Loading vehicle specs…
      </div>
    );
  }

  if (error || !specs) return null;

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
    hasEconomy && {
      icon: <Gauge size={13} className="text-emerald-400" />,
      label: "MPG",
      value: `${specs.cityMpg || "–"} city / ${specs.highwayMpg || "–"} hwy / ${specs.combinedMpg || "–"} comb`,
    },
    hasEconomy && specs.combinedMpg && {
      icon: <Fuel size={13} className="text-blue-400" />,
      label: "L/100km",
      value: `${(235.215 / specs.combinedMpg).toFixed(1)}`,
    },
    specs.co2 != null && {
      icon: <Leaf size={13} className="text-green-400" />,
      label: "CO₂",
      value: `${specs.co2} g/mi`,
    },
    specs.fuelCostAnnual != null && {
      icon: <DollarSign size={13} className="text-amber-400" />,
      label: "Annual Fuel",
      value: `$${specs.fuelCostAnnual}`,
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

export default VehicleSpecsCard;
