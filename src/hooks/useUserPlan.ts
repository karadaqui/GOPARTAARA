import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type PlanType = "free" | "pro" | "elite" | "admin";

export interface PlanFeatures {
  searchesPerMonth: number;
  marketplaceListings: number;
  savedParts: number;
  garageVehicles: number;
  photoSearch: boolean;
  searchHistory: boolean;
  priceAlerts: boolean;
  adFree: boolean;
  photosPerListing: number;
  csvExport: boolean;
  priceTracking: boolean;
  vehicleNotes: boolean;
  earlyAccess: boolean;
  prioritySupport: boolean;
  analyticsDashboard: boolean;
  referralBonuses: boolean;
}

const PLAN_FEATURES: Record<string, PlanFeatures> = {
  free: {
    searchesPerMonth: 5,
    marketplaceListings: 5,
    savedParts: 5,
    garageVehicles: 1,
    photoSearch: false,
    searchHistory: false,
    priceAlerts: false,
    adFree: false,
    photosPerListing: 3,
    csvExport: false,
    priceTracking: false,
    vehicleNotes: false,
    earlyAccess: false,
    prioritySupport: false,
    analyticsDashboard: false,
    referralBonuses: true,
  },
  pro: {
    searchesPerMonth: Infinity,
    marketplaceListings: Infinity,
    savedParts: Infinity,
    garageVehicles: Infinity,
    photoSearch: true,
    searchHistory: true,
    priceAlerts: true,
    adFree: true,
    photosPerListing: 10,
    csvExport: false,
    priceTracking: false,
    vehicleNotes: false,
    earlyAccess: false,
    prioritySupport: false,
    analyticsDashboard: false,
    referralBonuses: true,
  },
  elite: {
    searchesPerMonth: Infinity,
    marketplaceListings: Infinity,
    savedParts: Infinity,
    garageVehicles: Infinity,
    photoSearch: true,
    searchHistory: true,
    priceAlerts: true,
    adFree: true,
    photosPerListing: 10,
    csvExport: true,
    priceTracking: true,
    vehicleNotes: true,
    earlyAccess: true,
    prioritySupport: true,
    analyticsDashboard: true,
    referralBonuses: true,
  },
  admin: {
    searchesPerMonth: Infinity,
    marketplaceListings: Infinity,
    savedParts: Infinity,
    garageVehicles: Infinity,
    photoSearch: true,
    searchHistory: true,
    priceAlerts: true,
    adFree: true,
    photosPerListing: 10,
    csvExport: true,
    priceTracking: true,
    vehicleNotes: true,
    earlyAccess: true,
    prioritySupport: true,
    analyticsDashboard: true,
    referralBonuses: true,
  },
};

// Admin includes all seller plans
const ADMIN_LIKE = ["admin"];
const PAID_PLANS = ["pro", "elite", "admin"];

export interface UserPlan {
  plan: PlanType;
  features: PlanFeatures;
  isAdmin: boolean;
  isPaid: boolean;
  isElite: boolean;
  isPro: boolean;
  isFree: boolean;
  isTrial: boolean;
  trialEndsAt: string | null;
  loading: boolean;
  canUseFeature: (feature: keyof PlanFeatures) => boolean;
  requiredPlanFor: (feature: keyof PlanFeatures) => string;
  refresh: () => Promise<void>;
}

/**
 * Shows an upgrade modal at most once per 24h per feature.
 * Returns true if already shown recently.
 */
export const wasUpgradeShownRecently = (feature: string): boolean => {
  const key = `partara_upgrade_${feature}`;
  const last = localStorage.getItem(key);
  if (!last) return false;
  return Date.now() - parseInt(last, 10) < 24 * 60 * 60 * 1000;
};

export const markUpgradeShown = (feature: string) => {
  localStorage.setItem(`partara_upgrade_${feature}`, Date.now().toString());
};

export const useUserPlan = (): UserPlan => {
  const { user } = useAuth();
  const [plan, setPlan] = useState<PlanType>("free");
  const [subscriptionPeriod, setSubscriptionPeriod] = useState<string>("free");
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setPlan("free");
      setSubscriptionPeriod("free");
      setTrialEndsAt(null);
      setLoading(false);
      return;
    }
    try {
      const { data } = await supabase
        .from("profiles")
        .select("subscription_plan, subscription_period, trial_ends_at")
        .eq("user_id", user.id)
        .single();
      const dbPlan = data?.subscription_plan || "free";
      setPlan(dbPlan as PlanType);
      setSubscriptionPeriod(data?.subscription_period || "free");
      setTrialEndsAt(data?.trial_ends_at || null);
    } catch {
      setPlan("free");
      setSubscriptionPeriod("free");
      setTrialEndsAt(null);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const features = useMemo(() => PLAN_FEATURES[plan] || PLAN_FEATURES.free, [plan]);
  const isAdmin = ADMIN_LIKE.includes(plan);
  const isPaid = PAID_PLANS.includes(plan);
  const isElite = ["elite", "admin"].includes(plan);
  const isPro = isPaid;
  const isFree = plan === "free";
  const isTrial = subscriptionPeriod === "trial";

  const canUseFeature = useCallback(
    (feature: keyof PlanFeatures) => {
      const val = features[feature];
      if (typeof val === "boolean") return val;
      return true;
    },
    [features]
  );

  const requiredPlanFor = useCallback(
    (feature: keyof PlanFeatures) => {
      if (PLAN_FEATURES.pro[feature]) return "Pro";
      if (PLAN_FEATURES.elite[feature]) return "Elite";
      return "Pro";
    },
    []
  );

  return {
    plan,
    features,
    isAdmin,
    isPaid,
    isElite,
    isPro,
    isFree,
    isTrial,
    trialEndsAt,
    loading,
    canUseFeature,
    requiredPlanFor,
    refresh,
  };
};
