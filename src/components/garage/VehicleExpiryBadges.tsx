import { differenceInDays, parseISO, isValid } from "date-fns";

interface Props {
  motExpiryDate?: string | null;
  taxExpiryDate?: string | null;
}

export type ExpiryVariant = "expired" | "urgent" | "warning" | "ok" | "missing";
export interface ExpiryStatus {
  label: string;
  days: number | null;
  variant: ExpiryVariant;
}

const getExpiryStatus = (dateStr: string | null | undefined): ExpiryStatus => {
  if (!dateStr) return { label: "not set", days: null, variant: "missing" };
  const date = parseISO(dateStr);
  if (!isValid(date)) return { label: "not set", days: null, variant: "missing" };
  const days = differenceInDays(date, new Date());
  if (days < 0) return { label: `expired ${Math.abs(days)}d ago`, days, variant: "expired" };
  if (days <= 30) return { label: `due in ${days} day${days === 1 ? "" : "s"}`, days, variant: "urgent" };
  if (days <= 60) return { label: `due in ${days} days`, days, variant: "warning" };
  return { label: "valid", days, variant: "ok" };
};

const variantStyles: Record<ExpiryVariant, string> = {
  expired: "bg-destructive/20 text-destructive border-destructive/40",
  urgent: "bg-destructive/15 text-destructive border-destructive/30",
  warning: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
  ok: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30",
  missing: "bg-muted text-muted-foreground border-border",
};

const icons: Record<ExpiryVariant, string> = {
  expired: "❌",
  urgent: "⚠️",
  warning: "🔔",
  ok: "✅",
  missing: "📅",
};

const formatBadge = (kind: "MOT" | "Tax", status: ExpiryStatus) => {
  if (status.variant === "missing") return `Set ${kind} date`;
  if (status.variant === "ok") return `${kind} valid`;
  if (status.variant === "expired") return `${kind} ${status.label}`;
  return `${kind} ${status.label}`;
};

const VehicleExpiryBadges = ({ motExpiryDate, taxExpiryDate }: Props) => {
  const mot = getExpiryStatus(motExpiryDate);
  const tax = getExpiryStatus(taxExpiryDate);

  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${variantStyles[mot.variant]}`}>
        {icons[mot.variant]} {formatBadge("MOT", mot)}
      </span>
      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${variantStyles[tax.variant]}`}>
        {icons[tax.variant]} {formatBadge("Tax", tax)}
      </span>
    </div>
  );
};

export default VehicleExpiryBadges;
export { getExpiryStatus };
