import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Car, Plus, Trash2, Loader2, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

const CAR_MAKES = [
  "Abarth", "Alfa Romeo", "Aston Martin", "Audi", "Bentley", "BMW", "Chevrolet",
  "Chrysler", "Citroën", "Cupra", "Dacia", "Daewoo", "Daihatsu", "Dodge", "DS",
  "Ferrari", "Fiat", "Ford", "Genesis", "Honda", "Hyundai", "Infiniti", "Isuzu",
  "Jaguar", "Jeep", "Kia", "Lamborghini", "Land Rover", "Lexus", "Lotus",
  "Maserati", "Mazda", "McLaren", "Mercedes-Benz", "MG", "Mini", "Mitsubishi",
  "Nissan", "Opel", "Peugeot", "Porsche", "Renault", "Rolls-Royce", "Saab",
  "SEAT", "Škoda", "Smart", "Subaru", "Suzuki", "Tesla", "Toyota", "Vauxhall",
  "Volkswagen", "Volvo",
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 40 }, (_, i) => currentYear - i);

const ENGINE_SIZES = ["1.0L", "1.2L", "1.4L", "1.5L", "1.6L", "1.8L", "2.0L", "2.2L", "2.4L", "2.5L", "3.0L", "3.5L", "4.0L", "5.0L", "Electric"];

interface Props {
  userId: string;
  isPro: boolean;
}

const MyGarageSection = ({ userId, isPro }: Props) => {
  const { toast } = useToast();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

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
          <a href="/#pricing" className="text-primary hover:underline">Upgrade to Pro</a> for unlimited.
        </p>
      )}

      {/* Add vehicle form */}
      {showForm && (
        <div className="mb-6 p-4 rounded-xl bg-secondary/50 border border-border space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <p className="text-sm font-medium text-foreground">Add a vehicle</p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Make *</label>
              <Select value={make} onValueChange={setMake}>
                <SelectTrigger className="rounded-xl bg-secondary border-border h-10">
                  <SelectValue placeholder="Select make" />
                </SelectTrigger>
                <SelectContent>
                  {CAR_MAKES.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Model *</label>
              <Input
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="e.g. XC60, Golf, Focus"
                className="rounded-xl bg-secondary border-border h-10"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Year *</label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger className="rounded-xl bg-secondary border-border h-10">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {YEARS.map((y) => (
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

          {/* Reg plate - Coming Soon */}
          <div className="relative">
            <label className="text-xs text-muted-foreground mb-1 block">UK Number Plate Lookup</label>
            <div className="relative">
              <div className="absolute inset-0 flex items-center justify-center z-10 rounded-xl">
                <span className="px-3 py-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold tracking-wide uppercase shadow-lg">
                  Coming Soon
                </span>
              </div>
              <Input
                disabled
                placeholder="AB12 CDE"
                className="rounded-xl bg-secondary/50 border-border h-10 uppercase tracking-widest font-mono font-bold opacity-40"
              />
            </div>
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
              className="flex items-center gap-3 p-4 rounded-xl bg-secondary/30 border border-border hover:border-primary/20 transition-colors group"
            >
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
          ))}
        </div>
      )}
    </div>
  );
};

export default MyGarageSection;
