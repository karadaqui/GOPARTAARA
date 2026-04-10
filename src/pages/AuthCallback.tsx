import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import PageLoader from "@/components/PageLoader";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      // Supabase automatically detects tokens in the URL hash/query params
      // and exchanges them for a session. We just need to wait for it.
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error("Auth callback error:", error);
        navigate("/auth");
        return;
      }

      if (session) {
        // User is confirmed and signed in — go to homepage
        navigate("/", { replace: true });
      } else {
        // No session yet — try to exchange the token from the URL
        // The Supabase client may need a moment to process the hash
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === "SIGNED_IN" && session) {
            subscription.unsubscribe();
            navigate("/", { replace: true });
          }
        });

        // Timeout fallback — if nothing happens in 5s, redirect to auth
        setTimeout(() => {
          subscription.unsubscribe();
          navigate("/auth");
        }, 5000);
      }
    };

    handleCallback();
  }, [navigate]);

  return <PageLoader />;
};

export default AuthCallback;
