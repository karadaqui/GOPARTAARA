import { useState, useEffect } from "react";
import { Bell, Trash2, ExternalLink, Loader2, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
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

interface PriceAlert {
  id: string;
  part_name: string;
  supplier: string | null;
  target_price: number;
  current_price: number | null;
  email: string;
  url: string | null;
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

  const fetchAlerts = async () => {
    const { data, error } = await supabase
      .from("price_alerts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (!error && data) setAlerts(data as unknown as PriceAlert[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchAlerts();
  }, [userId]);

  const deleteAlert = async (id: string) => {
    setConfirmDeleteId(null);
    const { error } = await supabase.from("price_alerts").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete alert", { description: error.message });
    } else {
      setAlerts((prev) => prev.filter((a) => a.id !== id));
      toast.success("Price alert deleted");
    }
  };

  const activeAlerts = alerts.filter((a) => a.active && !a.triggered);
  const triggeredAlerts = alerts.filter((a) => a.triggered);

  return (
    <div className="glass rounded-2xl p-4 sm:p-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-base sm:text-lg font-semibold flex items-center gap-2">
          <Bell size={18} className="text-primary" />
          Price Alerts
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{activeAlerts.length} active</span>
          {triggeredAlerts.length > 0 && (
            <span className="text-xs text-emerald-400">{triggeredAlerts.length} triggered</span>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 size={20} className="animate-spin text-muted-foreground" />
        </div>
      ) : alerts.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          No price alerts yet. Search for parts and click the bell icon to set one!
        </p>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3 p-3 rounded-xl border ${
                alert.triggered
                  ? "bg-emerald-500/5 border-emerald-500/20"
                  : "bg-secondary/30 border-border"
              }`}
            >
              <div className="flex items-start gap-2 sm:gap-3 w-full sm:w-auto sm:flex-1 min-w-0">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  alert.triggered ? "bg-emerald-500/15" : "bg-primary/10"
                }`}>
                  {alert.triggered ? (
                    <CheckCircle2 size={14} className="text-emerald-400" />
                  ) : (
                    <Bell size={14} className="text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium line-clamp-2">{alert.part_name}</p>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {alert.supplier && (
                      <span className="text-xs bg-secondary px-2 py-0.5 rounded-md text-muted-foreground">{alert.supplier}</span>
                    )}
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-md font-medium">
                      Target: £{Number(alert.target_price).toFixed(2)}
                    </span>
                    {alert.current_price != null && (
                      <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${
                        alert.current_price <= alert.target_price
                          ? "bg-emerald-500/15 text-emerald-400"
                          : "bg-secondary text-muted-foreground"
                      }`}>
                        Now: £{Number(alert.current_price).toFixed(2)}
                      </span>
                    )}
                  </div>
                  <div className="mt-1.5">
                    {alert.triggered && alert.triggered_at && (
                      <span className="text-emerald-400 text-[10px] flex items-center gap-0.5">
                        <CheckCircle2 size={10} /> Triggered {new Date(alert.triggered_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                      </span>
                    )}
                    {!alert.triggered && alert.last_checked_at && (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                        <Clock size={10} /> Checked {new Date(alert.last_checked_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    )}
                    {!alert.triggered && !alert.last_checked_at && (
                      <span className="text-[10px] text-muted-foreground">
                        Set {new Date(alert.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {alert.url && (
                    <a
                      href={alert.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ExternalLink size={13} />
                    </a>
                  )}
                  <button
                    onClick={() => setConfirmDeleteId(alert.id)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground mt-4 text-center">
        🔔 Prices are checked every 6 hours. You'll receive an email when a price drops below your target.
      </p>

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
    </div>
  );
};

export default PriceAlertsSection;