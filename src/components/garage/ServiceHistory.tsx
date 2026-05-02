import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Wrench, Trash2, X } from "lucide-react";

interface ServiceRecord {
  id: string;
  date: string;
  type: string;
  cost: string;
  notes: string;
}

const SERVICE_TYPES = ["Oil Change", "Brake Service", "Tyre Change", "MOT", "Other"];
const STORAGE_KEY = "gopartara_service_history";

const loadAll = (): Record<string, ServiceRecord[]> => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
};

const saveAll = (data: Record<string, ServiceRecord[]>) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

const ServiceHistory = ({ vehicleId }: { vehicleId: string }) => {
  const [records, setRecords] = useState<ServiceRecord[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [type, setType] = useState("Oil Change");
  const [cost, setCost] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const all = loadAll();
    setRecords(all[vehicleId] || []);
  }, [vehicleId]);

  const persist = (next: ServiceRecord[]) => {
    const all = loadAll();
    all[vehicleId] = next;
    saveAll(all);
    setRecords(next);
  };

  const handleSave = () => {
    if (!date || !type) return;
    const rec: ServiceRecord = {
      id: crypto.randomUUID(),
      date,
      type,
      cost: cost.trim(),
      notes: notes.trim(),
    };
    const next = [rec, ...records].sort((a, b) => b.date.localeCompare(a.date));
    persist(next);
    setCost("");
    setNotes("");
    setType("Oil Change");
    setDate(new Date().toISOString().slice(0, 10));
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    persist(records.filter(r => r.id !== id));
  };

  return (
    <div className="mt-4 pt-4 border-t border-border">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <Wrench size={12} className="text-primary" />
          Service History
        </h4>
        <button
          onClick={() => setShowForm(s => !s)}
          className="text-[11px] text-primary hover:underline flex items-center gap-1"
        >
          {showForm ? <X size={11} /> : <Plus size={11} />}
          {showForm ? "Cancel" : "Add Service Record"}
        </button>
      </div>

      {showForm && (
        <div className="space-y-2 mb-3 p-3 rounded-xl bg-secondary/50 border border-border animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-muted-foreground mb-1 block">Date</label>
              <Input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="h-9 rounded-lg bg-background border-border text-xs"
              />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground mb-1 block">Service Type</label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="h-9 rounded-lg bg-background border-border text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SERVICE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground mb-1 block">Cost (£)</label>
            <Input
              type="number"
              inputMode="decimal"
              value={cost}
              onChange={e => setCost(e.target.value)}
              placeholder="e.g. 45.00"
              className="h-9 rounded-lg bg-background border-border text-xs"
            />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground mb-1 block">Notes</label>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Optional details..."
              className="min-h-[60px] rounded-lg bg-background border-border text-xs"
            />
          </div>
          <Button size="sm" onClick={handleSave} className="w-full rounded-lg h-8 text-xs">
            Save Record
          </Button>
        </div>
      )}

      {records.length === 0 ? (
        <p className="text-[11px] text-muted-foreground italic">No service records yet</p>
      ) : (
        <ul className="space-y-2">
          {records.map(r => (
            <li key={r.id} className="relative pl-4 border-l-2 border-primary/40 group/rec">
              <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-primary" />
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-semibold text-foreground">{r.type}</span>
                    <span className="text-[10px] text-muted-foreground">{r.date}</span>
                    {r.cost && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                        £{r.cost}
                      </span>
                    )}
                  </div>
                  {r.notes && <p className="text-[11px] text-muted-foreground mt-0.5 break-words">{r.notes}</p>}
                </div>
                <button
                  onClick={() => handleDelete(r.id)}
                  className="opacity-0 group-hover/rec:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0"
                  aria-label="Delete record"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ServiceHistory;
