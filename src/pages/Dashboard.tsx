import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Camera, Save, User, Mail, Crown, Clock, Bookmark, Loader2, Search, X, ExternalLink, CreditCard, Download, Lock } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import ReferralSection from "@/components/dashboard/ReferralSection";
import BlogGenerateSection from "@/components/dashboard/BlogGenerateSection";
import PriceAlertsSection from "@/components/dashboard/PriceAlertsSection";
import MyGarageSection from "@/components/dashboard/MyGarageSection";
import PlanBadge from "@/components/badges/PlanBadge";
import EliteFeatureGate from "@/components/dashboard/BusinessFeatureGate";
import PrioritySupportButton from "@/components/dashboard/PrioritySupportButton";
import ComingSoonFeatures from "@/components/dashboard/ComingSoonFeatures";

// SubStatus type

type SubStatus = {
  subscribed: boolean;
  product_id?: string | null;
  subscription_end?: string | null;
  billing_amount?: number | null;
  billing_currency?: string | null;
  payment_method_last4?: string | null;
  payment_method_brand?: string | null;
};

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<Tables<"profiles"> | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [avatarSignedUrl, setAvatarSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchHistory, setSearchHistory] = useState<Tables<"search_history">[]>([]);
  const [savedPartsCount, setSavedPartsCount] = useState(0);
  const [subStatus, setSubStatus] = useState<SubStatus>({ subscribed: false });
  const [subLoading, setSubLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // Refresh subscription if arriving at dashboard
  useEffect(() => {
    if (user) fetchSubscription();
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchSearchHistory();
      fetchSavedPartsCount();
      fetchSubscription();
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
      // Use display_name if set, otherwise derive from email
      const friendlyName = data.display_name || (data.email ? data.email.split("@")[0] : (user?.email ? user.email.split("@")[0] : ""));
      setDisplayName(friendlyName);
      if (data.avatar_url) {
        const { data: signedData } = await supabase.storage
          .from("avatars")
          .createSignedUrl(data.avatar_url, 3600);
        setAvatarSignedUrl(signedData?.signedUrl || null);
      } else {
        setAvatarSignedUrl(null);
      }
    }
    setLoading(false);
  };

  const fetchSearchHistory = async () => {
    try {
      const { data } = await supabase
        .from("search_history")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(10);
      if (data) setSearchHistory(data);
    } catch (e) {
      // Silently ignore search_history errors
    }
  };

  const fetchSavedPartsCount = async () => {
    const { count } = await supabase
      .from("saved_parts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user!.id);
    setSavedPartsCount(count || 0);
  };

  const deleteHistoryItem = async (id: string) => {
    try {
      const { error } = await supabase.from("search_history").delete().eq("id", id);
      if (!error) setSearchHistory((prev) => prev.filter((h) => h.id !== id));
    } catch { /* silently ignore */ }
  };

  const clearAllHistory = async () => {
    try {
      const { error } = await supabase.from("search_history").delete().eq("user_id", user!.id);
      if (!error) setSearchHistory([]);
    } catch { /* silently ignore */ }
  };

  const fetchSubscription = async () => {
    setSubLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (!error && data) setSubStatus(data);
    } catch {
      // silently fail
    } finally {
      setSubLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to open portal", variant: "destructive" });
    } finally {
      setPortalLoading(false);
    }
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

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: path })
      .eq("user_id", user.id);

    setUploading(false);
    if (updateError) {
      toast({ title: "Error", description: updateError.message, variant: "destructive" });
    } else {
      toast({ title: "Saved", description: "Avatar updated." });
      fetchProfile();
    }
  };

  const PLAN_INFO: Record<string, { label: string; price: string }> = {
    free: { label: "Free", price: "£0/mo" },
    pro: { label: "Pro", price: "£9.99/mo" },
    elite: { label: "Elite", price: "£19.99/mo" },
    basic_seller: { label: "Basic Seller", price: "£9.99/mo" },
    featured_seller: { label: "Featured Seller", price: "£24.99/mo" },
    pro_seller: { label: "Pro Seller", price: "£49.99/mo" },
    admin: { label: "Admin", price: "Manually Assigned" },
  };
  const currentPlan = profile?.subscription_plan || "free";
  const currentPlanInfo = PLAN_INFO[currentPlan] || PLAN_INFO.free;
  const isEliteUser = ["elite", "admin"].includes(currentPlan);

  const exportSearchHistoryCSV = async () => {
    const { data } = await supabase
      .from("search_history")
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false });
    if (!data || data.length === 0) return;
    const csv = "Date,Search Query,Results Count\n" + data.map((r) =>
      `"${new Date(r.created_at).toLocaleDateString("en-GB")}","${r.query.replace(/"/g, '""')}","N/A"`
    ).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `partara-search-history-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

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

      <div className="container relative z-10 max-w-2xl pt-24 pb-12 px-4">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft size={16} />
          Back to home
        </button>

        <div className="flex items-center gap-3 mb-8">
          <h1 className="font-display text-3xl font-bold">My Profile</h1>
          <div className="flex items-center gap-2">
            {currentPlan !== "free" && <PlanBadge plan={currentPlan} />}
          </div>
        </div>

        {/* Avatar */}
        <div className="glass rounded-2xl p-8 mb-6">
          <h2 className="font-display text-lg font-semibold mb-4">Avatar</h2>
          <div className="flex items-center gap-6">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full bg-secondary border-2 border-border overflow-hidden flex items-center justify-center">
                {avatarSignedUrl ? (
                  <img src={avatarSignedUrl} alt="Avatar" className="w-full h-full object-cover" />
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

        {/* Subscription Management */}
        <div className="glass rounded-2xl p-8 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold flex items-center gap-2">
              <CreditCard size={18} className="text-primary" />
              Subscription
            </h2>
          </div>

          {subLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 size={20} className="animate-spin text-muted-foreground" />
            </div>
          ) : currentPlan === "admin" ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Crown size={20} className="text-primary" />
                </div>
                <div>
                  <p className="font-display font-bold text-lg">Admin Plan</p>
                  <p className="text-xs text-muted-foreground">Manually Assigned</p>
                </div>
              </div>
              <div className="rounded-xl bg-secondary/40 border border-border p-4 text-sm">
                <p className="text-muted-foreground">This plan is manually assigned and has no billing information.</p>
              </div>
            </div>
          ) : currentPlan !== "free" ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Crown size={20} className="text-primary" />
                </div>
                <div>
                  <p className="font-display font-bold text-lg">
                    {currentPlanInfo.label} Plan
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {currentPlanInfo.price}
                  </p>
                </div>
              </div>

              {/* Billing details */}
              <div className="rounded-xl bg-secondary/40 border border-border p-4 space-y-2 text-sm">
                {subStatus.subscription_end && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Next payment</span>
                      <span className="font-medium">{new Date(subStatus.subscription_end).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Amount due</span>
                      <span className="font-medium">
                        {subStatus.billing_amount
                          ? `£${(subStatus.billing_amount / 100).toFixed(2)}`
                          : currentPlanInfo.price.replace("/mo", "")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Days remaining</span>
                      <span className="font-medium">
                        {Math.max(0, Math.ceil((new Date(subStatus.subscription_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} days
                      </span>
                    </div>
                  </>
                )}
                {subStatus.payment_method_last4 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Payment method</span>
                    <span className="font-medium capitalize">{subStatus.payment_method_brand || "Card"} •••• {subStatus.payment_method_last4}</span>
                  </div>
                )}
                {/* Refund eligibility */}
                {profile?.first_payment_date && (() => {
                  const daysSince = (Date.now() - new Date(profile.first_payment_date!).getTime()) / (1000 * 60 * 60 * 24);
                  const refundDeadline = new Date(new Date(profile.first_payment_date!).getTime() + 7 * 24 * 60 * 60 * 1000);
                  if (profile.refund_granted) {
                    return <p className="text-xs text-muted-foreground">Refund granted on {profile.refund_date ? new Date(profile.refund_date).toLocaleDateString("en-GB") : "—"}</p>;
                  }
                  return daysSince <= 7
                    ? <p className="text-xs text-green-500">Refund available until {refundDeadline.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>
                    : <p className="text-xs text-destructive">Refund period ended</p>;
                })()}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl gap-2"
                  onClick={handleManageSubscription}
                  disabled={portalLoading}
                >
                  {portalLoading ? <Loader2 size={14} className="animate-spin" /> : <ExternalLink size={14} />}
                  Manage Subscription
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl gap-2 text-destructive border-destructive/30 hover:bg-destructive/10"
                  onClick={handleManageSubscription}
                  disabled={portalLoading}
                >
                  Cancel Subscription
                </Button>
                {profile?.first_payment_date && !profile.refund_granted && (() => {
                  const daysSince = (Date.now() - new Date(profile.first_payment_date!).getTime()) / (1000 * 60 * 60 * 24);
                  return daysSince <= 7;
                })() && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl gap-2"
                    onClick={() => navigate("/refund")}
                  >
                    Request Refund
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl gap-2"
                  onClick={() => navigate("/subscription-policy")}
                >
                  Subscription Policy
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                  <Crown size={20} className="text-muted-foreground" />
                </div>
                <div>
                  <p className="font-display font-bold text-lg">Free Plan</p>
                  <p className="text-xs text-muted-foreground">£0/mo · 5 searches per month</p>
                </div>
              </div>
              <Button
                size="sm"
                className="rounded-xl gap-2"
                onClick={() => navigate("/pricing")}
              >
                Upgrade Plan
              </Button>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="glass rounded-2xl p-6 text-center">
            <Crown size={20} className="text-primary mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Plan</p>
            <p className="font-display font-bold text-lg">
              {currentPlanInfo.label}
            </p>
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
            <p className="font-display font-bold text-lg">{savedPartsCount}</p>
          </div>
        </div>

        {/* Referral Program */}
        {profile && (
          <div className="mt-6">
            <ReferralSection
              userId={user!.id}
              referralCode={(profile as any).referral_code || null}
              bonusSearches={(profile as any).bonus_searches || 0}
            />
          </div>
        )}

        {/* My Garage */}
        {user && (
          <div className="mt-6">
            <MyGarageSection
              userId={user.id}
              isPro={["pro", "elite", "admin"].includes(currentPlan)}
              isBusinessUser={isEliteUser}
            />
          </div>
        )}

        {/* Price Alerts */}
        {user && (
          <div className="mt-6">
            <PriceAlertsSection userId={user.id} />
          </div>
        )}

        {/* Blog Generator */}
        <div className="mt-6">
          <BlogGenerateSection />
        </div>

        {/* Search History */}
        <div className="glass rounded-2xl p-8 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold flex items-center gap-2">
              <Search size={18} className="text-primary" />
              Recent Searches
            </h2>
            <div className="flex items-center gap-2">
              {isEliteUser ? (
                <button
                  onClick={exportSearchHistoryCSV}
                  title="Export search history as CSV"
                  className="w-7 h-7 rounded-lg border border-border bg-secondary hover:bg-secondary/80 flex items-center justify-center transition-colors text-primary"
                >
                  <Download size={14} />
                </button>
              ) : (
                <button
                  onClick={() => navigate("/pricing")}
                  title="Export search history (Elite plan)"
                  className="w-7 h-7 rounded-lg border border-border bg-secondary/50 flex items-center justify-center transition-colors text-muted-foreground hover:text-foreground relative"
                >
                  <Download size={14} />
                  <Lock size={8} className="absolute -top-1 -right-1 text-muted-foreground" />
                </button>
              )}
              {searchHistory.length > 0 && (
                <button
                  onClick={clearAllHistory}
                  className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>
          {searchHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No searches yet. Try searching for a car part!
            </p>
          ) : (
            <div className="space-y-2">
              {searchHistory.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/50 transition-colors group"
                >
                  <Search size={14} className="text-muted-foreground shrink-0" />
                  <button
                    onClick={() => navigate(`/search?q=${encodeURIComponent(item.query)}`)}
                    className="flex-1 text-left text-sm font-medium hover:text-primary transition-colors truncate"
                  >
                    {item.query}
                  </button>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {new Date(item.created_at).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                  <button
                    onClick={() => deleteHistoryItem(item.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Priority Support — Elite only */}
        <div className="mt-6">
          <EliteFeatureGate isBusinessUser={isEliteUser} label="Elite plan feature">
            <div className="glass rounded-2xl p-6 flex items-center justify-between">
              <div>
                <p className="font-display font-semibold text-sm">Priority Email Support</p>
                <p className="text-xs text-muted-foreground">Get faster responses from our team.</p>
              </div>
              <PrioritySupportButton displayName={displayName || user?.email || ""} />
            </div>
          </EliteFeatureGate>
        </div>

        {/* Coming Soon — Elite only */}
        {isEliteUser && (
          <div className="mt-6">
            <ComingSoonFeatures />
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
