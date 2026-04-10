import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import PageLoader from "@/components/PageLoader";

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      const tokenHash = searchParams.get("token_hash");
      const type = searchParams.get("type");

      if (tokenHash && type) {
        // Verify the OTP token from the confirmation email link
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type as "signup" | "email" | "recovery" | "invite" | "magiclink" | "email_change",
        });

        if (error) {
          console.error("Verification error:", error);
          setError(error.message);
          return;
        }

        // Successfully verified — redirect to homepage
        navigate("/", { replace: true });
        return;
      }

      // Fallback: check if session already exists (e.g. tokens in hash fragment)
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/", { replace: true });
      } else {
        // No token params and no session — listen briefly for auth state change
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === "SIGNED_IN" && session) {
            subscription.unsubscribe();
            navigate("/", { replace: true });
          }
        });

        setTimeout(() => {
          subscription.unsubscribe();
          setError("Unable to verify your email. The link may have expired.");
        }, 5000);
      }
    };

    handleCallback();
  }, [navigate, searchParams]);

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center space-y-4">
          <span className="font-display text-3xl font-bold tracking-tight">
            <span className="text-primary">PART</span>
            <span className="text-foreground">ARA</span>
          </span>
          <h1 className="text-xl font-semibold text-foreground">Verification Failed</h1>
          <p className="text-muted-foreground text-sm">{error}</p>
          <button
            onClick={() => navigate("/auth")}
            className="text-primary hover:underline text-sm"
          >
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  return <PageLoader />;
};

export default AuthCallback;
