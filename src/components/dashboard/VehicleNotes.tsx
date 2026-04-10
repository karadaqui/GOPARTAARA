import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, StickyNote, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface VehicleNote {
  id: string;
  note: string;
  noted_at: string;
  created_at: string;
}

const VehicleNotes = ({ vehicleId, userId }: { vehicleId: string; userId: string }) => {
  const [notes, setNotes] = useState<VehicleNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchNotes();
  }, [vehicleId]);

  const fetchNotes = async () => {
    const { data, error } = await supabase
      .from("vehicle_notes" as any)
      .select("*")
      .eq("vehicle_id", vehicleId)
      .order("noted_at", { ascending: false });
    if (!error && data) setNotes(data as any);
    setLoading(false);
  };

  const addNote = async () => {
    if (!newNote.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("vehicle_notes" as any).insert({
      vehicle_id: vehicleId,
      user_id: userId,
      note: newNote.trim(),
    } as any);
    if (error) {
      toast.error("Failed to add note");
    } else {
      setNewNote("");
      fetchNotes();
    }
    setSaving(false);
  };

  const deleteNote = async (id: string) => {
    const { error } = await supabase.from("vehicle_notes" as any).delete().eq("id", id);
    if (!error) setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div className="mt-3 pt-3 border-t border-border/50">
      <p className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-2">
        <StickyNote size={10} /> Service Notes
      </p>
      
      <div className="flex gap-2 mb-2">
        <Input
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="e.g. Oil changed March 2026 - £45"
          className="rounded-lg bg-secondary border-border h-8 text-xs"
          onKeyDown={(e) => e.key === "Enter" && addNote()}
        />
        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 shrink-0" onClick={addNote} disabled={saving}>
          {saving ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
        </Button>
      </div>

      {loading ? (
        <Loader2 size={12} className="animate-spin text-muted-foreground" />
      ) : notes.length > 0 ? (
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {notes.map((n) => (
            <div key={n.id} className="flex items-start gap-2 text-xs group">
              <span className="text-muted-foreground shrink-0">
                {new Date(n.noted_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" })}
              </span>
              <span className="flex-1 text-foreground">{n.note}</span>
              <button
                onClick={() => deleteNote(n.id)}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity shrink-0"
              >
                <Trash2 size={10} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[10px] text-muted-foreground">No notes yet.</p>
      )}
    </div>
  );
};

export default VehicleNotes;
