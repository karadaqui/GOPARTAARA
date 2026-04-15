import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useUserPlan } from "@/hooks/useUserPlan";
import {
  Camera, Save, User, Mail, Crown, Bookmark, Loader2,
  Search, X, ExternalLink, CreditCard, Download, Lock, Copy,
  Bell as BellIcon, ShoppingBag, Sparkles,
} from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import BlogGenerateSection from "@/components/dashboard/BlogGenerateSection";
import PriceAlertsSection from "@/components/dashboard/PriceAlertsSection";
import MyGarageSection from "@/components/dashboard/MyGarageSection";
import AnalyticsDashboard from "@/components/dashboard/AnalyticsDashboard";

import EliteFeatureGate from "@/components/dashboard/BusinessFeatureGate";
import PrioritySupportButton from "@/components/dashboard/PrioritySupportButton";
import ComingSoonFeatures from "@/components/dashboard/ComingSoonFeatures";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import RecentlyViewed from "@/components/RecentlyViewed";

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
  const [activeListingsCount, setActiveListingsCount] = useState(0);
  const [priceAlertsCount, setPriceAlertsCount] = useState(0);
  const [monthlySearchCount, setMonthlySearchCount] = useState(0);
  const [subStatus, setSubStatus] = useState<SubStatus>({ subscribed: false });
  const [subLoading, setSubLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchSearchHistory();
      fetchSavedPartsCount();
      fetchSubscription();
      fetchActiveListings();
      fetchPriceAlerts();
      fetchMonthlySearches();
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
    } catch { /* silently ignore */ }
  };

  const fetchSavedPartsCount = async () => {
    const { count } = await supabase
      .from("saved_parts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user!.id);
    setSavedPartsCount(count || 0);
  };

  const fetchActiveListings = async () => {
    try {
      const { data: sellerProfile } = await supabase
        .from("seller_profiles")
        .select("id")
        .eq("user_id", user!.id)
        .single();
      if (sellerProfile) {
        const { count } = await supabase
          .from("seller_listings")
          .select("*", { count: "exact", head: true })
          .eq("seller_id", sellerProfile.id)
          .eq("active", true);
        setActiveListingsCount(count || 0);
      }
    } catch { /* silently ignore */ }
  };

  const fetchPriceAlerts = async () => {
    try {
      const { count } = await supabase
        .from("price_alerts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .eq("active", true);
      setPriceAlertsCount(count || 0);
    } catch { /* silently ignore */ }
  };

  const fetchMonthlySearches = async () => {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const { count } = await supabase
        .from("search_history")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .gte("created_at", startOfMonth);
      setMonthlySearchCount(count || 0);
    } catch { /* silently ignore */ }
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
    } catch { /* silently fail */ } finally {
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
    const trimmed = displayName.trim();
    if (!trimmed && profile?.subscription_plan !== "admin") {
      toast({ title: "Required", description: "Please enter a display name.", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: trimmed })
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

  const exportSearchHistoryCSV = async () => {
    try {
      const { data } = await supabase
        .from("search_history")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (!data || data.length === 0) return;
      const csv = "Date,Search Query\n" + data.map((r) =>
        `"${new Date(r.created_at).toLocaleDateString("en-GB")}","${r.query.replace(/"/g, '""')}"`
      ).join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `partara-search-history-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { /* silently ignore */ }
  };

  const userPlan = useUserPlan();
  const currentPlan = userPlan.plan;
  const isAdmin = userPlan.isAdmin;
  const isEliteUser = userPlan.isElite;
  const isPro = userPlan.isPro;
  const isFree = userPlan.isFree;

  // For admin users, show full email; for regular users, require display_name
  const hasDisplayName = !!profile?.display_name?.trim();
  const needsDisplayName = !isAdmin && !hasDisplayName;

  const referralCode = (profile as any)?.referral_code || "";
  const referralLink = `https://gopartara.com/auth?ref=${referralCode}`;

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast({ title: "Copied!", description: "Referral link copied to clipboard." });
  };

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(`Check out PARTARA — compare car part prices instantly! Sign up with my link and get 1 month Pro free: ${referralLink}`)}`, "_blank");
  };

  const shareTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`I use @PARTARA to compare car part prices. Sign up with my link and get 1 month Pro free! ${referralLink}`)}`, "_blank");
  };

  // Admin: show full email. Regular: show display_name only (required).
  const welcomeName = isAdmin
    ? (user?.email || "Admin")
    : (profile?.display_name || "there");

  const planBadge = () => {
    if (currentPlan === "admin") return <span className="px-2.5 py-0.5 rounded-full bg-destructive/15 border border-destructive/30 text-destructive text-xs font-semibold">ADMIN</span>;
    if (currentPlan === "elite") return <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-semibold">ELITE ⭐</span>;
    if (currentPlan === "pro") return <span className="px-2.5 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400 text-xs font-semibold">PRO</span>;
    return <span className="px-2.5 py-0.5 rounded-full bg-muted border border-border text-muted-foreground text-xs font-semibold">FREE PLAN</span>;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

      <div className="container relative z-10 max-w-4xl pt-24 pb-12 px-4 flex-1">
        {/* Display Name Required Banner */}
        {needsDisplayName && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 mb-6 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-400">⚠️ Please set your display name to complete your profile.</p>
              <p className="text-xs text-muted-foreground mt-1">Your display name is required before you can use all features.</p>
            </div>
            <Button size="sm" className="rounded-xl shrink-0" onClick={() => {
              const el = document.getElementById("display-name-input");
              if (el) { el.scrollIntoView({ behavior: "smooth", block: "center" }); el.focus(); }
            }}>
              Set Display Name
            </Button>
          </div>
        )}

        {/* Section 1 — Welcome Header */}
        <div className="glass rounded-2xl p-6 sm:p-8 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Avatar */}
            <div className="relative group shrink-0">
              <div className="w-16 h-16 rounded-full bg-secondary border-2 border-border overflow-hidden flex items-center justify-center">
                {avatarSignedUrl ? (
                  <img src={avatarSignedUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User size={28} className="text-muted-foreground" />
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute inset-0 rounded-full bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                {uploading ? <Loader2 size={16} className="animate-spin text-foreground" /> : <Camera size={16} className="text-foreground" />}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display text-2xl sm:text-3xl font-bold truncate">
                  Welcome back, {welcomeName}!
                </h1>
                {planBadge()}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Member since {profile?.created_at ? new Date(profile.created_at).toLocaleDateString("en-GB", { month: "long", year: "numeric" }) : "—"}
              </p>
            </div>

            {isFree && (
              <Button className="rounded-xl gap-2 shrink-0" onClick={() => navigate("/pricing")}>
                <Sparkles size={14} />
                Upgrade to Pro →
              </Button>
            )}
          </div>
        </div>

        {/* Section 2 — Usage Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <StatCard
            icon={<Search size={18} className="text-primary" />}
            label="Searches This Month"
            value={isPro ? "Unlimited" : `${monthlySearchCount}/5`}
          />
          <StatCard
            icon={<ShoppingBag size={18} className="text-primary" />}
            label="Active Listings"
            value={String(activeListingsCount)}
          />
          <StatCard
            icon={<Bookmark size={18} className="text-primary" />}
            label="Saved Parts"
            value={String(savedPartsCount)}
          />
          <StatCard
            icon={<BellIcon size={18} className="text-primary" />}
            label="Price Alerts"
            value={String(priceAlertsCount)}
          />
        </div>

        {/* Section 3 — Quick Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <QuickAction icon="🔍" label="New Search" onClick={() => navigate("/search")} />
          <QuickAction icon="🚗" label="My Garage" onClick={() => navigate("/garage")} />
          <QuickAction icon="📦" label="My Listings" onClick={() => navigate("/my-market")} />
          {!isEliteUser && (
            <QuickAction icon="💰" label="Upgrade Plan" onClick={() => navigate("/pricing")} />
          )}
        </div>

        {/* Section 4 — Referral */}
        <div className="glass rounded-2xl p-6 sm:p-8 mb-6">
          <h2 className="font-display text-lg font-semibold mb-1">🎁 Refer a Friend — Give 1 Month Pro, Get 1 Month Pro</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Share your unique link. When a friend signs up and subscribes to Pro, they get their first month free — and so do you.
          </p>
          <div className="flex items-center gap-2 mb-4">
            <Input
              value={referralLink}
              readOnly
              className="bg-secondary border-border h-10 rounded-xl text-sm font-mono"
            />
            <Button variant="outline" size="sm" className="rounded-xl gap-1.5 shrink-0" onClick={copyReferralLink}>
              <Copy size={14} />
              Copy
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="rounded-xl gap-1.5 text-xs" onClick={shareWhatsApp}>
              WhatsApp
            </Button>
            <Button variant="outline" size="sm" className="rounded-xl gap-1.5 text-xs" onClick={shareTwitter}>
              X / Twitter
            </Button>
          </div>
          {(profile as any)?.bonus_searches > 0 && (
            <p className="text-xs text-muted-foreground mt-3">
              🎉 You've earned {(profile as any).bonus_searches} bonus searches from referrals!
            </p>
          )}
        </div>

        {/* Subscription Management */}
        <div className="glass rounded-2xl p-6 sm:p-8 mb-6">
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
            </div>
          ) : currentPlan !== "free" ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Crown size={20} className="text-primary" />
                </div>
                <div>
                  <p className="font-display font-bold text-lg capitalize">{currentPlan} Plan</p>
                  <p className="text-xs text-muted-foreground">
                    {currentPlan === "pro" ? "£9.99/mo" : currentPlan === "elite" ? "£19.99/mo" : ""}
                  </p>
                </div>
              </div>

              <div className="rounded-xl bg-secondary/40 border border-border p-4 space-y-2 text-sm">
                {subStatus.subscription_end && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Next payment</span>
                      <span className="font-medium">{new Date(subStatus.subscription_end).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</span>
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
              </div>

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" className="rounded-xl gap-2" onClick={handleManageSubscription} disabled={portalLoading}>
                  {portalLoading ? <Loader2 size={14} className="animate-spin" /> : <ExternalLink size={14} />}
                  Manage Subscription
                </Button>
                {profile?.first_payment_date && !profile.refund_granted && (() => {
                  const daysSince = (Date.now() - new Date(profile.first_payment_date!).getTime()) / (1000 * 60 * 60 * 24);
                  return daysSince <= 7;
                })() && (
                  <Button variant="outline" size="sm" className="rounded-xl gap-2" onClick={() => navigate("/refund")}>
                    Request Refund
                  </Button>
                )}
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
              <Button size="sm" className="rounded-xl gap-2" onClick={() => navigate("/pricing")}>
                Upgrade Plan
              </Button>
            </div>
          )}
        </div>

        {/* Section 5 — Profile Settings */}
        <div className="glass rounded-2xl p-6 sm:p-8 mb-6">
          <h2 className="font-display text-lg font-semibold mb-4">Profile Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">Display Name</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="display-name-input"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className={`pl-10 bg-secondary border-border h-11 rounded-xl ${needsDisplayName ? "border-amber-500 ring-2 ring-amber-500/30" : ""}`}
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

        {/* My Garage */}
        {user && (
          <div className="mb-6">
            <MyGarageSection
              userId={user.id}
              isPro={isPro}
              isBusinessUser={isEliteUser}
            />
          </div>
        )}

        {/* Price Alerts */}
        {user && (
          <div className="mb-6">
            <PriceAlertsSection userId={user.id} />
          </div>
        )}

        {/* Blog Generator */}
        <div className="mb-6">
          <BlogGenerateSection />
        </div>

        {/* Search History — Pro/Elite only */}
        {isPro ? (
          <div className="glass rounded-2xl p-6 sm:p-8 mb-6">
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
                  <button onClick={clearAllHistory} className="text-xs text-muted-foreground hover:text-destructive transition-colors">
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
                  <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/50 transition-colors group">
                    <Search size={14} className="text-muted-foreground shrink-0" />
                    <button
                      onClick={() => navigate(`/search?q=${encodeURIComponent(item.query)}`)}
                      className="flex-1 text-left text-sm font-medium hover:text-primary transition-colors truncate"
                    >
                      {item.query}
                    </button>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {new Date(item.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
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
        ) : (
          <div className="glass rounded-2xl p-6 sm:p-8 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Search size={18} className="text-muted-foreground" />
              <h2 className="font-display text-lg font-semibold text-muted-foreground">Recent Searches</h2>
              <Lock size={14} className="text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground mb-4">Search history is a Pro feature. Upgrade to view and export your past searches.</p>
            <Button className="rounded-xl gap-2" onClick={() => navigate("/pricing")}>
              <Sparkles size={14} />
              Upgrade to Pro — £9.99/mo
            </Button>
          </div>
        )}

        {/* Priority Support — Elite only */}
        <div className="mb-6">
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

        {/* Analytics Dashboard — Elite only */}
        <div className="glass rounded-2xl p-6 sm:p-8 mb-6">
          <h2 className="font-display text-lg font-semibold flex items-center gap-2 mb-4">
            📊 Analytics
          </h2>
          <EliteFeatureGate isBusinessUser={isEliteUser} label="Elite plan feature">
            <AnalyticsDashboard />
          </EliteFeatureGate>
        </div>

        {/* Coming Soon — Elite only */}
        {isEliteUser && (
          <div className="mb-6">
            <ComingSoonFeatures />
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

/* ── Small reusable components ──────────────────────────── */

const StatCard = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="glass rounded-2xl p-4 sm:p-5">
    <div className="mb-2">{icon}</div>
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="font-display font-bold text-lg">{value}</p>
  </div>
);

const QuickAction = ({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) => (
  <button
    onClick={onClick}
    className="glass rounded-xl p-4 text-center hover:border-primary/30 transition-all duration-200 hover:-translate-y-0.5"
  >
    <span className="text-xl mb-1 block">{icon}</span>
    <span className="text-xs font-medium text-foreground">{label}</span>
  </button>
);

export default Dashboard;
