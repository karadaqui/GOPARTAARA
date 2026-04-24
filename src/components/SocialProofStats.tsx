import { useEffect, useRef, useState } from "react";

type Stat = {
  label: string;
  /** Numeric target. Use null for non-numeric labels like "Free". */
  target: number | null;
  /** What to render when not animating / for non-numeric stats. */
  display: string;
  /** Suffix appended to animated number (e.g. "+"). */
  suffix?: string;
  /** Animation duration in ms. */
  duration?: number;
};

const stats: Stat[] = [
  { label: "Parts searchable", target: 1_000_000, display: "1,000,000+", suffix: "+", duration: 1500 },
  { label: "Live suppliers", target: 7, display: "7", duration: 800 },
  { label: "Users worldwide", target: 50_000, display: "50,000+", suffix: "+", duration: 1000 },
  { label: "Always free to use", target: null, display: "Free" },
];

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

const formatNumber = (n: number) => n.toLocaleString("en-US");

const useCountUp = (target: number | null, duration: number, start: boolean) => {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (target === null || !start) return;
    const startTime = performance.now();
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const eased = easeOutCubic(progress);
      setValue(Math.round(target * eased));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration, start]);

  return value;
};

const StatCell = ({ stat, start }: { stat: Stat; start: boolean }) => {
  const animated = useCountUp(stat.target, stat.duration ?? 1000, start);
  const text =
    stat.target === null
      ? stat.display
      : start
        ? `${formatNumber(animated)}${stat.suffix ?? ""}`
        : "0";

  return (
    <div className="stats-cell text-center py-2 px-4">
      <div
        style={{
          fontSize: "28px",
          fontWeight: 700,
          color: "#ffffff",
          lineHeight: 1.1,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {text}
      </div>
      <div
        style={{
          fontSize: "12px",
          color: "#52525b",
          marginTop: "2px",
          fontWeight: 400,
          letterSpacing: "0.04em",
        }}
      >
        {stat.label}
      </div>
    </div>
  );
};

const SocialProofStats = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [start, setStart] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setStart(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStart(true);
          observer.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      aria-label="Platform stats"
      style={{
        borderTop: "1px solid #1f1f1f",
        borderBottom: "1px solid #1f1f1f",
        padding: "20px 0",
        background: "transparent",
      }}
    >
      <div className="max-w-6xl mx-auto px-4">
        <div className="stats-grid grid grid-cols-2 md:grid-cols-4">
          {stats.map((stat) => (
            <StatCell key={stat.label} stat={stat} start={start} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default SocialProofStats;
