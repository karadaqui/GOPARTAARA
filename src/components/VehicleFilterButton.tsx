import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Car, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Vehicle {
  id: string;
  nickname: string | null;
  make: string;
  model: string;
  year: number;
  engine_size: string | null;
}

interface Props {
  onSelect: (vehicleQuery: string) => void;
}

const VehicleFilterButton = ({ onSelect }: Props) => {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("user_vehicles")
      .select("id, nickname, make, model, year, engine_size")
      .eq("user_id", user.id)
      .then(({ data }) => {
        if (data) setVehicles(data as Vehicle[]);
      });
  }, [user]);

  if (!user || vehicles.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-secondary text-muted-foreground hover:text-foreground transition-colors">
          <Car size={14} />
          My Garage
          <ChevronDown size={12} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {vehicles.map((v) => (
          <DropdownMenuItem
            key={v.id}
            onClick={() => {
              const q = `${v.make} ${v.model} ${v.year}`;
              onSelect(q);
            }}
          >
            <Car size={14} className="mr-2 text-primary" />
            <span className="truncate">
              {v.nickname ? `${v.nickname} — ` : ""}
              {v.make} {v.model} ({v.year})
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default VehicleFilterButton;
