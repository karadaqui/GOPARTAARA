import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Car, Plus } from "lucide-react";
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
}

interface Props {
  onSelect: (vehicleQuery: string) => void;
}

const SearchBarGarageDropdown = ({ onSelect }: Props) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (!user) {
      fetchedRef.current = false;
      setVehicles([]);
      return;
    }
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    supabase
      .from("user_vehicles")
      .select("id, nickname, make, model, year")
      .eq("user_id", user.id)
      .then(({ data }) => {
        if (data) setVehicles(data as Vehicle[]);
      });
  }, [user?.id]);

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="shrink-0 text-muted-foreground hover:text-primary transition-colors p-1"
          title="My Garage"
        >
          <Car size={18} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[200px]">
        {vehicles.length > 0 ? (
          vehicles.map((v) => (
            <DropdownMenuItem
              key={v.id}
              onClick={() => onSelect(`${v.make} ${v.model} ${v.year}`)}
            >
              <Car size={14} className="mr-2 text-primary" />
              <span className="truncate">
                {v.nickname ? `${v.nickname} — ` : ""}
                {v.make} {v.model} ({v.year})
              </span>
            </DropdownMenuItem>
          ))
        ) : (
          <DropdownMenuItem onClick={() => navigate("/garage")}>
            <Plus size={14} className="mr-2 text-primary" />
            Add Vehicle
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default SearchBarGarageDropdown;
