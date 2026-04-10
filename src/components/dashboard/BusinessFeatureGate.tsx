import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface BusinessFeatureGateProps {
  children: React.ReactNode;
  isBusinessUser: boolean;
  label?: string;
}

const BusinessFeatureGate = ({ children, isBusinessUser, label = "Business plan feature" }: BusinessFeatureGateProps) => {
  const navigate = useNavigate();

  if (isBusinessUser) return <>{children}</>;

  return (
    <div className="relative">
      <div className="opacity-40 pointer-events-none select-none blur-[1px]">
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/60 rounded-xl backdrop-blur-sm">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Lock size={14} />
          <span className="text-xs font-medium">{label}</span>
        </div>
        <Button size="sm" variant="outline" className="rounded-xl text-xs h-7 px-3" onClick={() => navigate("/pricing")}>
          Upgrade
        </Button>
      </div>
    </div>
  );
};

export default BusinessFeatureGate;
