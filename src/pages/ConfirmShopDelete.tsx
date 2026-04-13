import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const ConfirmShopDelete = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [status, setStatus] = useState<"loading" | "valid" | "expired" | "used" | "error" | "confirming" | "done">("loading");
  const [deletionRequest, setDeletionRequest] = useState<any>(null);

  useEffect(() => {
    if (!token) { setStatus("error"); return; }
    verifyToken();
  }, [token]);

  const verifyToken = async () => {
    const { data, error } = await supabase
      .from("deletion_requests")
      .select("*")
      .eq("token", token!)
      .eq("type", "shop")
      .maybeSingle();

    if (error || !data) { setStatus("error"); return; }
    if (data.confirmed) { setStatus("used"); return; }
    if (new Date(data.expires_at) < new Date()) { setStatus("expired"); return; }

    setDeletionRequest(data);
    setStatus("valid");
  };

  const handleConfirmDelete = async () => {
    if (!token || !deletionRequest) return;
    setStatus("confirming");

    try {
      // Mark as confirmed via public RLS policy (token-based, no auth needed)
      const { error: updateError } = await supabase
        .from("deletion_requests")
        .update({ confirmed: true, confirmed_at: new Date().toISOString() })
        .eq("token", token)
        .eq("confirmed", false);

      if (updateError) {
        console.error("Failed to confirm deletion:", updateError);
        setStatus("error");
        return;
      }

      // The actual deletion of listings/profile will be handled by the user
      // when they are logged in, or by an edge function triggered by the confirmation.
      // For now, mark as done.
      setStatus("done");
      setTimeout(() => navigate("/"), 5000);
    } catch (err) {
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-lg py-24 px-4">
        <div className="glass rounded-2xl p-8 text-center">
          {status === "loading" && (
            <>
              <Loader2 size={48} className="animate-spin text-primary mx-auto mb-4" />
              <h1 className="font-display text-xl font-bold">Verifying your request...</h1>
            </>
          )}

          {status === "valid" && (
            <>
              <AlertTriangle size={48} className="text-destructive mx-auto mb-4" />
              <h1 className="font-display text-2xl font-bold mb-2">Delete Your Shop</h1>
              <p className="text-muted-foreground mb-6">
                This will permanently delete your seller profile and all associated listings.
                This is your last chance to change your mind.
              </p>
              <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 mb-6">
                <p className="text-sm text-destructive font-medium">
                  ⚠️ This action is permanent and cannot be undone.
                </p>
              </div>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={() => navigate("/")} className="rounded-xl">
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleConfirmDelete} className="rounded-xl gap-2">
                  Yes, Delete Everything
                </Button>
              </div>
            </>
          )}

          {status === "confirming" && (
            <>
              <Loader2 size={48} className="animate-spin text-destructive mx-auto mb-4" />
              <h1 className="font-display text-xl font-bold">Processing your request...</h1>
              <p className="text-muted-foreground mt-2">Please wait.</p>
            </>
          )}

          {status === "done" && (
            <>
              <CheckCircle size={48} className="text-emerald-500 mx-auto mb-4" />
              <h1 className="font-display text-2xl font-bold mb-2">Shop Deletion Confirmed</h1>
              <p className="text-muted-foreground">
                Your shop deletion has been confirmed. Your data will be removed shortly.
              </p>
              <p className="text-xs text-muted-foreground mt-4">Redirecting to homepage in 5 seconds...</p>
            </>
          )}

          {status === "expired" && (
            <>
              <XCircle size={48} className="text-muted-foreground mx-auto mb-4" />
              <h1 className="font-display text-xl font-bold mb-2">Link Expired</h1>
              <p className="text-muted-foreground">
                This confirmation link has expired. If you still want to delete your shop,
                please start the process again from your My Market page.
              </p>
              <Button onClick={() => navigate("/my-market")} className="mt-4 rounded-xl">
                Back to My Market
              </Button>
            </>
          )}

          {status === "used" && (
            <>
              <CheckCircle size={48} className="text-muted-foreground mx-auto mb-4" />
              <h1 className="font-display text-xl font-bold mb-2">Already Processed</h1>
              <p className="text-muted-foreground">This deletion request has already been processed.</p>
              <Button onClick={() => navigate("/")} className="mt-4 rounded-xl">
                Go Home
              </Button>
            </>
          )}

          {status === "error" && (
            <>
              <XCircle size={48} className="text-destructive mx-auto mb-4" />
              <h1 className="font-display text-xl font-bold mb-2">Invalid Link</h1>
              <p className="text-muted-foreground">This link is invalid or has already been used.</p>
              <Button onClick={() => navigate("/")} className="mt-4 rounded-xl">
                Go Home
              </Button>
            </>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ConfirmShopDelete;
