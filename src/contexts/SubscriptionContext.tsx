import { createContext, useContext, useEffect, useRef, useState, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type SubscriptionPlan = "free" | "pro" | "elite" | "admin" | string;

interface SubscriptionContextType {
  plan: SubscriptionPlan;
  trialEndsAt: string | null;
  subscriptionPeriod: string | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

/**
 * Singleton-style cache: provides the current user's subscription details
 * globally so we don't refetch /profiles?select=... on every page/component.
 * Includes plan, trial_ends_at, and subscription_period to eliminate duplicate
 * profile queries from PricingSection and similar consumers.
 */
export const SubscriptionProvider = ({ children }: { children: ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const [plan, setPlan] = useState<SubscriptionPlan>("free");
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);
  const [subscriptionPeriod, setSubscriptionPeriod] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const fetchedForUserIdRef = useRef<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) {
      setPlan("free");
      setTrialEndsAt(null);
      setSubscriptionPeriod(null);
      setLoading(false);
      return;
    }
    try {
      const { data } = await supabase
        .from("profiles")
        .select("subscription_plan, trial_ends_at, subscription_period")
        .eq("user_id", user.id)
        .maybeSingle();
      setPlan((data?.subscription_plan as SubscriptionPlan) || "free");
      setTrialEndsAt(data?.trial_ends_at ?? null);
      setSubscriptionPeriod(data?.subscription_period ?? null);
    } catch {
      // Silently fall back to free on transient errors (503, network, etc.)
      setPlan("free");
      setTrialEndsAt(null);
      setSubscriptionPeriod(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    // Reset guard on logout
    if (!user) {
      fetchedForUserIdRef.current = null;
      refresh();
      return;
    }
    // Skip duplicate fetch for the same user across re-renders/navigations
    if (fetchedForUserIdRef.current === user.id) return;
    fetchedForUserIdRef.current = user.id;
    refresh();
  }, [authLoading, user?.id, refresh]);

  return (
    <SubscriptionContext.Provider value={{ plan, trialEndsAt, subscriptionPeriod, loading, refresh }}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = (): SubscriptionContextType => {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error("useSubscription must be used within SubscriptionProvider");
  return ctx;
};
