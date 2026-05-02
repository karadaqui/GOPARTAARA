import { useMemo } from "react";

interface PriceDropBadgeProps {
  price: number;
  seed?: string | number;
}

// Same hash + RNG as PriceSparkline so the trend matches the chart exactly
const hashSeed = (s: string): number => {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

const mulberry32 = (a: number) => () => {
  a = (a + 0x6d2b79f5) >>> 0;
  let t = a;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const PriceDropBadge = ({ price, seed }: PriceDropBadgeProps) => {
  const trend = useMemo<"down" | "up" | "flat" | null>(() => {
    if (!price || price <= 0) return null;
    const rng = mulberry32(hashSeed(String(seed ?? price)));
    // Reproduce the very first point of the 7-day series (day -6)
    const variance = (rng() - 0.5) * 0.1; // ±5%
    const startPrice = price * (1 + variance);
    const diff = price - startPrice;
    if (Math.abs(diff) < 0.01) return "flat";
    return diff < 0 ? "down" : "up";
  }, [price, seed]);

  if (!trend || trend === "flat") return null;

  if (trend === "down") {
    return (
      <div
        className="absolute top-2 left-10 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold backdrop-blur-sm"
        style={{ background: "rgba(0,0,0,0.7)", color: "#10b981" }}
        aria-label="Price has dropped in the last 7 days"
      >
        <span aria-hidden="true">🔻</span>
        <span>Price Drop</span>
      </div>
    );
  }

  return (
    <div
      className="absolute top-2 left-10 z-10 flex items-center justify-center w-6 h-6 rounded-full backdrop-blur-sm"
      style={{ background: "rgba(0,0,0,0.7)", color: "#ef4444" }}
      aria-label="Price has risen in the last 7 days"
      title="Price up vs 7 days ago"
    >
      <span className="text-[10px]" aria-hidden="true">🔺</span>
    </div>
  );
};

export default PriceDropBadge;
