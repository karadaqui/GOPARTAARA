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

  useEffect(() => {
    const interval = setInterval(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email_confirmed_at) {
        clearInterval(interval);
        navigate("/", { replace: true });
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [navigate]);

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo: window.location.hostname === 'localhost' ? `${window.location.origin}/auth/callback` : 'https://gopartara.com/auth/callback' },
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
      <SEOHead title="Verify Your Email | PARTARA" description="Check your inbox to confirm your PARTARA account." path="/verify-email" />
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
          {/* PARTARA Logo */}
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

          <div className="bg-secondary/50 rounded-xl p-4 mb-6 text-left">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Click the link in your email to verify your account. Once verified, you'll be automatically signed in and redirected to PARTARA.
            </p>
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
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
