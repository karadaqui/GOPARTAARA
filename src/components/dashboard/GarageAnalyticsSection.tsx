import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  CalendarDays,
  Activity,
  Car,
  TrendingDown,
  ArrowRight,
  Sparkles,
  Loader2,
  Lock,
} from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

interface Props {
  userId: string;
  isElite: boolean;
}

type Vehicle = Tables<"user_vehicles">;
type Alert = Tables<"price_alerts">;

const CARD_STYLE: React.CSSProperties = {
  background: "#111111",
  border: "1px solid #1f1f1f",
  borderRadius: "16px",
  padding: "24px",
};

const motStatus = (date: string | null) => {
  if (!date) {
    return {
      label: "Not set",
      color: "#71717a",
      bg: "#1a1a1a",
      severity: "none" as const,
      monthsLeft: null as number | null,
    };
  }
  const expiry = new Date(date);
  const now = new Date();
  const diffMs = expiry.getTime() - now.getTime();
  const days = diffMs / (1000 * 60 * 60 * 24);
  const months = days / 30;
  if (days < 0) {
    return {
      label: "Expired",
      color: "#ef4444",
      bg: "rgba(239,68,68,0.12)",
      severity: "expired" as const,
      monthsLeft: months,
    };
  }
  if (months < 1) {
    return {
      label: `${Math.max(0, Math.ceil(days))}d left`,
      color: "#ef4444",
      bg: "rgba(239,68,68,0.12)",
      severity: "critical" as const,
      monthsLeft: months,
    };
  }
  if (months < 3) {
    return {
      label: `${Math.ceil(months)} mo left`,
      color: "#f59e0b",
      bg: "rgba(245,158,11,0.12)",
      severity: "warn" as const,
      monthsLeft: months,
    };
  }
  return {
    label: "Valid",
    color: "#4ade80",
    bg: "rgba(74,222,128,0.12)",
    severity: "ok" as const,
    monthsLeft: months,
  };
};

const fmtGBP = (n: number) =>
  n.toLocaleString("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 2 });

const UpgradeBanner = () => {
  const navigate = useNavigate();
  return (
    <div
      className="rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6"
      style={{
        background:
          "linear-gradient(135deg, rgba(251,191,36,0.08) 0%, rgba(204,17,17,0.06) 100%)",
        border: "1px solid #1f1f1f",
      }}
    >
      <div
        className="flex items-center justify-center shrink-0"
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          background: "rgba(251,191,36,0.12)",
          color: "#fbbf24",
        }}
      >
        <Lock size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <p
          style={{
            fontSize: 11,
            color: "#fbbf24",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            fontWeight: 700,
          }}
        >
          Elite
        </p>
        <h3 className="mt-1" style={{ fontSize: 18, fontWeight: 700, color: "#ffffff" }}>
          Unlock Garage Analytics with Elite
        </h3>
        <p className="mt-1" style={{ fontSize: 13, color: "#a1a1aa" }}>
          MOT calendar, parts activity, vehicle insights and a savings tracker — derived
          automatically from your garage. £19.99/mo.
        </p>
      </div>
      <button
        type="button"
        onClick={() => navigate("/pricing")}
        className="shrink-0 inline-flex items-center gap-2 transition-colors"
        style={{
          background: "#cc1111",
          color: "#fff",
          fontSize: 13,
          fontWeight: 600,
          padding: "10px 16px",
          borderRadius: 10,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "#b30f0f")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "#cc1111")}
      >
        Upgrade to Elite <ArrowRight size={14} />
      </button>
    </div>
  );
};

const SectionHeader = () => (
  <div className="mb-5">
    <p
      style={{
        fontSize: 11,
        color: "#fbbf24",
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        fontWeight: 700,
      }}
    >
      Elite
    </p>
    <h2
      className="font-display mt-1"
      style={{ fontSize: 22, fontWeight: 700, color: "#ffffff" }}
    >
      Garage Analytics
    </h2>
    <p className="mt-1" style={{ fontSize: 13, color: "#a1a1aa" }}>
      Insights derived automatically from your garage, searches and price alerts.
    </p>
  </div>
);

const GarageAnalyticsSection = ({ userId, isElite }: Props) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [savedCount, setSavedCount] = useState(0);
  const [uniqueSearchCount, setUniqueSearchCount] = useState(0);

  useEffect(() => {
    if (!isElite) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const [vRes, aRes, sRes, hRes] = await Promise.all([
        supabase
          .from("user_vehicles")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: true }),
        supabase
          .from("price_alerts")
          .select("*")
          .eq("user_id", userId)
          .eq("active", true),
        supabase
          .from("saved_parts")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId),
        supabase
          .from("search_history")
          .select("query")
          .eq("user_id", userId)
          .gte("created_at", startOfMonth.toISOString()),
      ]);

      if (cancelled) return;
      setVehicles((vRes.data ?? []) as Vehicle[]);
      setAlerts((aRes.data ?? []) as Alert[]);
      setSavedCount(sRes.count ?? 0);
      const unique = new Set(
        (hRes.data ?? [])
          .map((r: any) => (r.query ?? "").toString().trim().toLowerCase())
          .filter(Boolean)
      );
      setUniqueSearchCount(unique.size);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, isElite]);

  const trackedSavings = useMemo(() => {
    return alerts.reduce((sum, a) => {
      const cur = a.current_price != null ? Number(a.current_price) : null;
      const target = Number(a.target_price);
      if (cur != null && cur > target) return sum + (cur - target);
      return sum;
    }, 0);
  }, [alerts]);

  const savingsRows = useMemo(() => {
    return alerts
      .filter(
        (a) =>
          a.current_price != null && Number(a.current_price) > Number(a.target_price)
      )
      .map((a) => ({
        id: a.id,
        name: a.part_name,
        current: Number(a.current_price),
        target: Number(a.target_price),
        saving: Number(a.current_price) - Number(a.target_price),
      }))
      .sort((a, b) => b.saving - a.saving);
  }, [alerts]);

  if (!isElite) {
    return (
      <section id="garage-analytics" className="mb-6 scroll-mt-24">
        <SectionHeader />
        <UpgradeBanner />
      </section>
    );
  }

  if (loading) {
    return (
      <section id="garage-analytics" className="mb-6 scroll-mt-24">
        <SectionHeader />
        <div
          className="rounded-2xl flex items-center justify-center"
          style={{ ...CARD_STYLE, height: 160 }}
        >
          <Loader2 size={18} className="animate-spin" style={{ color: "#52525b" }} />
        </div>
      </section>
    );
  }

  return (
    <section id="garage-analytics" className="mb-6 scroll-mt-24">
      <SectionHeader />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1 — MOT & Tax Calendar */}
        <div style={CARD_STYLE}>
          <div className="flex items-center gap-2 mb-4">
            <CalendarDays size={16} style={{ color: "#fbbf24" }} />
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#ffffff" }}>
              MOT & Tax Calendar
            </h3>
          </div>

          {vehicles.length === 0 ? (
            <p style={{ fontSize: 13, color: "#a1a1aa" }}>
              No vehicles yet.{" "}
              <button
                onClick={() => navigate("/garage")}
                className="underline hover:text-white"
                style={{ color: "#cc1111" }}
              >
                Add a vehicle
              </button>
            </p>
          ) : (
            <ul className="space-y-3">
              {vehicles.map((v) => {
                const mot = motStatus(v.mot_expiry_date);
                const tax = motStatus(v.tax_expiry_date);
                return (
                  <li
                    key={v.id}
                    className="rounded-xl p-3"
                    style={{ background: "#0a0a0a", border: "1px solid #1f1f1f" }}
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <p
                        className="truncate"
                        style={{ fontSize: 13, fontWeight: 600, color: "#ffffff" }}
                      >
                        {v.nickname || `${v.make} ${v.model}`}{" "}
                        <span style={{ color: "#71717a", fontWeight: 400 }}>
                          · {v.year}
                        </span>
                      </p>
                      <button
                        type="button"
                        onClick={() => navigate("/garage")}
                        className="transition-colors"
                        style={{ fontSize: 11, color: "#a1a1aa" }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.color = "#ffffff")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.color = "#a1a1aa")
                        }
                      >
                        {v.mot_expiry_date ? "Edit" : "Set MOT date"} →
                      </button>
                    </div>
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      <span
                        style={{
                          fontSize: 10,
                          color: "#71717a",
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                        }}
                      >
                        MOT
                      </span>
                      <span
                        style={{
                          background: mot.bg,
                          color: mot.color,
                          fontSize: 11,
                          fontWeight: 600,
                          padding: "2px 8px",
                          borderRadius: 999,
                        }}
                      >
                        {mot.label}
                      </span>
                      <span style={{ fontSize: 11, color: "#52525b" }}>·</span>
                      <span
                        style={{
                          fontSize: 10,
                          color: "#71717a",
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                        }}
                      >
                        Tax
                      </span>
                      <span
                        style={{
                          background: tax.bg,
                          color: tax.color,
                          fontSize: 11,
                          fontWeight: 600,
                          padding: "2px 8px",
                          borderRadius: 999,
                        }}
                      >
                        {tax.label}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* 2 — Parts Activity */}
        <div style={CARD_STYLE}>
          <div className="flex items-center gap-2 mb-4">
            <Activity size={16} style={{ color: "#fbbf24" }} />
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#ffffff" }}>
              Parts Activity
            </h3>
          </div>
          <ul className="space-y-3">
            <ActivityRow
              label="Unique parts searched this month"
              value={uniqueSearchCount.toString()}
            />
            <ActivityRow label="Parts saved to your list" value={savedCount.toString()} />
            <ActivityRow label="Active price alerts" value={alerts.length.toString()} />
            <ActivityRow
              label="Potential savings being tracked"
              value={fmtGBP(trackedSavings)}
              highlight
            />
          </ul>
        </div>

        {/* 3 — Vehicles Summary */}
        <div style={CARD_STYLE}>
          <div className="flex items-center gap-2 mb-4">
            <Car size={16} style={{ color: "#fbbf24" }} />
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#ffffff" }}>
              Vehicles Summary
            </h3>
          </div>
          {vehicles.length === 0 ? (
            <p style={{ fontSize: 13, color: "#a1a1aa" }}>No vehicles in your garage.</p>
          ) : (
            <ul className="divide-y" style={{ borderColor: "#1f1f1f" }}>
              {vehicles.map((v) => {
                const mot = motStatus(v.mot_expiry_date);
                const q = encodeURIComponent(`${v.make} ${v.model} parts`);
                return (
                  <li
                    key={v.id}
                    className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0 border-t first:border-t-0"
                    style={{ borderColor: "#1f1f1f" }}
                  >
                    <div className="min-w-0 flex-1">
                      <p
                        className="truncate"
                        style={{ fontSize: 13, fontWeight: 600, color: "#ffffff" }}
                      >
                        {v.make} {v.model} {v.year}
                      </p>
                      <p
                        className="mt-0.5"
                        style={{ fontSize: 11, color: "#71717a" }}
                      >
                        {v.engine_size ? `${v.engine_size} engine` : "Engine size not set"}
                      </p>
                    </div>
                    <span
                      style={{
                        background: mot.bg,
                        color: mot.color,
                        fontSize: 11,
                        fontWeight: 600,
                        padding: "3px 8px",
                        borderRadius: 999,
                        whiteSpace: "nowrap",
                      }}
                      title={`MOT ${mot.label}`}
                    >
                      MOT · {mot.label}
                    </span>
                    <button
                      type="button"
                      onClick={() => navigate(`/search?q=${q}`)}
                      className="shrink-0 transition-colors"
                      style={{ fontSize: 12, color: "#cc1111", fontWeight: 600 }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "#cc1111")}
                    >
                      Find parts →
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* 4 — Price Alert Savings Tracker */}
        <div style={CARD_STYLE}>
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown size={16} style={{ color: "#fbbf24" }} />
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#ffffff" }}>
              Savings Tracker
            </h3>
          </div>

          {savingsRows.length === 0 ? (
            <div className="text-center py-6">
              <Sparkles size={20} style={{ color: "#3f3f46", margin: "0 auto" }} />
              <p className="mt-2" style={{ fontSize: 13, color: "#a1a1aa" }}>
                No tracked savings yet. Set price alerts to monitor opportunities.
              </p>
              <button
                type="button"
                onClick={() => navigate("/alerts")}
                className="mt-3 inline-flex items-center gap-1 transition-colors"
                style={{ fontSize: 12, color: "#cc1111", fontWeight: 600 }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#cc1111")}
              >
                Manage alerts →
              </button>
            </div>
          ) : (
            <>
              <ul className="space-y-2">
                {savingsRows.slice(0, 5).map((row) => (
                  <li
                    key={row.id}
                    className="rounded-xl p-3 flex items-center justify-between gap-3"
                    style={{ background: "#0a0a0a", border: "1px solid #1f1f1f" }}
                  >
                    <div className="min-w-0 flex-1">
                      <p
                        className="truncate"
                        style={{ fontSize: 13, fontWeight: 600, color: "#ffffff" }}
                      >
                        {row.name}
                      </p>
                      <p
                        className="mt-0.5"
                        style={{ fontSize: 11, color: "#71717a" }}
                      >
                        Now {fmtGBP(row.current)} · target {fmtGBP(row.target)}
                      </p>
                    </div>
                    <span
                      className="shrink-0"
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: "#4ade80",
                      }}
                    >
                      −{fmtGBP(row.saving)}
                    </span>
                  </li>
                ))}
              </ul>
              <div
                className="mt-4 pt-3 flex items-center justify-between"
                style={{ borderTop: "1px solid #1f1f1f" }}
              >
                <span style={{ fontSize: 12, color: "#a1a1aa" }}>
                  Total potential savings
                </span>
                <span style={{ fontSize: 16, fontWeight: 800, color: "#4ade80" }}>
                  {fmtGBP(trackedSavings)}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
};

const ActivityRow = ({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) => (
  <li
    className="flex items-center justify-between gap-3 py-2 border-t first:border-t-0 first:pt-0"
    style={{ borderColor: "#1f1f1f" }}
  >
    <span style={{ fontSize: 13, color: "#a1a1aa" }}>{label}</span>
    <span
      style={{
        fontSize: highlight ? 18 : 15,
        fontWeight: highlight ? 800 : 700,
        color: highlight ? "#4ade80" : "#ffffff",
      }}
    >
      {value}
    </span>
  </li>
);

export default GarageAnalyticsSection;
