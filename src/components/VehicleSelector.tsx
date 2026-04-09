import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, X } from "lucide-react";

const VEHICLE_MAKES: Record<string, string[]> = {
  "BMW": ["1 Series", "2 Series", "3 Series", "4 Series", "5 Series", "6 Series", "7 Series", "X1", "X3", "X5", "X6", "Z4", "M3", "M5"],
  "Mercedes": ["A-Class", "B-Class", "C-Class", "E-Class", "S-Class", "GLA", "GLC", "GLE", "GLS", "CLA", "CLS", "AMG GT"],
  "Audi": ["A1", "A3", "A4", "A5", "A6", "A7", "A8", "Q2", "Q3", "Q5", "Q7", "Q8", "TT", "R8", "RS3", "RS6"],
  "Ford": ["Fiesta", "Focus", "Mondeo", "Puma", "Kuga", "EcoSport", "Mustang", "Ranger", "Transit", "Galaxy", "S-Max"],
  "Vauxhall": ["Corsa", "Astra", "Insignia", "Mokka", "Crossland", "Grandland", "Adam", "Viva", "Zafira"],
  "Toyota": ["Yaris", "Corolla", "Camry", "C-HR", "RAV4", "Hilux", "Land Cruiser", "Supra", "Aygo", "Prius"],
  "Volkswagen": ["Polo", "Golf", "Passat", "Tiguan", "T-Roc", "T-Cross", "Touareg", "Arteon", "ID.3", "ID.4", "Up"],
  "Honda": ["Civic", "Jazz", "CR-V", "HR-V", "Accord", "NSX", "e"],
  "Nissan": ["Micra", "Juke", "Qashqai", "X-Trail", "Leaf", "Navara", "GT-R", "370Z"],
  "Volvo": ["XC40", "XC60", "XC90", "S60", "S90", "V40", "V60", "V90", "C40"],
};

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 30 }, (_, i) => currentYear - i);

interface Props {
  vehicles: string[];
  onChange: (vehicles: string[]) => void;
}

const VehicleSelector = ({ vehicles, onChange }: Props) => {
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");

  const models = make && make !== "All Makes" ? VEHICLE_MAKES[make] || [] : [];

  const addVehicle = () => {
    let tag = "";
    if (make === "All Makes") {
      tag = "All Makes";
    } else if (make && model && year) {
      tag = `${make} ${model} ${year}`;
    } else if (make && model) {
      tag = `${make} ${model}`;
    } else if (make) {
      tag = make;
    }
    if (!tag || vehicles.includes(tag)) return;
    onChange([...vehicles, tag]);
    setMake("");
    setModel("");
    setYear("");
  };

  const removeVehicle = (idx: number) => {
    onChange(vehicles.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-3">
      <label className="text-sm text-muted-foreground block mb-1">Compatible Vehicles</label>
      <div className="flex flex-wrap gap-1.5 min-h-[32px]">
        {vehicles.map((v, i) => (
          <Badge key={i} variant="secondary" className="gap-1 pr-1">
            {v}
            <button type="button" onClick={() => removeVehicle(i)} className="ml-0.5 rounded-full hover:bg-muted p-0.5">
              <X size={10} />
            </button>
          </Badge>
        ))}
      </div>
      <div className="flex gap-2 flex-wrap">
        <select
          value={make}
          onChange={e => { setMake(e.target.value); setModel(""); setYear(""); }}
          className="h-9 px-3 rounded-lg bg-secondary border border-border text-foreground text-sm flex-1 min-w-[120px]"
        >
          <option value="">Make...</option>
          <option value="All Makes">All Makes</option>
          {Object.keys(VEHICLE_MAKES).map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        {make && make !== "All Makes" && (
          <select
            value={model}
            onChange={e => setModel(e.target.value)}
            className="h-9 px-3 rounded-lg bg-secondary border border-border text-foreground text-sm flex-1 min-w-[120px]"
          >
            <option value="">Model...</option>
            {models.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        )}
        {make && make !== "All Makes" && (
          <select
            value={year}
            onChange={e => setYear(e.target.value)}
            className="h-9 px-3 rounded-lg bg-secondary border border-border text-foreground text-sm flex-1 min-w-[80px]"
          >
            <option value="">Year...</option>
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        )}
        <Button type="button" size="sm" variant="outline" onClick={addVehicle} disabled={!make} className="rounded-lg gap-1 h-9">
          <Plus size={14} /> Add
        </Button>
      </div>
    </div>
  );
};

export default VehicleSelector;
