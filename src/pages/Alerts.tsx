import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserPlan } from "@/hooks/useUserPlan";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Bell, Package, Loader2, X, Search, Mail, Pencil, Check, Sparkles } from "lucide-react";
import { toast } from "sonner";
import AlertPriceHistoryChart from "@/components/AlertPriceHistoryChart";
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

type AlertFrequency = "immediate" | "daily" | "weekly";

const FREQ_KEY = "partara_alert_frequency";
const EMAIL_OPT_KEY = "partara_alert_email_enabled";
const EMAIL_OVERRIDE_KEY = "partara_alert_email_override";

const Alerts = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isFree, isPro, isElite, isAdmin, loading: planLoading } = useUserPlan();
  const eliteAccess = isElite || isAdmin;

  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Notification settings (client-side preferences)
  const [emailEnabled, setEmailEnabled] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    const v = localStorage.getItem(EMAIL_OPT_KEY);
    return v === null ? true : v === "1";
  });
  const [frequency, setFrequency] = useState<AlertFrequency>(() => {
    if (typeof window === "undefined") return "immediate";
    return (localStorage.getItem(FREQ_KEY) as AlertFrequency) || "immediate";
  });
  const [editingEmail, setEditingEmail] = useState(false);
  const [emailDraft, setEmailDraft] = useState("");
  const [notifyEmail, setNotifyEmail] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem(EMAIL_OVERRIDE_KEY) || "";
  });

  useEffect(() => {
    if (!notifyEmail && user?.email) setNotifyEmail(user.email);
  }, [user?.email, notifyEmail]);

  useEffect(() => {
    if (!user) {
      navigate("/auth?redirect=/alerts");
    }
  }, [user, navigate]);

  const fetchAlerts = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("price_alerts")
      .select("*")
      .eq("user_id", user.id)
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
  }, [user]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const deleteAlert = async (id: string) => {
    setConfirmDeleteId(null);
    const removed = alerts.find((a) => a.id === id);
    setAlerts((prev) => prev.filter((a) => a.id !== id));
    const { error } = await supabase.from("price_alerts").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete alert");
      if (removed) setAlerts((prev) => [removed, ...prev]);
    } else {
      toast.success("Alert removed");
    }
  };

  const persistEmailEnabled = (next: boolean) => {
    setEmailEnabled(next);
    try { localStorage.setItem(EMAIL_OPT_KEY, next ? "1" : "0"); } catch {}
    toast.success(next ? "Email notifications on" : "Email notifications off");
  };

  const persistFrequency = (next: AlertFrequency) => {
    setFrequency(next);
    try { localStorage.setItem(FREQ_KEY, next); } catch {}
    toast.success(`Frequency set to ${next === "immediate" ? "immediately" : next} digest${next === "immediate" ? "" : ""}`);
  };

  const startEditEmail = () => {
    setEmailDraft(notifyEmail);
    setEditingEmail(true);
  };

  const saveEmail = () => {
    const next = emailDraft.trim();
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(next);
    if (!valid) { toast.error("Enter a valid email"); return; }
    setNotifyEmail(next);
    try { localStorage.setItem(EMAIL_OVERRIDE_KEY, next); } catch {}
    setEditingEmail(false);
    toast.success("Notification email updated");
  };

  const stats = useMemo(() => {
    const active = alerts.filter((a) => a.active).length;
    const triggered = alerts.filter((a) => a.triggered).length;
    return { active, triggered };
  }, [alerts]);

  const showProUpsell = !planLoading && isFree && !isAdmin;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#0a0a0a" }}>
      <SEOHead
        title="Price Alerts | GOPARTARA — Get Notified When Prices Drop"
        description="Manage your price alerts. Set target prices for car parts and we'll email you the moment a price drops below your target."
        path="/alerts"
      />
      <Navbar />

      <main className="flex-1 px-4 py-8 sm:py-12">
        <div className="max-w-5xl mx-auto">
          <Breadcrumbs items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Price Alerts" }]} />

          {/* Header */}
          <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mt-3 mb-8">
            <div>
              <h1
                style={{ fontSize: "32px", fontWeight: 800, color: "#ffffff", letterSpacing: "-0.02em", lineHeight: 1.1 }}
              >
                Price Alerts
              </h1>
              <p className="mt-2" style={{ fontSize: "15px", color: "#a1a1aa" }}>
                Get notified when prices drop to your target
              </p>
              {alerts.length > 0 && (
                <p className="mt-2" style={{ fontSize: "12px", color: "#52525b" }}>
                  {stats.active} active · {stats.triggered} triggered
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => navigate("/search")}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold transition-colors"
              style={{ background: "#cc1111", color: "#ffffff", fontSize: "14px" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#b30f0f"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#cc1111"; }}
            >
              <Bell size={16} /> Set New Alert
            </button>
          </header>

          {/* Pro upsell */}
          {showProUpsell && (
            <div
              className="rounded-2xl p-5 mb-8 flex flex-col sm:flex-row items-start sm:items-center gap-4"
              style={{
                background: "rgba(204,17,17,0.08)",
                border: "1px solid #cc1111",
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(204,17,17,0.18)" }}
              >
                <Sparkles size={18} style={{ color: "#ff6b6b" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p style={{ fontSize: "15px", fontWeight: 600, color: "#ffffff" }}>
                  Set unlimited alerts with Pro
                </p>
                <p className="mt-0.5" style={{ fontSize: "13px", color: "#a1a1aa" }}>
                  Upgrade from £9.99/mo for unlimited price alerts, photo search, and more.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate("/pricing")}
                className="px-4 py-2.5 rounded-xl font-semibold transition-colors whitespace-nowrap"
                style={{ background: "#cc1111", color: "#ffffff", fontSize: "13px" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#b30f0f"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#cc1111"; }}
              >
                Upgrade →
              </button>
            </div>
          )}

          {/* Alerts list */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={22} className="animate-spin" style={{ color: "#71717a" }} />
            </div>
          ) : alerts.length === 0 ? (
            <EmptyAlertsState onBrowse={() => navigate("/search")} />
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {alerts.map((a) => (
                <AlertCard
                  key={a.id}
                  alert={a}
                  onRemove={() => setConfirmDeleteId(a.id)}
                  isElite={eliteAccess}
                  isPro={isPro}
                />
              ))}
            </div>
          )}

          {/* Notification settings */}
          <section
            className="mt-10 rounded-2xl p-6"
            style={{ background: "#111111", border: "1px solid #1f1f1f" }}
          >
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#ffffff" }}>
              Notification settings
            </h2>
            <p className="mt-1" style={{ fontSize: "13px", color: "#71717a" }}>
              Control how and when GOPARTARA notifies you about price changes.
            </p>

            {/* Email toggle */}
            <div className="mt-6 flex items-center justify-between gap-4 py-4 border-t" style={{ borderColor: "#1f1f1f" }}>
              <div className="min-w-0">
                <p style={{ fontSize: "14px", fontWeight: 600, color: "#ffffff" }}>Email notifications</p>
                <p className="mt-0.5" style={{ fontSize: "12px", color: "#71717a" }}>
                  Receive an email the moment a price drops below your target.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={emailEnabled}
                onClick={() => persistEmailEnabled(!emailEnabled)}
                className="relative inline-flex items-center transition-colors flex-shrink-0"
                style={{
                  width: "44px",
                  height: "24px",
                  borderRadius: "999px",
                  background: emailEnabled ? "#cc1111" : "#27272a",
                }}
              >
                <span
                  className="inline-block transition-transform"
                  style={{
                    width: "18px",
                    height: "18px",
                    borderRadius: "999px",
                    background: "#ffffff",
                    transform: emailEnabled ? "translateX(23px)" : "translateX(3px)",
                  }}
                />
              </button>
            </div>

            {/* Email address */}
            <div className="flex items-center justify-between gap-4 py-4 border-t" style={{ borderColor: "#1f1f1f" }}>
              <div className="min-w-0 flex-1">
                <p style={{ fontSize: "14px", fontWeight: 600, color: "#ffffff" }}>Notification email</p>
                {editingEmail ? (
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="email"
                      value={emailDraft}
                      onChange={(e) => setEmailDraft(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") saveEmail(); if (e.key === "Escape") setEditingEmail(false); }}
                      autoFocus
                      placeholder="you@example.com"
                      className="flex-1 px-3 py-2 rounded-lg outline-none"
                      style={{
                        background: "#0a0a0a",
                        border: "1px solid #27272a",
                        color: "#ffffff",
                        fontSize: "13px",
                      }}
                    />
                    <button
                      onClick={saveEmail}
                      className="px-3 py-2 rounded-lg font-semibold"
                      style={{ background: "#cc1111", color: "#fff", fontSize: "12px" }}
                    >
                      <Check size={14} />
                    </button>
                    <button
                      onClick={() => setEditingEmail(false)}
                      className="px-3 py-2 rounded-lg"
                      style={{ border: "1px solid #27272a", color: "#a1a1aa", fontSize: "12px" }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <p className="mt-0.5 flex items-center gap-1.5" style={{ fontSize: "13px", color: "#a1a1aa" }}>
                    <Mail size={12} />
                    <span className="truncate">{notifyEmail || user?.email || "—"}</span>
                  </p>
                )}
              </div>
              {!editingEmail && (
                <button
                  type="button"
                  onClick={startEditEmail}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors"
                  style={{ border: "1px solid #27272a", color: "#a1a1aa", fontSize: "12px" }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = "#3f3f46"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "#a1a1aa"; e.currentTarget.style.borderColor = "#27272a"; }}
                >
                  <Pencil size={12} /> Edit
                </button>
              )}
            </div>

            {/* Frequency */}
            <div className="py-4 border-t" style={{ borderColor: "#1f1f1f" }}>
              <p style={{ fontSize: "14px", fontWeight: 600, color: "#ffffff" }}>Alert frequency</p>
              <p className="mt-0.5 mb-3" style={{ fontSize: "12px", color: "#71717a" }}>
                How often should we group your alerts?
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {([
                  { v: "immediate", label: "Immediately", desc: "As soon as price drops" },
                  { v: "daily", label: "Daily digest", desc: "One email per day" },
                  { v: "weekly", label: "Weekly digest", desc: "Once a week summary" },
                ] as { v: AlertFrequency; label: string; desc: string }[]).map((opt) => {
                  const active = frequency === opt.v;
                  return (
                    <button
                      key={opt.v}
                      type="button"
                      onClick={() => persistFrequency(opt.v)}
                      className="text-left p-3 rounded-xl transition-colors"
                      style={{
                        background: active ? "rgba(204,17,17,0.08)" : "#0a0a0a",
                        border: `1px solid ${active ? "#cc1111" : "#1f1f1f"}`,
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-flex items-center justify-center"
                          style={{
                            width: "16px",
                            height: "16px",
                            borderRadius: "999px",
                            border: `2px solid ${active ? "#cc1111" : "#3f3f46"}`,
                            background: active ? "#cc1111" : "transparent",
                          }}
                        >
                          {active && (
                            <span
                              style={{
                                width: "6px",
                                height: "6px",
                                background: "#fff",
                                borderRadius: "999px",
                              }}
                            />
                          )}
                        </span>
                        <span style={{ fontSize: "13px", fontWeight: 600, color: "#ffffff" }}>{opt.label}</span>
                      </div>
                      <p className="mt-1.5" style={{ fontSize: "11px", color: "#71717a" }}>{opt.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <p className="mt-4" style={{ fontSize: "11px", color: "#52525b" }}>
              🔔 Prices are checked every 6 hours. Suppression and email delivery are managed automatically.
            </p>
          </section>
        </div>
      </main>

      <Footer />

      {/* Delete confirm */}
      <AlertDialog open={!!confirmDeleteId} onOpenChange={(o) => !o && setConfirmDeleteId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this price alert?</AlertDialogTitle>
            <AlertDialogDescription>You won't receive further notifications for this part. This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => confirmDeleteId && deleteAlert(confirmDeleteId)}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// ── Empty state ──
const EmptyAlertsState = ({ onBrowse }: { onBrowse: () => void }) => (
  <div
    className="rounded-2xl text-center py-16 px-6"
    style={{ background: "#111111", border: "1px solid #1f1f1f" }}
  >
    <Bell size={60} style={{ color: "#3f3f46", margin: "0 auto" }} strokeWidth={1.4} />
    <h2 className="mt-5" style={{ fontSize: "20px", fontWeight: 700, color: "#ffffff" }}>
      No price alerts yet
    </h2>
    <p className="mt-2 mx-auto" style={{ fontSize: "14px", color: "#a1a1aa", maxWidth: "420px" }}>
      Search for a part and click the bell icon to set a target price.
    </p>
    <button
      type="button"
      onClick={onBrowse}
      className="inline-flex items-center gap-2 mt-6 px-5 py-3 rounded-xl font-semibold transition-colors"
      style={{ background: "#cc1111", color: "#fff", fontSize: "14px" }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "#b30f0f"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "#cc1111"; }}
    >
      <Search size={16} /> Browse Parts →
    </button>
  </div>
);

// ── Alert card ──
const AlertCard = ({ alert, onRemove, isElite, isPro }: { alert: PriceAlert; onRemove: () => void; isElite: boolean; isPro: boolean }) => {
  const target = Number(alert.target_price);
  const current = alert.current_price != null ? Number(alert.current_price) : null;

  const targetHit = current != null && current <= target;
  const sent = alert.triggered && !!alert.triggered_at;

  // Progress: 0 = far away (current >> target), 100 = target reached or better
  // We anchor "starting point" at 1.5x target for a visual scale.
  const progress = (() => {
    if (current == null) return 0;
    if (current <= target) return 100;
    const start = target * 1.5; // anchor
    if (current >= start) return 5; // small floor so bar is visible
    const ratio = (start - current) / (start - target);
    return Math.max(5, Math.min(95, Math.round(ratio * 100)));
  })();

  const away = current != null && !targetHit ? Math.max(0, current - target) : 0;

  const status: { label: string; bg: string; color: string; pulse?: boolean } = sent
    ? { label: "Alert sent", bg: "rgba(59,130,246,0.12)", color: "#60a5fa" }
    : targetHit
      ? { label: "Price dropped!", bg: "rgba(74,222,128,0.12)", color: "#4ade80", pulse: true }
      : { label: "Watching", bg: "#1a1a1a", color: "#a1a1aa" };

  return (
    <div
      className="relative rounded-2xl p-4 sm:p-5 transition-colors"
      style={{ background: "#111111", border: "1px solid #1f1f1f" }}
    >
      {/* Remove */}
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove alert"
        className="absolute top-3 right-3 inline-flex items-center justify-center transition-colors"
        style={{
          width: "28px",
          height: "28px",
          borderRadius: "8px",
          color: "#52525b",
          background: "transparent",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = "#ffffff"; e.currentTarget.style.background = "#1f1f1f"; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = "#52525b"; e.currentTarget.style.background = "transparent"; }}
      >
        <X size={16} />
      </button>

      <div className="flex items-start gap-4 pr-8">
        {/* Thumb */}
        <div
          className="flex-shrink-0 overflow-hidden flex items-center justify-center"
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "10px",
            background: "#0a0a0a",
            border: "1px solid #1f1f1f",
          }}
        >
          {alert.image_url ? (
            <img
              src={alert.image_url}
              alt={alert.part_name}
              loading="lazy"
              decoding="async"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
              className="w-full h-full object-contain p-1"
            />
          ) : (
            <Package size={18} style={{ color: "#3f3f46" }} />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 flex-wrap">
            <p
              className="truncate"
              style={{ fontSize: "16px", fontWeight: 600, color: "#ffffff", maxWidth: "100%" }}
              title={alert.part_name}
            >
              {alert.part_name}
            </p>
            <span
              className={status.pulse ? "animate-pulse" : ""}
              style={{
                background: status.bg,
                color: status.color,
                fontSize: "11px",
                fontWeight: 600,
                padding: "3px 8px",
                borderRadius: "999px",
                whiteSpace: "nowrap",
              }}
            >
              {status.label}
            </span>
          </div>

          <div className="mt-2 flex items-baseline gap-4 flex-wrap">
            <div>
              <p style={{ fontSize: "10px", color: "#52525b", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Your target
              </p>
              <p style={{ fontSize: "22px", fontWeight: 800, color: "#4ade80", lineHeight: 1.1 }}>
                £{target.toFixed(2)}
              </p>
            </div>
            <div>
              <p style={{ fontSize: "10px", color: "#52525b", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Current lowest
              </p>
              <p style={{ fontSize: "14px", color: targetHit ? "#4ade80" : "#a1a1aa", fontWeight: 600 }}>
                {current != null ? `£${current.toFixed(2)}` : "Checking…"}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-3">
            <div
              style={{
                height: "6px",
                width: "100%",
                background: "#1f1f1f",
                borderRadius: "999px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${progress}%`,
                  background: targetHit
                    ? "#4ade80"
                    : "linear-gradient(90deg, #27272a 0%, #4ade80 100%)",
                  transition: "width 600ms ease",
                }}
              />
            </div>
            <p className="mt-1.5" style={{ fontSize: "11px", color: targetHit ? "#4ade80" : "#71717a" }}>
              {current == null
                ? "Waiting for next price check…"
                : targetHit
                  ? "🎯 Target reached!"
                  : `£${away.toFixed(2)} away from your target`}
            </p>
          </div>

          {alert.url && (
            <a
              href={alert.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-3 transition-colors"
              style={{ fontSize: "12px", color: "#a1a1aa" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "#ffffff"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "#a1a1aa"; }}
            >
              View part ↗
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default Alerts;
