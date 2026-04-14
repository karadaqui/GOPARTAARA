import { useState } from "react";
import { format, parseISO, isValid } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  vehicleId: string;
  motExpiryDate?: string | null;
  taxExpiryDate?: string | null;
  onUpdate: () => void;
}

const VehicleExpiryEditor = ({ vehicleId, motExpiryDate, taxExpiryDate, onUpdate }: Props) => {
  const parseSafe = (d: string | null | undefined) => {
    if (!d) return undefined;
    const p = parseISO(d);
    return isValid(p) ? p : undefined;
  };

  const [mot, setMot] = useState<Date | undefined>(parseSafe(motExpiryDate));
  const [tax, setTax] = useState<Date | undefined>(parseSafe(taxExpiryDate));
  const [saving, setSaving] = useState(false);

  const save = async (field: "mot_expiry_date" | "tax_expiry_date", value: Date | undefined) => {
    setSaving(true);
    const { error } = await supabase
      .from("user_vehicles")
      .update({ [field]: value ? format(value, "yyyy-MM-dd") : null } as any)
      .eq("id", vehicleId);
    setSaving(false);
    if (error) {
      toast.error("Failed to save date");
    } else {
      toast.success("Date saved");
      onUpdate();
    }
  };

  return (
    <div className="grid grid-cols-2 gap-2 mt-3">
      <div>
        <label className="text-[10px] text-muted-foreground mb-1 block">MOT Expiry</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "w-full justify-start text-left text-xs rounded-lg h-8",
                !mot && "text-muted-foreground"
              )}
              disabled={saving}
            >
              <CalendarIcon className="mr-1.5 h-3 w-3" />
              {mot ? format(mot, "dd MMM yyyy") : "Set date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={mot}
              onSelect={(d) => { setMot(d); save("mot_expiry_date", d); }}
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
      </div>
      <div>
        <label className="text-[10px] text-muted-foreground mb-1 block">Tax Expiry</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "w-full justify-start text-left text-xs rounded-lg h-8",
                !tax && "text-muted-foreground"
              )}
              disabled={saving}
            >
              <CalendarIcon className="mr-1.5 h-3 w-3" />
              {tax ? format(tax, "dd MMM yyyy") : "Set date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={tax}
              onSelect={(d) => { setTax(d); save("tax_expiry_date", d); }}
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};

export default VehicleExpiryEditor;
