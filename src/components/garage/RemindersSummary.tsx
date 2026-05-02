import { getExpiryStatus, type ExpiryVariant } from "./VehicleExpiryBadges";

interface VehicleLite {
  id: string;
  make?: string | null;
  model?: string | null;
  year?: number | null;
  registration?: string | null;
  mot_expiry_date?: string | null;
  tax_expiry_date?: string | null;
}

interface Props {
  vehicles: VehicleLite[];
}

type AlertItem = {
  vehicleId: string;
  vehicleLabel: string;
  kind: "MOT" | "Tax";
  variant: ExpiryVariant;
  text: string;
  days: number | null;
};

const variantOrder: Record<ExpiryVariant, number> = {
  expired: 0,
  urgent: 1,
  warning: 2,
  missing: 3,
  ok: 4,
};

const variantPillStyle: Record<ExpiryVariant, string> = {
  expired: "bg-destructive/20 text-destructive border-destructive/40",
  urgent: "bg-destructive/15 text-destructive border-destructive/30",
  warning: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
  missing: "bg-muted text-muted-foreground border-border",
  ok: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30",
};

const variantIcon: Record<ExpiryVariant, string> = {
  expired: "❌",
  urgent: "⚠️",
  warning: "🔔",
  missing: "📅",
  ok: "✅",
};

const RemindersSummary = ({ vehicles }: Props) => {
  if (!vehicles || vehicles.length === 0) return null;

  const alerts: AlertItem[] = [];
  for (const v of vehicles) {
    const label =
      [v.make, v.model, v.year].filter(Boolean).join(" ") ||
      v.registration ||
      "Vehicle";
    (["MOT", "Tax"] as const).forEach((kind) => {
      const dateStr = kind === "MOT" ? v.mot_expiry_date : v.tax_expiry_date;
      const status = getExpiryStatus(dateStr);
      // Only surface action-needed items in the summary
      if (status.variant === "ok") return;
      alerts.push({
        vehicleId: v.id,
        vehicleLabel: label,
        kind,
        variant: status.variant,
        text:
          status.variant === "missing"
            ? `${kind} date not set`
            : status.variant === "expired"
            ? `${kind} ${status.label}`
            : `${kind} ${status.label}`,
        days: status.days,
      });
    });
  }

  alerts.sort((a, b) => {
    const va = variantOrder[a.variant] - variantOrder[b.variant];
    if (va !== 0) return va;
    return (a.days ?? 9999) - (b.days ?? 9999);
  });

  const counts = {
    urgent: alerts.filter((a) => a.variant === "expired" || a.variant === "urgent").length,
    warning: alerts.filter((a) => a.variant === "warning").length,
    missing: alerts.filter((a) => a.variant === "missing").length,
  };

  const allClear = alerts.length === 0;

  return (
    <section
      aria-label="Vehicle reminders"
      className="mb-6 rounded-2xl border border-border bg-card p-4 sm:p-5"
    >
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span aria-hidden="true" className="text-lg">🔔</span>
          <h2 className="text-base font-bold text-foreground">Reminders</h2>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-semibold">
          {counts.urgent > 0 && (
            <span className={`px-2 py-0.5 rounded-full border ${variantPillStyle.urgent}`}>
              {counts.urgent} urgent
            </span>
          )}
          {counts.warning > 0 && (
            <span className={`px-2 py-0.5 rounded-full border ${variantPillStyle.warning}`}>
              {counts.warning} upcoming
            </span>
          )}
          {counts.missing > 0 && (
            <span className={`px-2 py-0.5 rounded-full border ${variantPillStyle.missing}`}>
              {counts.missing} missing
            </span>
          )}
        </div>
      </div>

      {allClear ? (
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <span aria-hidden="true">✅</span>
          All your vehicles are up to date — no MOT or Tax reminders right now.
        </p>
      ) : (
        <ul className="space-y-2">
          {alerts.map((a, i) => (
            <li
              key={`${a.vehicleId}-${a.kind}-${i}`}
              className="flex items-center justify-between gap-3 py-1.5 border-b border-border/60 last:border-b-0"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span aria-hidden="true" className="text-base">{variantIcon[a.variant]}</span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {a.vehicleLabel}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{a.text}</p>
                </div>
              </div>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap ${variantPillStyle[a.variant]}`}
              >
                {a.variant === "missing"
                  ? "Action needed"
                  : a.variant === "expired"
                  ? "Expired"
                  : a.variant === "urgent"
                  ? "≤ 30 days"
                  : "≤ 60 days"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default RemindersSummary;
