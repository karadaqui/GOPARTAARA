import { ShieldCheck } from "lucide-react";

const AdminBadge = () => (
  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-red-500/20 to-rose-500/20 border border-red-500/30 text-red-400 text-[11px] font-bold tracking-wide uppercase">
    <ShieldCheck size={12} />
    Admin
  </span>
);

export default AdminBadge;
