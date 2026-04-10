import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const FREE_LIMIT = 5;
// Only these plans grant unlimited searches - seller plans do NOT
const UNLIMITED_SEARCH_PLANS = ["pro", "elite", "admin"];

export const useSearchLimit = () => {
  const { user } = useAuth();
  const [searchCount, setSearchCount] = useState(0);
  const [bonusSearches, setBonusSearches] = useState(0);
  const [isPro, setIsPro] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) return;

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [{ count }, { data: profile }] = await Promise.all([
      supabase
        .from("search_history")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", startOfMonth.toISOString()),
      supabase
        .from("profiles")
        .select("bonus_searches, subscription_plan")
        .eq("user_id", user.id)
        .single(),
    ]);

    setSearchCount(count || 0);
    setBonusSearches(profile?.bonus_searches || 0);
    const dbPlan = profile?.subscription_plan || "free";
    const hasPaidPlan = UNLIMITED_SEARCH_PLANS.includes(dbPlan);
    setIsPro(hasPaidPlan);
    setLoaded(true);
  }, [user]);

  // Optimistic increment — updates UI instantly, then syncs with DB in background
  const recordSearch = useCallback(() => {
    setSearchCount((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (!user) {
      setLoaded(true);
      return;
    }
    refresh();
  }, [user, refresh]);

  const totalAllowed = FREE_LIMIT + bonusSearches;
  const remaining = Math.max(0, totalAllowed - searchCount);
  const canSearch = !user || !loaded || isPro || remaining > 0;
  const limitReached = loaded && !!user && !isPro && remaining <= 0;

  return { canSearch, limitReached, remaining, isPro, loaded, refresh, recordSearch };
};
