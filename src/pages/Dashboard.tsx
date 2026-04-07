import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Camera, Save, User, Mail, Crown, Clock, Bookmark, Loader2, Search, Trash2, X } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<Tables<"profiles"> | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchHistory, setSearchHistory] = useState<Tables<"search_history">[]>([]);
  const [savedPartsCount, setSavedPartsCount] = useState(0);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchSearchHistory();
      fetchSavedPartsCount();
    }
  }, [user]);

  const fetchProfile = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user!.id)
      .single();

    if (!error && data) {
      setProfile(data);
      setDisplayName(data.display_name || "");
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName })
      .eq("user_id", user.id);

    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Saved", description: "Profile updated successfully." });
      fetchProfile();
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Error", description: "Image must be under 2MB.", variant: "destructive" });
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      setUploading(false);
      toast({ title: "Error", description: uploadError.message, variant: "destructive" });
      return;
    }

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: `${urlData.publicUrl}?t=${Date.now()}` })
      .eq("user_id", user.id);

    setUploading(false);
    if (updateError) {
      toast({ title: "Error", description: updateError.message, variant: "destructive" });
    } else {
      toast({ title: "Saved", description: "Avatar updated." });
      fetchProfile();
    }
  };

  const planLabel: Record<string, string> = { free: "Free", pro: "Pro", business: "Business" };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

      <div className="container relative z-10 max-w-2xl py-12 px-4">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft size={16} />
          Back to home
        </button>

        <h1 className="font-display text-3xl font-bold mb-8">My Profile</h1>

        {/* Avatar */}
        <div className="glass rounded-2xl p-8 mb-6">
          <h2 className="font-display text-lg font-semibold mb-4">Avatar</h2>
          <div className="flex items-center gap-6">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full bg-secondary border-2 border-border overflow-hidden flex items-center justify-center">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User size={36} className="text-muted-foreground" />
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute inset-0 rounded-full bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                {uploading ? (
                  <Loader2 size={20} className="animate-spin text-foreground" />
                ) : (
                  <Camera size={20} className="text-foreground" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>
            <div>
              <p className="text-sm text-foreground font-medium">Upload a photo</p>
              <p className="text-xs text-muted-foreground mt-1">JPG, PNG or WebP. Max 2MB.</p>
            </div>
          </div>
        </div>

        {/* Profile info */}
        <div className="glass rounded-2xl p-8 mb-6">
          <h2 className="font-display text-lg font-semibold mb-4">Profile Information</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">Display Name</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="pl-10 bg-secondary border-border h-11 rounded-xl"
                  placeholder="Your display name"
                />
              </div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={user?.email || ""}
                  disabled
                  className="pl-10 bg-secondary/50 border-border h-11 rounded-xl opacity-60"
                />
              </div>
            </div>
            <Button onClick={handleSave} disabled={saving} className="rounded-xl gap-2">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Save Changes
            </Button>
          </div>
        </div>

        {/* Plan & stats */}
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="glass rounded-2xl p-6 text-center">
            <Crown size={20} className="text-primary mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Plan</p>
            <p className="font-display font-bold text-lg">{planLabel[profile?.subscription_plan || "free"]}</p>
          </div>
          <div className="glass rounded-2xl p-6 text-center">
            <Clock size={20} className="text-primary mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Member Since</p>
            <p className="font-display font-bold text-lg">
              {profile?.created_at ? new Date(profile.created_at).toLocaleDateString("en-GB", { month: "short", year: "numeric" }) : "—"}
            </p>
          </div>
          <div className="glass rounded-2xl p-6 text-center">
            <Bookmark size={20} className="text-primary mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Saved Parts</p>
            <p className="font-display font-bold text-lg">0</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
