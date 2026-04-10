import { CheckCircle2 } from "lucide-react";

type Variant = "pro_seller" | "elite" | "admin";

const config: Record<Variant, { label: string; bg: string; border: string; text: string }> = {
  pro_seller: {
    label: "Verified Seller",
    bg: "bg-blue-500/15",
    border: "border-blue-500/30",
    text: "text-blue-400",
  },
  elite: {
    label: "Elite Verified",
    bg: "bg-gradient-to-r from-amber-500/20 to-orange-500/20",
    border: "border-amber-500/30",
    text: "text-amber-400",
  },
  admin: {
    label: "PARTARA Official",
    bg: "bg-gradient-to-r from-red-500/20 to-rose-500/20",
    border: "border-red-500/30",
    text: "text-red-400",
  },
};

interface Props {
  variant: Variant;
  size?: "sm" | "md";
}

const VerifiedSellerBadge = ({ variant, size = "md" }: Props) => {
  const c = config[variant];
  const iconSize = size === "sm" ? 10 : 12;
  const textSize = size === "sm" ? "text-[9px]" : "text-[11px]";
  const padding = size === "sm" ? "px-1.5 py-0.5" : "px-2.5 py-1";

  return (
    <span className={`inline-flex items-center gap-1 ${padding} rounded-full ${c.bg} border ${c.border} ${c.text} ${textSize} font-bold tracking-wide`}>
      <CheckCircle2 size={iconSize} />
      {c.label}
    </span>
  );
};

export default VerifiedSellerBadge;
