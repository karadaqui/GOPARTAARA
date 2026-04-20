import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type SubscriptionPlan = "free" | "pro" | "elite" | "admin" | string;

interface SubscriptionContextType {
  plan: SubscriptionPlan;
  loading: boolean;
  refresh: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

/**
 * Provides the user's subscription plan globally so we don't refetch
 * /profiles?select=subscription_plan on every page/component.
 */
export const SubscriptionProvider = ({ children }: { children: ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const [plan, setPlan] = useState<SubscriptionPlan>("free");
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setPlan("free");
      setLoading(false);
      return;
    }
    try {
      const { data } = await supabase
        .from("profiles")
        .select("subscription_plan")
        .eq("user_id", user.id)
        .maybeSingle();
      setPlan((data?.subscription_plan as SubscriptionPlan) || "free");
    } catch {
      // Silently fall back to free on transient errors (503, network, etc.)
      setPlan("free");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    refresh();
  }, [authLoading, refresh]);

  return (
    <SubscriptionContext.Provider value={{ plan, loading, refresh }}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = (): SubscriptionContextType => {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error("useSubscription must be used within SubscriptionProvider");
  return ctx;
};
