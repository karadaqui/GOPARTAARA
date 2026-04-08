import { useState, useEffect } from "react";
import { Bell, Trash2, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PriceAlert {
  id: string;
  part_name: string;
  supplier: string | null;
  target_price: number;
  email: string;
  url: string | null;
  active: boolean;
  created_at: string;
}

const PriceAlertsSection = ({ userId }: { userId: string }) => {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAlerts = async () => {
    const { data, error } = await supabase
      .from("price_alerts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (!error && data) setAlerts(data as PriceAlert[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchAlerts();
  }, [userId]);

  const deleteAlert = async (id: string) => {
    const { error } = await supabase.from("price_alerts").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setAlerts((prev) => prev.filter((a) => a.id !== id));
      toast({ title: "Alert removed" });
    }
  };

  return (
    <div className="glass rounded-2xl p-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg font-semibold flex items-center gap-2">
          <Bell size={18} className="text-primary" />
          Price Alerts
        </h2>
        <span className="text-xs text-muted-foreground">{alerts.length} active</span>
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
              className="flex items-start gap-3 p-3 rounded-xl bg-secondary/30 border border-border group"
            >
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <Bell size={14} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{alert.part_name}</p>
                <div className="flex flex-wrap gap-2 mt-1 text-xs text-muted-foreground">
                  {alert.supplier && (
                    <span className="bg-secondary px-2 py-0.5 rounded-md">{alert.supplier}</span>
                  )}
                  <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-md font-medium">
                    Target: £{Number(alert.target_price).toFixed(2)}
                  </span>
                  <span className="text-[10px]">
                    {new Date(alert.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                  </span>
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
                  onClick={() => deleteAlert(alert.id)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground mt-4 text-center">
        🔔 Automated price checking coming soon — your alerts are saved and ready!
      </p>
    </div>
  );
};

export default PriceAlertsSection;
