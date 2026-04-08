import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

type Status = "loading" | "valid" | "already" | "invalid" | "success" | "error";

const Unsubscribe = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<Status>("loading");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      return;
    }

    const validate = async () => {
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        const res = await fetch(
          `${supabaseUrl}/functions/v1/handle-email-unsubscribe?token=${token}`,
          { headers: { apikey: anonKey } }
        );
        const data = await res.json();
        if (res.ok && data.valid) {
          setStatus("valid");
        } else if (data.reason === "already_unsubscribed") {
          setStatus("already");
        } else {
          setStatus("invalid");
        }
      } catch {
        setStatus("invalid");
      }
    };

    validate();
  }, [token]);

  const handleUnsubscribe = async () => {
    if (!token) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("handle-email-unsubscribe", {
        body: { token },
      });
      if (error) throw error;
      setStatus(data?.success ? "success" : "error");
    } catch {
      setStatus("error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container px-4 max-w-lg mx-auto text-center">
          {status === "loading" && (
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
          )}

          {status === "valid" && (
            <>
              <h1 className="font-display text-3xl font-bold mb-4">Unsubscribe</h1>
              <p className="text-muted-foreground mb-8">
                Are you sure you want to unsubscribe from PARTARA emails?
              </p>
              <Button onClick={handleUnsubscribe} disabled={submitting} variant="destructive">
                {submitting ? "Processing…" : "Confirm Unsubscribe"}
              </Button>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle2 className="mx-auto h-12 w-12 text-green-500 mb-4" />
              <h1 className="font-display text-3xl font-bold mb-4">Unsubscribed</h1>
              <p className="text-muted-foreground">
                You've been unsubscribed and won't receive further emails from us.
              </p>
            </>
          )}

          {status === "already" && (
            <>
              <CheckCircle2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h1 className="font-display text-3xl font-bold mb-4">Already Unsubscribed</h1>
              <p className="text-muted-foreground">
                You've already unsubscribed from our emails.
              </p>
            </>
          )}

          {(status === "invalid" || status === "error") && (
            <>
              <XCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
              <h1 className="font-display text-3xl font-bold mb-4">
                {status === "invalid" ? "Invalid Link" : "Something Went Wrong"}
              </h1>
              <p className="text-muted-foreground">
                {status === "invalid"
                  ? "This unsubscribe link is invalid or has expired."
                  : "We couldn't process your request. Please try again later."}
              </p>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Unsubscribe;
