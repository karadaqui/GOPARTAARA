import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, X } from "lucide-react";

const VEHICLE_MAKES = [
  "Abarth", "Alfa Romeo", "Aston Martin", "Audi", "Bentley", "BMW", "Bugatti",
  "Cadillac", "Chevrolet", "Chrysler", "Citroën", "Cupra", "Dacia", "Ferrari",
  "Fiat", "Ford", "Honda", "Hyundai", "Infiniti", "Jaguar", "Jeep", "Kia",
  "Lamborghini", "Land Rover", "Lexus", "Maserati", "Mazda", "McLaren",
  "Mercedes-Benz", "MINI", "Mitsubishi", "Nissan", "Opel/Vauxhall", "Peugeot",
  "Porsche", "Renault", "Rolls-Royce", "SEAT", "Skoda", "Smart", "Subaru",
  "Suzuki", "Tesla", "Toyota", "Volkswagen", "Volvo", "Other",
];

const currentYear = new Date().getFullYear() + 1;
const YEARS = Array.from({ length: currentYear - 1980 + 1 }, (_, i) => currentYear - i);

interface Props {
  vehicles: string[];
  onChange: (vehicles: string[]) => void;
}

const VehicleSelector = ({ vehicles, onChange }: Props) => {
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [yearFrom, setYearFrom] = useState("");
  const [yearTo, setYearTo] = useState("");

  const addVehicle = () => {
    if (!make) return;
    let tag = make;
    if (model.trim()) tag += ` ${model.trim()}`;
    if (yearFrom && yearTo) tag += ` ${yearFrom}-${yearTo}`;
    else if (yearFrom) tag += ` ${yearFrom}`;
    else if (yearTo) tag += ` ${yearTo}`;
    if (vehicles.includes(tag)) return;
    onChange([...vehicles, tag]);
    setMake("");
    setModel("");
    setYearFrom("");
    setYearTo("");
  };

  const removeVehicle = (idx: number) => {
    onChange(vehicles.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-3">
      <label className="text-sm text-muted-foreground block">Compatible Vehicles</label>
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
      <div className="grid grid-cols-2 gap-2">
        <select
          value={make}
          onChange={e => setMake(e.target.value)}
          className="h-9 px-3 rounded-lg bg-secondary border border-border text-foreground text-sm"
        >
          <option value="">Make...</option>
          {VEHICLE_MAKES.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <Input
          value={model}
          onChange={e => setModel(e.target.value)}
          placeholder="Model (e.g. 3 Series)"
          disabled={!make}
          className="h-9 bg-secondary border-border rounded-lg text-sm"
        />
      </div>
      {make && (
        <div className="flex gap-2 items-center">
          <select
            value={yearFrom}
            onChange={e => setYearFrom(e.target.value)}
            className="h-9 px-3 rounded-lg bg-secondary border border-border text-foreground text-sm flex-1"
          >
            <option value="">From...</option>
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <span className="text-muted-foreground text-sm">–</span>
          <select
            value={yearTo}
            onChange={e => setYearTo(e.target.value)}
            className="h-9 px-3 rounded-lg bg-secondary border border-border text-foreground text-sm flex-1"
          >
            <option value="">To...</option>
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <Button type="button" size="sm" variant="outline" onClick={addVehicle} className="rounded-lg gap-1 h-9">
            <Plus size={14} /> Add
          </Button>
        </div>
      )}
    </div>
  );
};

export default VehicleSelector;
