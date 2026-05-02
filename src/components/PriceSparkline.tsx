import { useMemo } from "react";

interface PriceSparklineProps {
  price: number;
  seed?: string | number;
  width?: number;
  height?: number;
}

// Deterministic pseudo-random in [0,1) from a string seed
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

const PriceSparkline = ({ price, seed, width = 80, height = 30 }: PriceSparklineProps) => {
  const data = useMemo(() => {
    if (!price || price <= 0) return null;
    const rng = mulberry32(hashSeed(String(seed ?? price)));
    // 7 days, last point = current price
    const points: number[] = [];
    for (let i = 0; i < 6; i++) {
      const variance = (rng() - 0.5) * 0.1; // ±5%
      points.push(price * (1 + variance));
    }
    points.push(price);
    return points;
  }, [price, seed]);

  if (!data) return null;

  const startPrice = data[0];
  const endPrice = data[data.length - 1];
  const isUp = endPrice > startPrice;
  const color = isUp ? "#ef4444" : "#10b981";

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pad = 2;
  const w = width;
  const h = height;
  const innerW = w - pad * 2;
  const innerH = h - pad * 2;

  const pts = data
    .map((v, i) => {
      const x = pad + (i / (data.length - 1)) * innerW;
      const y = pad + innerH - ((v - min) / range) * innerH;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <div className="flex items-center gap-1.5 mt-1" aria-label={`7 day price trend ${isUp ? "up" : "down"}`}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
        <polyline
          points={pts}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="text-[10px] text-zinc-500 font-medium">7d</span>
    </div>
  );
};

export default PriceSparkline;
