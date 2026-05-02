import { useRef, useState } from "react";
import { format, parseISO, isValid } from "date-fns";
import { CalendarIcon, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  vehicleId: string;
  motExpiryDate?: string | null;
  taxExpiryDate?: string | null;
  onUpdate: () => void;
}

const LS_KEY = "partara_vehicle_expiries";

const readLs = (): Record<string, { mot?: string | null; tax?: string | null }> => {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const writeLs = (vehicleId: string, field: "mot" | "tax", value: string | null) => {
  try {
    const all = readLs();
    all[vehicleId] = { ...(all[vehicleId] || {}), [field]: value };
    localStorage.setItem(LS_KEY, JSON.stringify(all));
  } catch {
    /* ignore */
  }
};

const parseSafe = (d: string | null | undefined) => {
  if (!d) return undefined;
  const p = parseISO(d);
  return isValid(p) ? p : undefined;
};

const VehicleExpiryEditor = ({ vehicleId, motExpiryDate, taxExpiryDate, onUpdate }: Props) => {
  // Hydrate initial values: prefer DB value, fallback to localStorage
  const lsInit = readLs()[vehicleId] || {};
  const [mot, setMot] = useState<Date | undefined>(
    parseSafe(motExpiryDate) || parseSafe(lsInit.mot),
  );
  const [tax, setTax] = useState<Date | undefined>(
    parseSafe(taxExpiryDate) || parseSafe(lsInit.tax),
  );
  const [saving, setSaving] = useState(false);

  const motInputRef = useRef<HTMLInputElement>(null);
  const taxInputRef = useRef<HTMLInputElement>(null);

  const save = async (
    field: "mot_expiry_date" | "tax_expiry_date",
    lsField: "mot" | "tax",
    value: Date | undefined,
  ) => {
    const iso = value ? format(value, "yyyy-MM-dd") : null;
    writeLs(vehicleId, lsField, iso);
    setSaving(true);
    const { error } = await supabase
      .from("user_vehicles")
      .update({ [field]: iso } as any)
      .eq("id", vehicleId);
    setSaving(false);
    if (error) {
      toast.error("Failed to save date");
    } else {
      toast.success("Date saved");
      onUpdate();
    }
  };

  const openPicker = (ref: React.RefObject<HTMLInputElement>) => {
    const el = ref.current;
    if (!el) return;
    // showPicker is the modern API; fallback to focus+click for older browsers
    if (typeof (el as any).showPicker === "function") {
      try {
        (el as any).showPicker();
        return;
      } catch {
        /* fall through */
      }
    }
    el.focus();
    el.click();
  };

  const Field = ({
    label,
    value,
    setValue,
    inputRef,
    onCommit,
  }: {
    label: string;
    value: Date | undefined;
    setValue: (d: Date | undefined) => void;
    inputRef: React.RefObject<HTMLInputElement>;
    onCommit: (d: Date | undefined) => void;
  }) => (
    <div>
      <label className="text-[10px] text-muted-foreground mb-1 block">{label}</label>
      <div className="relative">
        {/* Native, hidden but functional date input — sits behind the visible button */}
        <input
          ref={inputRef}
          type="date"
          value={value ? format(value, "yyyy-MM-dd") : ""}
          onChange={(e) => {
            const v = e.target.value;
            const d = v ? parseISO(v) : undefined;
            const next = d && isValid(d) ? d : undefined;
            setValue(next);
            onCommit(next);
          }}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          aria-label={label}
        />
        {value ? (
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1 justify-start text-left text-xs rounded-lg h-8"
              disabled={saving}
              onClick={() => openPicker(inputRef)}
            >
              <CalendarIcon className="mr-1.5 h-3 w-3" />
              {format(value, "dd MMM yyyy")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-[11px]"
              disabled={saving}
              onClick={() => openPicker(inputRef)}
              aria-label={`Edit ${label}`}
            >
              <Pencil className="h-3 w-3 mr-1" />
              Edit
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn(
              "w-full justify-start text-left text-xs rounded-lg h-8",
              "text-muted-foreground",
            )}
            disabled={saving}
            onClick={() => openPicker(inputRef)}
          >
            <CalendarIcon className="mr-1.5 h-3 w-3" />
            Set date
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-2 gap-2 mt-3">
      <Field
        label="MOT Expiry"
        value={mot}
        setValue={setMot}
        inputRef={motInputRef}
        onCommit={(d) => save("mot_expiry_date", "mot", d)}
      />
      <Field
        label="Tax Expiry"
        value={tax}
        setValue={setTax}
        inputRef={taxInputRef}
        onCommit={(d) => save("tax_expiry_date", "tax", d)}
      />
    </div>
  );
};

export default VehicleExpiryEditor;
