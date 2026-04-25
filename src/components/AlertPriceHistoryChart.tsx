import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer, CartesianGrid } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Props {
  alertId: string;
  targetPrice: number;
  isElite: boolean;
  isPro: boolean;
}

interface Point {
  date: string;
  ts: number;
  price: number;
}

const AlertPriceHistoryChart = ({ alertId, targetPrice, isElite, isPro }: Props) => {
  const navigate = useNavigate();
  const [points, setPoints] = useState<Point[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isElite) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from("price_history")
        .select("price, checked_at")
        .eq("alert_id", alertId)
        .gte("checked_at", since)
        .order("checked_at", { ascending: true });
      if (cancelled) return;
      const mapped: Point[] = (data ?? []).map((r: any) => {
        const d = new Date(r.checked_at);
        return {
          ts: d.getTime(),
          date: d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
          price: Number(r.price),
        };
      });
      setPoints(mapped);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [alertId, isElite]);

  // Pro (non-Elite) upsell
  if (!isElite) {
    if (!isPro) return null; // Free users don't see this at all
    return (
      <div
        className="mt-4 rounded-xl p-4 flex items-center justify-between gap-3"
        style={{ background: "#111111", border: "1px solid #1f1f1f" }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles size={14} style={{ color: "#4ade80" }} />
          <p style={{ fontSize: "12px", color: "#a1a1aa" }}>
            Upgrade to Elite to see 30-day price history charts
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/pricing")}
          className="shrink-0 transition-colors"
          style={{
            fontSize: "12px",
            fontWeight: 600,
            color: "#ffffff",
            background: "#cc1111",
            padding: "6px 12px",
            borderRadius: "8px",
          }}
        >
          Upgrade
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div
        className="mt-4 rounded-xl flex items-center justify-center"
        style={{ background: "#111111", border: "1px solid #1f1f1f", height: "140px" }}
      >
        <Loader2 size={16} className="animate-spin" style={{ color: "#52525b" }} />
      </div>
    );
  }

  if (points.length < 2) {
    return (
      <div
        className="mt-4 rounded-xl px-4 py-6 text-center"
        style={{ background: "#111111", border: "1px solid #1f1f1f" }}
      >
        <p style={{ fontSize: "12px", color: "#a1a1aa" }}>
          Tracking started — check back in 6 hours for first price data
        </p>
      </div>
    );
  }

  const prices = points.map((p) => p.price);
  const minP = Math.min(...prices, targetPrice);
  const maxP = Math.max(...prices, targetPrice);
  const pad = Math.max(1, (maxP - minP) * 0.15);
  const yMin = Math.max(0, minP - pad);
  const yMax = maxP + pad;

  return (
    <div
      className="mt-4 rounded-xl p-3 sm:p-4"
      style={{ background: "#111111", border: "1px solid #1f1f1f" }}
    >
      <div className="flex items-center justify-between mb-2">
        <p style={{ fontSize: "11px", color: "#71717a", letterSpacing: "0.06em", textTransform: "uppercase" }}>
          Price history · Last 30 days
        </p>
        <p style={{ fontSize: "10px", color: "#52525b" }}>
          {points.length} data {points.length === 1 ? "point" : "points"}
        </p>
      </div>
      <div style={{ width: "100%", height: 140 }}>
        <ResponsiveContainer>
          <LineChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="#1f1f1f" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: "#71717a", fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: "#1f1f1f" }}
              minTickGap={24}
            />
            <YAxis
              domain={[yMin, yMax]}
              tick={{ fill: "#71717a", fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: "#1f1f1f" }}
              tickFormatter={(v) => `£${Number(v).toFixed(0)}`}
              width={42}
            />
            <Tooltip
              contentStyle={{
                background: "#0a0a0a",
                border: "1px solid #27272a",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              labelStyle={{ color: "#a1a1aa", fontSize: "11px" }}
              itemStyle={{ color: "#ffffff" }}
              formatter={(value: number) => [`£${Number(value).toFixed(2)}`, "Price"]}
            />
            <ReferenceLine
              y={targetPrice}
              stroke="rgba(74,222,128,0.5)"
              strokeDasharray="4 4"
              label={{
                value: `Target £${targetPrice.toFixed(2)}`,
                position: "insideTopRight",
                fill: "#4ade80",
                fontSize: 10,
              }}
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke="#cc1111"
              strokeWidth={2}
              dot={{ r: 2.5, fill: "#cc1111", stroke: "#cc1111" }}
              activeDot={{ r: 4, fill: "#cc1111" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AlertPriceHistoryChart;
