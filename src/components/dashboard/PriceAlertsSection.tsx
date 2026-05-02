import { useState, useEffect, useCallback } from "react";
import { Loader2, Package, Bell, Plus } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface PriceAlert {
  id: string;
  part_name: string;
  supplier: string | null;
  target_price: number;
  current_price: number | null;
  email: string;
  url: string | null;
  image_url: string | null;
  active: boolean;
  triggered: boolean;
  triggered_at: string | null;
  last_checked_at: string | null;
  created_at: string;
}

const PriceAlertsSection = ({ userId }: { userId: string }) => {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [newPartName, setNewPartName] = useState("");
  const [newTargetPrice, setNewTargetPrice] = useState("");
  const [creating, setCreating] = useState(false);

  const createAlert = async () => {
    const name = newPartName.trim();
    const tp = parseFloat(newTargetPrice);
    if (!name || name.length > 200) { toast.error("Enter a valid part name"); return; }
    if (!tp || tp <= 0 || tp > 1000000) { toast.error("Enter a valid target price"); return; }
    setCreating(true);
    const { data: userData } = await supabase.auth.getUser();
    const email = userData.user?.email;
    if (!email) { toast.error("You must be signed in"); setCreating(false); return; }
    const { error } = await supabase.from("price_alerts").insert({
      user_id: userId,
      part_name: name,
      target_price: tp,
      email,
    });
    setCreating(false);
    if (error) {
      toast.error("Failed to create alert");
    } else {
      toast.success("Price alert created");
      setNewPartName("");
      setNewTargetPrice("");
      setCreateOpen(false);
      fetchAlerts();
    }
  };

  const fetchAlerts = useCallback(async () => {
    const { data, error } = await supabase
      .from("price_alerts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      const seen = new Set<string>();
      const unique = (data as unknown as PriceAlert[]).filter((a) => {
        const key = `${a.part_name}||${a.supplier || ""}||${a.target_price}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      setAlerts(unique);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const deleteAlert = async (id: string) => {
    setConfirmDeleteId(null);
    const removed = alerts.find((a) => a.id === id);
    setAlerts((prev) => prev.filter((a) => a.id !== id));
    const { error } = await supabase.from("price_alerts").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete alert");
      if (removed) setAlerts((prev) => [...prev, removed]);
    } else {
      toast.success("Price alert deleted");
    }
  };

  const clearAllAlerts = async () => {
    setConfirmClearAll(false);
    const backup = [...alerts];
    setAlerts([]);
    const { error } = await supabase.from("price_alerts").delete().eq("user_id", userId);
    if (error) {
      toast.error("Failed to clear alerts");
      setAlerts(backup);
    } else {
      toast.success("All alerts cleared");
    }
  };

  const startEdit = (alert: PriceAlert) => {
    setEditingId(alert.id);
    setEditPrice(Number(alert.target_price).toFixed(2));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditPrice("");
  };

  const saveEdit = async (id: string) => {
    const tp = parseFloat(editPrice);
    if (!tp || tp <= 0) { toast.error("Enter a valid target price"); return; }
    setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, target_price: tp } : a));
    setEditingId(null);
    const { error } = await supabase.from("price_alerts").update({ target_price: tp }).eq("id", id);
    if (error) {
      toast.error("Failed to update alert");
      fetchAlerts();
    } else {
      toast.success("Target price updated");
    }
  };

  return (
    <div className="glass rounded-2xl p-4 sm:p-8">
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-[11px] font-semibold tracking-widest uppercase text-destructive/60 mb-1">
            MONITORING
          </p>
          <h2 className="text-lg font-bold text-foreground">
            Price Alerts
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              {alerts.length} active
            </span>
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-destructive hover:bg-destructive/90 text-destructive-foreground text-xs font-semibold rounded-lg transition-colors"
          >
            <Plus size={14} />
            Set New Alert
          </button>
          <a
            href="/alerts"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors underline-offset-2 hover:underline"
          >
            Manage all →
          </a>
          {alerts.length > 0 && (
            <button
              onClick={() => setConfirmClearAll(true)}
              className="text-xs text-muted-foreground/50 hover:text-destructive transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 size={20} className="animate-spin text-muted-foreground" />
        </div>
      ) : alerts.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No price alerts yet"
          description="Search for a part and click 🔔 to add one — or use 'Set New Alert' above."
          actionLabel="Search Parts →"
          actionTo="/search"
        />
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {alerts.map((alert) => {
            const targetHit = alert.current_price != null && alert.current_price <= alert.target_price;
            const isEditing = editingId === alert.id;

            return (
              <div
                key={alert.id}
                className="flex items-center gap-4 bg-secondary/30 border border-border/50 rounded-xl p-4 hover:border-border transition-colors group"
              >
                <div className="w-16 h-16 flex-shrink-0 bg-secondary rounded-lg overflow-hidden">
                  {alert.image_url ? (
                    <img
                      src={alert.image_url}
                      alt={alert.part_name}
                      loading="lazy"
                      decoding="async"
                      onError={(e) => { e.currentTarget.style.display = "none"; }}
                      className="w-full h-full object-contain p-1"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground/40">
                      <Package size={20} />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate mb-1">
                    {alert.part_name}
                  </p>

                  {isEditing ? (
                    <div className="mt-1 p-2.5 bg-secondary border border-border/50 rounded-xl">
                      <div className="flex items-center gap-1.5 mb-2">
                        <button
                          onClick={() => {
                            const v = Math.max(0, parseFloat(editPrice || "0") - 1);
                            setEditPrice(v.toFixed(2));
                          }}
                          className="w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-lg border border-border bg-secondary text-foreground text-base font-light hover:bg-muted active:scale-95 transition-[colors,transform] select-none"
                        >
                          −
                        </button>
                        <div className="flex-1 relative min-w-0">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium pointer-events-none">£</span>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={editPrice}
                            onChange={(e) => {
                              const v = parseFloat(e.target.value);
                              if (isNaN(v) || v < 0) setEditPrice("0.00");
                              else setEditPrice(v.toFixed(2));
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "-") e.preventDefault();
                              if (e.key === "Enter") saveEdit(alert.id);
                              if (e.key === "Escape") cancelEdit();
                            }}
                            className="w-full pl-6 pr-2 py-1 bg-secondary border border-border rounded-lg text-foreground font-semibold text-sm text-center focus:outline-none focus:border-destructive/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            autoFocus
                          />
                        </div>
                        <button
                          onClick={() => {
                            const v = parseFloat(editPrice || "0") + 1;
                            setEditPrice(v.toFixed(2));
                          }}
                          className="w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-lg border border-border bg-secondary text-foreground text-base font-light hover:bg-muted active:scale-95 transition-[colors,transform] select-none"
                        >
                          +
                        </button>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => saveEdit(alert.id)}
                          disabled={!editPrice || parseFloat(editPrice) <= 0}
                          className="flex-1 py-1.5 bg-destructive hover:bg-destructive/90 disabled:opacity-40 text-destructive-foreground text-[11px] font-semibold rounded-lg transition-colors"
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="px-3 py-1.5 border border-border text-muted-foreground text-[11px] rounded-lg hover:text-foreground transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wide">Target</p>
                          <button
                            onClick={() => startEdit(alert)}
                            className="text-sm font-bold text-emerald-400 hover:underline cursor-pointer"
                            title="Click to edit target price"
                          >
                            £{Number(alert.target_price).toFixed(2)}
                          </button>
                        </div>
                        <div className="w-px h-8 bg-border" />
                        <div>
                          <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wide">Current</p>
                          <p className={`text-sm font-bold ${targetHit ? "text-emerald-400" : "text-foreground/80"}`}>
                            {alert.current_price != null
                              ? `£${Number(alert.current_price).toFixed(2)}`
                              : "Checking..."}
                          </p>
                        </div>
                        {targetHit && (
                          <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-semibold rounded-full">
                            🎯 TARGET HIT!
                          </span>
                        )}
                      </div>
                      {alert.current_price != null && (() => {
                        const cp = Number(alert.current_price);
                        const tp = Number(alert.target_price);
                        const pct = targetHit ? 100 : Math.max(5, Math.min(99, Math.round((tp / cp) * 100)));
                        return (
                          <div className="mt-2">
                            <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${targetHit ? "bg-emerald-500" : "bg-destructive/70"}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <p className="text-[10px] text-muted-foreground/60 mt-1">
                              {targetHit ? "Target reached" : `${pct}% of the way to your target`}
                            </p>
                          </div>
                        );
                      })()}
                      <p className="text-[10px] text-muted-foreground/50 mt-1">
                        {alert.last_checked_at
                          ? `Checked ${new Date(alert.last_checked_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}`
                          : `Set ${new Date(alert.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`}
                      </p>
                    </>
                  )}
                </div>

                {!isEditing && (
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    {alert.url && (
                      <a
                        href={alert.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 text-[11px] font-medium text-muted-foreground border border-border rounded-lg hover:border-muted-foreground/50 hover:text-foreground transition-colors text-center"
                      >
                        View ↗
                      </a>
                    )}
                    <button
                      onClick={() => setConfirmDeleteId(alert.id)}
                      className="px-3 py-1.5 text-[11px] font-medium text-muted-foreground/50 border border-border/50 rounded-lg hover:border-destructive/30 hover:text-destructive transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <p className="text-xs text-muted-foreground mt-4 text-center">
        🔔 Prices are checked every 6 hours. You'll receive an email when a price drops below your target.
      </p>

      {/* Delete single alert */}
      <AlertDialog open={!!confirmDeleteId} onOpenChange={(open) => !open && setConfirmDeleteId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this price alert?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => confirmDeleteId && deleteAlert(confirmDeleteId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear all alerts */}
      <AlertDialog open={confirmClearAll} onOpenChange={setConfirmClearAll}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete all price alerts?</AlertDialogTitle>
            <AlertDialogDescription>This will remove all {alerts.length} alerts. This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={clearAllAlerts}
            >
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create new alert */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Set a new price alert</DialogTitle>
            <DialogDescription>
              We'll email you when the part drops below your target price.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Part name
              </label>
              <input
                type="text"
                value={newPartName}
                onChange={(e) => setNewPartName(e.target.value)}
                placeholder="e.g. Brake pads BMW 320d"
                maxLength={200}
                className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-destructive/50"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Target price (£)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">£</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newTargetPrice}
                  onChange={(e) => setNewTargetPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-7 pr-3 py-2 bg-secondary border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-destructive/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setCreateOpen(false)}
                className="flex-1 px-4 py-2 border border-border text-muted-foreground text-sm rounded-lg hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createAlert}
                disabled={creating || !newPartName.trim() || !newTargetPrice}
                className="flex-1 px-4 py-2 bg-destructive hover:bg-destructive/90 disabled:opacity-40 text-destructive-foreground text-sm font-semibold rounded-lg transition-colors inline-flex items-center justify-center gap-2"
              >
                {creating && <Loader2 size={14} className="animate-spin" />}
                Create Alert
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PriceAlertsSection;
