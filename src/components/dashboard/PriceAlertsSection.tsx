import { useState, useEffect } from "react";
import { Loader2, Package } from "lucide-react";
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

  const fetchAlerts = async () => {
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
  };

  useEffect(() => {
    fetchAlerts();
  }, [userId]);

  const deleteAlert = async (id: string) => {
    setConfirmDeleteId(null);
    setAlerts((prev) => prev.filter((a) => a.id !== id));
    const { error } = await supabase.from("price_alerts").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete alert", { description: error.message });
      fetchAlerts();
    } else {
      toast.success("Price alert deleted");
    }
  };

  

  return (
    <div className="glass rounded-2xl p-4 sm:p-8">
      {/* Header */}
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
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 size={20} className="animate-spin text-muted-foreground" />
        </div>
      ) : alerts.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          No price alerts yet. Search for parts and click the bell icon to set one!
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {alerts.map((alert) => {
            const targetHit = alert.current_price != null && alert.current_price <= alert.target_price;

            return (
              <div
                key={alert.id}
                className="flex items-center gap-4 bg-secondary/30 border border-border/50 rounded-xl p-4 hover:border-border transition-all group"
              >
                {/* Product Image */}
                <div className="w-16 h-16 flex-shrink-0 bg-secondary rounded-lg overflow-hidden">
                  {(alert as any).image_url ? (
                    <img
                      src={(alert as any).image_url}
                      alt={alert.part_name}
                      onError={(e) => { e.currentTarget.style.display = "none"; }}
                      className="w-full h-full object-contain p-1"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground/40">
                      <Package size={20} />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate mb-1">
                    {alert.part_name}
                  </p>
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wide">Target</p>
                      <p className="text-sm font-bold text-emerald-400">
                        £{Number(alert.target_price).toFixed(2)}
                      </p>
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
                  <p className="text-[10px] text-muted-foreground/50 mt-1">
                    {alert.last_checked_at
                      ? `Checked ${new Date(alert.last_checked_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}`
                      : `Set ${new Date(alert.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 flex-shrink-0">
                  {alert.url && (
                    <a
                      href={alert.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 text-[11px] font-medium text-muted-foreground border border-border rounded-lg hover:border-muted-foreground/50 hover:text-foreground transition-all text-center"
                    >
                      View ↗
                    </a>
                  )}
                  <button
                    onClick={() => setConfirmDeleteId(alert.id)}
                    className="px-3 py-1.5 text-[11px] font-medium text-muted-foreground/50 border border-border/50 rounded-lg hover:border-destructive/30 hover:text-destructive transition-all"
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
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
