import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserPlan } from "@/hooks/useUserPlan";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Loader2 } from "lucide-react";

const FreeTrialBanner = () => {
  const { user } = useAuth();
  const { isFree, loading } = useUserPlan();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activating, setActivating] = useState(false);

  if (loading) return null;
  if (user && !isFree) return null;

  const handleClick = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    setActivating(true);
    try {
      const { data, error } = await supabase.functions.invoke("activate-trial", {
        body: {},
      });
      if (error || data?.error) {
        const msg = data?.error || error?.message || "Something went wrong";
        toast({ title: msg, variant: "destructive" });
      } else {
        toast({ title: "🎉 1 month Pro activated!", description: "Enjoy PARTARA Pro free for 30 days." });
        setTimeout(() => window.location.reload(), 1000);
      }
    } catch {
      toast({ title: "Connection error. Please try again.", variant: "destructive" });
    }
    setActivating(false);
  };

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
          onClick={handleClick}
          disabled={activating}
          className="rounded-xl px-6 whitespace-nowrap min-h-[48px]"
        >
          {activating ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
          Claim Free Month →
        </Button>
      </div>
    </div>
  );
};

export default FreeTrialBanner;
