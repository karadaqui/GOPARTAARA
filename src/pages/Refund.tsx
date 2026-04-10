import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, AlertTriangle, CheckCircle, XCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Refund = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [eligibility, setEligibility] = useState<{
    eligible: boolean;
    days_remaining?: number;
    first_payment_date?: string;
    reason?: string;
    refund_date?: string;
  } | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) checkEligibility();
  }, [user]);

  const checkEligibility = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("check-refund-eligibility");
      if (!error && data) setEligibility(data);
    } catch {}
    setLoading(false);
  };

  const handleRequestRefund = async () => {
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("request-refund");
      if (error) throw error;
      if (data?.error) {
        toast({ title: "Refund failed", description: data.error, variant: "destructive" });
      } else {
        setSubmitted(true);
        toast({ title: "Refund requested!", description: "Your account has been downgraded. Refund will be processed within 5-10 business days." });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to process refund", variant: "destructive" });
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Request Refund | PARTARA" description="Request a refund for your PARTARA subscription." path="/refund" />
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container max-w-lg mx-auto px-4">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </button>

          <h1 className="font-display text-3xl font-bold mb-2">Request Refund</h1>
          <p className="text-muted-foreground mb-8">
            Refund requests must be submitted within 7 days of your initial subscription payment.
          </p>

          {(loading || authLoading) ? (
            <div className="glass rounded-2xl p-12 flex justify-center">
              <Loader2 className="animate-spin text-primary" size={32} />
            </div>
          ) : submitted ? (
            <div className="glass rounded-2xl p-8 text-center">
              <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
              <h2 className="font-display text-xl font-bold mb-2">Refund Request Submitted</h2>
              <p className="text-muted-foreground mb-4">
                Your account has been downgraded to the Free plan. Your refund will be processed within 5-10 business days.
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                A confirmation email has been sent to your email address.
              </p>
              <Button onClick={() => navigate("/dashboard")} className="rounded-xl">
                Go to Dashboard
              </Button>
            </div>
          ) : eligibility?.reason === "already_refunded" ? (
            <div className="glass rounded-2xl p-8 text-center">
              <XCircle size={48} className="text-destructive mx-auto mb-4" />
              <h2 className="font-display text-xl font-bold mb-2">Refund Already Granted</h2>
              <p className="text-muted-foreground mb-2">
                A refund was already processed for your account
                {eligibility.refund_date && (
                  <> on {new Date(eligibility.refund_date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</>
                )}.
              </p>
              <p className="text-sm text-muted-foreground mb-6">Each account is entitled to one refund only.</p>
              <Button variant="outline" onClick={() => navigate("/dashboard")} className="rounded-xl">
                Back to Dashboard
              </Button>
            </div>
          ) : eligibility?.reason === "no_paid_plan" ? (
            <div className="glass rounded-2xl p-8 text-center">
              <AlertTriangle size={48} className="text-amber-500 mx-auto mb-4" />
              <h2 className="font-display text-xl font-bold mb-2">No Paid Subscription</h2>
              <p className="text-muted-foreground mb-6">
                You don't currently have a paid subscription to refund.
              </p>
              <Button variant="outline" onClick={() => navigate("/dashboard")} className="rounded-xl">
                Back to Dashboard
              </Button>
            </div>
          ) : eligibility?.eligible ? (
            <div className="glass rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <Clock size={24} className="text-green-500" />
                </div>
                <div>
                  <h2 className="font-display text-lg font-bold">Eligible for Refund</h2>
                  <p className="text-sm text-muted-foreground">
                    {eligibility.days_remaining} day{eligibility.days_remaining !== 1 ? "s" : ""} remaining in refund window
                  </p>
                </div>
              </div>

              {eligibility.first_payment_date && (
                <p className="text-sm text-muted-foreground mb-4">
                  First payment: {new Date(eligibility.first_payment_date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              )}

              <div className="rounded-xl bg-destructive/5 border border-destructive/20 p-4 mb-6">
                <h3 className="text-sm font-semibold text-destructive mb-2 flex items-center gap-2">
                  <AlertTriangle size={14} /> Important
                </h3>
                <ul className="text-xs text-muted-foreground space-y-1.5">
                  <li>• Your account will be immediately downgraded to Free</li>
                  <li>• All paid features will be removed instantly</li>
                  <li>• Refund will be processed within 5-10 business days</li>
                  <li>• This is a one-time refund — you cannot request another</li>
                </ul>
              </div>

              <Button
                onClick={handleRequestRefund}
                disabled={submitting}
                variant="destructive"
                className="w-full rounded-xl gap-2"
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
                Confirm Refund Request
              </Button>
            </div>
          ) : eligibility?.reason === "window_expired" ? (
            <div className="glass rounded-2xl p-8 text-center">
              <XCircle size={48} className="text-destructive mx-auto mb-4" />
              <h2 className="font-display text-xl font-bold mb-2">Refund Window Expired</h2>
              <p className="text-muted-foreground mb-2">
                The 7-day refund window has passed.
              </p>
              {eligibility.first_payment_date && (
                <p className="text-sm text-muted-foreground mb-2">
                  Your first payment was on {new Date(eligibility.first_payment_date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}.
                </p>
              )}
              <p className="text-sm text-muted-foreground mb-6">
                You can still cancel your subscription to prevent future charges.
              </p>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={() => navigate("/dashboard")} className="rounded-xl">
                  Back to Dashboard
                </Button>
              </div>
            </div>
          ) : (
            <div className="glass rounded-2xl p-8 text-center">
              <AlertTriangle size={48} className="text-amber-500 mx-auto mb-4" />
              <h2 className="font-display text-xl font-bold mb-2">Unable to Check Eligibility</h2>
              <p className="text-muted-foreground mb-6">
                {eligibility?.reason || "Please try again later."}
              </p>
              <Button variant="outline" onClick={() => navigate("/dashboard")} className="rounded-xl">
                Back to Dashboard
              </Button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Refund;
