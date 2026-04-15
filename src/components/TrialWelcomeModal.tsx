import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PartyPopper, Sparkles } from "lucide-react";

const TrialWelcomeModal = () => {
  const [open, setOpen] = useState(false);
  const [trialEndsAt, setTrialEndsAt] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const shown = sessionStorage.getItem("partara_trial_welcome_shown");
    if (shown) return;

    const trialDate = localStorage.getItem("partara_trial_welcome");
    if (trialDate) {
      setTrialEndsAt(trialDate);
      setOpen(true);
      localStorage.removeItem("partara_trial_welcome");
      sessionStorage.setItem("partara_trial_welcome_shown", "1");
    }
  }, []);

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString("en-GB", {
        day: "numeric", month: "long", year: "numeric",
      });
    } catch { return iso; }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md p-0 gap-0 border-primary/20">
        <div className="bg-gradient-to-br from-primary/20 via-primary/10 to-transparent p-8 text-center">
          <PartyPopper className="mx-auto text-primary mb-3" size={40} />
          <h2 className="font-display text-2xl font-bold">
            Welcome to PARTARA! 🎉
          </h2>
          <p className="text-muted-foreground text-sm mt-1">Your Pro trial is active</p>
        </div>

        <div className="p-6 space-y-5">
          <p className="text-sm text-muted-foreground text-center">
            Your first month Pro is completely free — no credit card needed. Enjoy unlimited searches, price alerts, photo search and more.
          </p>

          <div className="rounded-xl bg-secondary/60 border border-border p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Sparkles size={16} className="text-primary" />
              <span className="text-sm font-semibold">Pro trial active until</span>
            </div>
            <p className="text-lg font-bold text-primary">{formatDate(trialEndsAt)}</p>
          </div>

          <Button
            className="w-full rounded-xl min-h-[48px]"
            onClick={() => { setOpen(false); navigate("/"); }}
          >
            Start Exploring →
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TrialWelcomeModal;
