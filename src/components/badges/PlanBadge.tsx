import { Gem, ShieldCheck, Crown, Store, Star, Award } from "lucide-react";

type Plan = "pro" | "elite" | "admin" | "basic_seller" | "featured_seller" | "pro_seller" | "free";

const config: Record<string, { label: string; bg: string; border: string; text: string; icon: any }> = {
  pro: { label: "Pro", bg: "bg-blue-500/15", border: "border-blue-500/30", text: "text-blue-400", icon: Crown },
  elite: { label: "Elite", bg: "bg-gradient-to-r from-amber-500/20 to-orange-500/20", border: "border-amber-500/30", text: "text-amber-400", icon: Gem },
  admin: { label: "Admin", bg: "bg-gradient-to-r from-red-500/20 to-rose-500/20", border: "border-red-500/30", text: "text-red-400", icon: ShieldCheck },
  basic_seller: { label: "Basic Seller", bg: "bg-slate-500/15", border: "border-slate-500/30", text: "text-slate-400", icon: Store },
  featured_seller: { label: "Featured Seller", bg: "bg-purple-500/15", border: "border-purple-500/30", text: "text-purple-400", icon: Star },
  pro_seller: { label: "Pro Seller", bg: "bg-blue-500/15", border: "border-blue-500/30", text: "text-blue-400", icon: Award },
};

interface Props {
  plan: string;
  size?: "sm" | "md";
}

const PlanBadge = ({ plan, size = "md" }: Props) => {
  const c = config[plan];
  if (!c) return null;

  const Icon = c.icon;
  const iconSize = size === "sm" ? 10 : 12;
  const textSize = size === "sm" ? "text-[9px]" : "text-[11px]";
  const padding = size === "sm" ? "px-1.5 py-0.5" : "px-2.5 py-1";

  return (
    <span className={`inline-flex items-center gap-1 ${padding} rounded-full ${c.bg} border ${c.border} ${c.text} ${textSize} font-bold tracking-wide uppercase`}>
      <Icon size={iconSize} />
      {c.label}
    </span>
  );
};

export default PlanBadge;
