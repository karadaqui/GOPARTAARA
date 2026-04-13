import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { wasUpgradeShownRecently, markUpgradeShown } from "@/hooks/useUserPlan";
import { useEffect, useState } from "react";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Which feature triggered this modal — used for 24h throttle */
  feature: string;
  /** Human-readable feature name */
  featureLabel?: string;
  /** Minimum plan needed */
  requiredPlan?: string;
}

const UpgradeModal = ({
  open,
  onOpenChange,
  feature,
  featureLabel,
  requiredPlan = "Pro",
}: UpgradeModalProps) => {
  const navigate = useNavigate();
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    if (open) {
      if (wasUpgradeShownRecently(feature)) {
        onOpenChange(false);
        return;
      }
      markUpgradeShown(feature);
      setShouldShow(true);
    } else {
      setShouldShow(false);
    }
  }, [open, feature, onOpenChange]);

  return (
    <Dialog open={shouldShow} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <Sparkles size={20} className="text-primary" />
            Upgrade Required
          </DialogTitle>
          <DialogDescription>
            {featureLabel
              ? `${featureLabel} requires the ${requiredPlan} plan. Upgrade now to unlock it.`
              : `This feature requires the ${requiredPlan} plan. Upgrade now to unlock it.`}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 mt-4">
          <Button
            onClick={() => {
              onOpenChange(false);
              navigate("/pricing");
            }}
            className="gap-2 rounded-xl"
          >
            <Sparkles size={16} />
            {requiredPlan === "Elite"
              ? "Upgrade to Elite — £19.99/mo"
              : "Upgrade to Pro — £9.99/mo"}
          </Button>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="rounded-xl"
          >
            Maybe Later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UpgradeModal;
