import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Mail, RefreshCw, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import SEOHead from "@/components/SEOHead";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || "";
  const navigate = useNavigate();
  const { toast } = useToast();
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    let redirected = false;
    const doRedirectHome = () => {
      if (!redirected) {
        redirected = true;
        navigate("/", { replace: true });
      }
    };
    const doRedirectAuth = () => {
      if (!redirected) {
        redirected = true;
        toast({ title: "Email verified!", description: "Please sign in to continue." });
        navigate("/auth", { replace: true });
      }
    };

    // Same-browser: fires instantly when another tab writes to localStorage
    const handleStorageChange = async (e: StorageEvent) => {
      if (e.key && e.key.includes("supabase") && e.newValue) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) doRedirectHome();
      }
    };
    window.addEventListener("storage", handleStorageChange);

    // onAuthStateChange as backup for same-browser
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) doRedirectHome();
    });

    // Cross-device polling: check backend every 3 seconds
    let pollInterval: ReturnType<typeof setInterval> | null = null;
    if (email) {
      pollInterval = setInterval(async () => {
        try {
          const { data, error } = await supabase.functions.invoke("check-email-verified", {
            body: { email },
          });
          if (!error && data?.verified) {
            doRedirectAuth();
          }
        } catch {
          // silently ignore polling errors
        }
      }, 3000);
    }

    // Show fallback button after 60 seconds
    const fallbackTimeout = setTimeout(() => setShowFallback(true), 60000);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      subscription.unsubscribe();
      if (pollInterval) clearInterval(pollInterval);
      clearTimeout(fallbackTimeout);
    };
  }, [navigate, email, toast]);

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo: window.location.hostname === 'localhost' ? window.location.origin : 'https://gopartara.com' },
      });
      if (error) throw error;
      setResent(true);
      toast({ title: "Email sent!", description: "Check your inbox for the confirmation link." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to resend email", variant: "destructive" });
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <SEOHead title="Verify Your Email | GOPARTARA" description="Check your inbox to confirm your GOPARTARA account." path="/verify-email" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        <button
          onClick={() => navigate("/auth")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft size={16} />
          Back to sign in
        </button>

        <div className="glass rounded-2xl p-8 glow-red text-center">
          {/* GOPARTARA Logo */}
          <div className="mb-6">
            <span className="font-display text-3xl font-bold tracking-tight">
              <span className="text-primary">PART</span>
              <span className="text-foreground">ARA</span>
            </span>
          </div>

          {/* Mail icon */}
          <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-6">
            <Mail size={28} className="text-primary" />
          </div>

          <h1 className="font-display text-2xl font-bold mb-2">Check your inbox!</h1>
          
          {email && (
            <p className="text-muted-foreground text-sm mb-4">
              We've sent a confirmation email to{" "}
              <span className="text-foreground font-medium">{email}</span>
            </p>
          )}

          <div className="bg-secondary/50 rounded-xl p-4 mb-4 text-left">
            <p className="text-sm text-foreground font-medium leading-relaxed mb-2">
              🎉 Welcome to GOPARTARA! Check your email for a confirmation link.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Click the link in your email to verify your account. Once verified, you'll be automatically redirected to sign in.
            </p>
          </div>

          {/* Trustpilot review nudge */}
          <div
            className="rounded-xl p-4 mb-6 text-left"
            style={{
              background: "rgba(0,182,122,0.06)",
              border: "1px solid rgba(0,182,122,0.25)",
            }}
          >
            <p className="text-sm text-foreground leading-relaxed mb-2">
              <span aria-hidden="true">⭐</span> We'd love your feedback! Once you've tried the search, please leave us a review on Trustpilot — it really helps us grow.
            </p>
            <a
              href="https://www.trustpilot.com/review/gopartara.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm font-semibold hover:underline"
              style={{ color: "#00b67a" }}
            >
              Leave a review →
            </a>
          </div>

          <p className="text-muted-foreground text-xs mb-4">
            Didn't receive the email? Check your spam folder or click below to resend.
          </p>

          <Button
            onClick={handleResend}
            disabled={resending || resent}
            variant="outline"
            className="w-full rounded-xl"
          >
            {resending ? (
              <span className="flex items-center gap-2">
                <RefreshCw size={16} className="animate-spin" />
                Sending...
              </span>
            ) : resent ? (
              "Email sent! Check your inbox"
            ) : (
              <span className="flex items-center gap-2">
                <RefreshCw size={16} />
                Resend confirmation email
              </span>
            )}
          </Button>

          {showFallback && (
            <button
              onClick={() => navigate("/auth")}
              className="mt-4 text-sm text-primary hover:underline"
            >
              Already verified? Continue to sign in →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
