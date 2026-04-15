import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const CompleteProfile = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (!user) {
    navigate("/auth");
    return null;
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = displayName.trim();
    if (!trimmed) {
      toast({ title: "Required", description: "Please enter a display name.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      // Update via Supabase auth metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: { full_name: trimmed, display_name: trimmed },
      });
      if (authError) throw authError;

      // Also update profiles table via REST with localStorage token
      const storageKey = `sb-${import.meta.env.VITE_SUPABASE_PROJECT_ID}-auth-token`;
      const raw = localStorage.getItem(storageKey);
      const sessionData = JSON.parse(raw || "{}");
      const accessToken = sessionData?.access_token;

      if (accessToken) {
        await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/profiles?user_id=eq.${user.id}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${accessToken}`,
              "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
              "Prefer": "return=minimal",
            },
            body: JSON.stringify({ display_name: trimmed }),
          }
        );
      }

      toast({ title: "Welcome!", description: "Your profile is all set." });
      setTimeout(() => {
        navigate("/");
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      console.error("updateDisplayName error:", err);
      toast({ title: "Error", description: err.message || "Failed to update display name.", variant: "destructive" });
    }
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        <div className="glass rounded-2xl p-8 glow-red">
          <div className="text-center mb-8">
            <a href="/" className="font-display text-2xl font-bold tracking-tight inline-block mb-2">
              <span className="text-primary">PART</span>
              <span className="text-foreground">ARA</span>
            </a>
            <h1 className="font-display text-xl font-semibold">Complete your profile</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Choose a display name to get started. This is how other users will see you.
            </p>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">Display Name *</label>
              <div className="relative">
                <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="e.g. John, CarGuy99, JDM_Lover"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  autoFocus
                  className="pl-10 bg-secondary border-border h-12 rounded-xl"
                />
              </div>
            </div>

            <Button type="submit" disabled={saving || !displayName.trim()} className="w-full h-12 rounded-xl text-sm font-semibold">
              {saving ? (
                <span className="flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  Saving...
                </span>
              ) : (
                "Continue →"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CompleteProfile;
