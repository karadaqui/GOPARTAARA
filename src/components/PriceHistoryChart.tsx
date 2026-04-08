import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface Props {
  partQuery: string;
  supplier: string;
}

const PriceHistoryChart = ({ partQuery, supplier }: Props) => {
  // Generate deterministic mock data based on part+supplier
  const data = useMemo(() => {
    const seed = (partQuery + supplier).split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    const basePrice = 20 + (seed % 180);
    const points = [];
    const now = new Date();

    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const variance = Math.sin(seed + i * 0.7) * (basePrice * 0.15);
      const price = Math.max(5, basePrice + variance);
      points.push({
        date: date.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
        price: Math.round(price * 100) / 100,
      });
    }
    return points;
  }, [partQuery, supplier]);

  const minPrice = Math.min(...data.map((d) => d.price));
  const maxPrice = Math.max(...data.map((d) => d.price));

  return (
    <div className="mt-2">
      <p className="text-[10px] text-muted-foreground mb-1">Price trend (30 days) · Estimated</p>
      <div className="h-[60px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis dataKey="date" hide />
            <YAxis domain={[minPrice * 0.9, maxPrice * 1.1]} hide />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: "11px",
                padding: "4px 8px",
              }}
              formatter={(value: number) => [`£${value.toFixed(2)}`, "Price"]}
              labelStyle={{ fontSize: "10px", color: "hsl(var(--muted-foreground))" }}
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke="hsl(var(--primary))"
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 3, fill: "hsl(var(--primary))" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PriceHistoryChart;
