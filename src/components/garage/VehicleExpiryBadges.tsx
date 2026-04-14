import { differenceInDays, parseISO, isValid } from "date-fns";

interface Props {
  motExpiryDate?: string | null;
  taxExpiryDate?: string | null;
}

const getExpiryStatus = (dateStr: string | null | undefined) => {
  if (!dateStr) return null;
  const date = parseISO(dateStr);
  if (!isValid(date)) return null;
  const days = differenceInDays(date, new Date());
  if (days < 0) return { label: "EXPIRED", days, variant: "expired" as const };
  if (days <= 30) return { label: `expires in ${days}d`, days, variant: "urgent" as const };
  if (days <= 60) return { label: `due in ${days}d`, days, variant: "warning" as const };
  return { label: `valid (${days}d)`, days, variant: "ok" as const };
};

const variantStyles = {
  expired: "bg-destructive/15 text-destructive border-destructive/30",
  urgent: "bg-destructive/10 text-destructive border-destructive/20",
  warning: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30",
  ok: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30",
};

const icons = { expired: "❌", urgent: "🚨", warning: "⚠️", ok: "✅" };

const VehicleExpiryBadges = ({ motExpiryDate, taxExpiryDate }: Props) => {
  const mot = getExpiryStatus(motExpiryDate);
  const tax = getExpiryStatus(taxExpiryDate);

  if (!mot && !tax) return null;

  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {mot && (
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${variantStyles[mot.variant]}`}>
          {icons[mot.variant]} MOT {mot.label}
        </span>
      )}
      {tax && (
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${variantStyles[tax.variant]}`}>
          {icons[tax.variant]} Tax {tax.label}
        </span>
      )}
    </div>
  );
};

export default VehicleExpiryBadges;
export { getExpiryStatus };
