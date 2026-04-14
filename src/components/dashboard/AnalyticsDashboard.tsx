import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Loader2, TrendingDown } from "lucide-react";

const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

const AnalyticsDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [searchHistory, setSearchHistory] = useState<any[]>([]);
  const [savedPartsCount, setSavedPartsCount] = useState(0);
  const [alertsCount, setAlertsCount] = useState(0);
  const [priceAlerts, setPriceAlerts] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    try {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const [historyRes, savedRes, alertsRes, alertsDataRes] = await Promise.all([
        supabase
          .from("search_history")
          .select("*")
          .eq("user_id", user.id)
          .gte("created_at", startOfMonth.toISOString())
          .order("created_at", { ascending: true }),
        supabase
          .from("saved_parts")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
        supabase
          .from("price_alerts")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("active", true),
        supabase
          .from("price_alerts")
          .select("*")
          .eq("user_id", user.id)
          .eq("triggered", true),
      ]);

      setSearchHistory(historyRes.data || []);
      setSavedPartsCount(savedRes.count || 0);
      setAlertsCount(alertsRes.count || 0);
      setPriceAlerts(alertsDataRes.data || []);
    } catch {
      // silently ignore
    }
    setLoading(false);
  };

  // Weekly search data
  const weeklyData = useMemo(() => {
    const weeks: Record<string, number> = {};
    const now = new Date();
    for (let i = 0; i < 4; i++) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (now.getDay() || 7) - (i * 7) + 1);
      const label = `W${4 - i}`;
      weeks[label] = 0;
    }

    for (const item of searchHistory) {
      const d = new Date(item.created_at);
      const dayOfMonth = d.getDate();
      const weekNum = Math.min(4, Math.ceil(dayOfMonth / 7));
      const key = `W${weekNum}`;
      if (weeks[key] !== undefined) weeks[key]++;
    }

    return Object.entries(weeks).map(([name, searches]) => ({ name, searches }));
  }, [searchHistory]);

  // Top search terms
  const topTerms = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of searchHistory) {
      const q = item.query?.toLowerCase().trim();
      if (q) counts[q] = (counts[q] || 0) + 1;
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([term, count]) => ({ term, count }));
  }, [searchHistory]);

  // Donut data
  const donutData = useMemo(() => [
    { name: "Saved Parts", value: savedPartsCount },
    { name: "Price Alerts", value: alertsCount },
  ], [savedPartsCount, alertsCount]);

  // Money saved estimate
  const moneySaved = useMemo(() => {
    let total = 0;
    for (const alert of priceAlerts) {
      if (alert.target_price && alert.current_price && alert.current_price < alert.target_price) {
        total += (alert.target_price - alert.current_price);
      }
    }
    return total;
  }, [priceAlerts]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  const tooltipStyle = {
    backgroundColor: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "8px",
    fontSize: "11px",
    padding: "6px 10px",
  };

  return (
    <div className="space-y-4">
      {/* Row 1: Bar chart + Top terms */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Weekly searches */}
        <div className="rounded-xl bg-secondary/30 border border-border p-4">
          <p className="text-xs font-medium text-muted-foreground mb-3">Searches This Month (by week)</p>
          <div className="h-[140px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis hide allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="searches" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top search terms */}
        <div className="rounded-xl bg-secondary/30 border border-border p-4">
          <p className="text-xs font-medium text-muted-foreground mb-3">Most Searched Terms</p>
          {topTerms.length === 0 ? (
            <p className="text-xs text-muted-foreground py-6 text-center">No searches this month yet.</p>
          ) : (
            <div className="space-y-2">
              {topTerms.map((t, i) => (
                <div key={t.term} className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground w-4 shrink-0">{i + 1}.</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium truncate">{t.term}</span>
                      <span className="text-[10px] text-muted-foreground shrink-0">({t.count})</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-secondary mt-1 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary/70"
                        style={{ width: `${Math.min(100, (t.count / (topTerms[0]?.count || 1)) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Row 2: Donut + Money saved */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Donut chart */}
        <div className="rounded-xl bg-secondary/30 border border-border p-4">
          <p className="text-xs font-medium text-muted-foreground mb-3">Saved Parts vs Alerts</p>
          <div className="h-[140px] flex items-center justify-center">
            {savedPartsCount === 0 && alertsCount === 0 ? (
              <p className="text-xs text-muted-foreground">No data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={35}
                    outerRadius={55}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {donutData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="flex justify-center gap-4 mt-1">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[0] }} />
              <span className="text-[10px] text-muted-foreground">Saved ({savedPartsCount})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[1] }} />
              <span className="text-[10px] text-muted-foreground">Alerts ({alertsCount})</span>
            </div>
          </div>
        </div>

        {/* Money saved */}
        <div className="rounded-xl bg-secondary/30 border border-border p-4 flex flex-col items-center justify-center">
          <TrendingDown size={24} className="text-green-500 mb-2" />
          <p className="text-xs font-medium text-muted-foreground mb-1">Estimated Savings</p>
          <p className="font-display text-3xl font-bold text-green-500">
            £{moneySaved.toFixed(2)}
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">
            From {priceAlerts.length} triggered price alert{priceAlerts.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
