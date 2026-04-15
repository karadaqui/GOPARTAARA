import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserPlan } from "@/hooks/useUserPlan";
import { Gift } from "lucide-react";
import { Button } from "@/components/ui/button";

const FreeTrialBanner = () => {
  const { user } = useAuth();
  const { isFree, loading } = useUserPlan();
  const navigate = useNavigate();

  // Show to non-logged-in users OR free plan users
  if (loading) return null;
  if (user && !isFree) return null;

  return (
    <div className="container px-4 mx-auto mt-6 mb-2">
      <div className="rounded-2xl border border-primary/20 bg-primary/5 backdrop-blur-sm p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <span className="text-3xl">🎁</span>
          <div>
            <p className="font-semibold text-foreground text-sm sm:text-base">
              First month Pro FREE — no credit card needed
            </p>
            <p className="text-muted-foreground text-xs sm:text-sm">
              Unlimited searches · Price alerts · Photo search · Ad-free
            </p>
          </div>
        </div>
        <Button
          onClick={() => navigate(user ? "/pricing" : "/auth")}
          className="rounded-xl px-6 whitespace-nowrap min-h-[48px]"
        >
          Claim Free Month →
        </Button>
      </div>
    </div>
  );
};

export default FreeTrialBanner;
