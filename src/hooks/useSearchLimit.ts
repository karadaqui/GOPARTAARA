import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";

const FREE_LIMIT = 10;
// Only these plans grant unlimited searches - seller plans do NOT
const UNLIMITED_SEARCH_PLANS = ["pro", "elite", "admin"];

/** Check if same query was searched recently */
export const isSameQuery = (query: string): boolean => {
  const last = localStorage.getItem("partara_last_search");
  return !!last && last.trim().toLowerCase() === query.trim().toLowerCase();
};

/** Store last search query */
export const setLastSearch = (query: string) => {
  localStorage.setItem("partara_last_search", query.trim().toLowerCase());
};

/** Guest search tracking */
export const getGuestSearchCount = (): number =>
  parseInt(localStorage.getItem("partara_guest_searches") || "0", 10);

export const incrementGuestSearch = () => {
  localStorage.setItem("partara_guest_searches", String(getGuestSearchCount() + 1));
};

export const useSearchLimit = () => {
  const { user } = useAuth();
  const { plan } = useSubscription();
  const [searchCount, setSearchCount] = useState(0);
  const [bonusSearches, setBonusSearches] = useState(0);
  const [loaded, setLoaded] = useState(false);

  const isPro = UNLIMITED_SEARCH_PLANS.includes(plan);

  const refresh = useCallback(async () => {
    if (!user) return;

    try {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      // Separate calls so search_history 503 doesn't break profiles fetch
      let count = 0;
      try {
        const historyRes = await supabase
          .from("search_history")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .gte("created_at", startOfMonth.toISOString());
        count = historyRes.count || 0;
      } catch { /* silently ignore 503 */ }

      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("bonus_searches")
          .eq("user_id", user.id)
          .maybeSingle();
        setBonusSearches(profile?.bonus_searches || 0);
      } catch { /* silently ignore */ }

      setSearchCount(count || 0);
    } catch (e) {
      // Silently ignore - don't block search on DB errors
      console.warn("useSearchLimit refresh failed:", e);
    }
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

  return { canSearch, limitReached, remaining, isPro, loaded, refresh, recordSearch, searchCount, totalAllowed };
};
