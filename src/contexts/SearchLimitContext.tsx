import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";

const FREE_LIMIT = 10;
// Only these plans grant unlimited searches - seller plans do NOT
const UNLIMITED_SEARCH_PLANS = ["pro", "elite", "admin"];

export interface SearchLimitValue {
  canSearch: boolean;
  limitReached: boolean;
  remaining: number;
  isPro: boolean;
  loaded: boolean;
  refresh: () => Promise<void>;
  recordSearch: () => void;
  searchCount: number;
  totalAllowed: number;
}

const SearchLimitContext = createContext<SearchLimitValue | undefined>(undefined);

/**
 * Provides the user's monthly search usage globally so the
 * `search_history` HEAD count + `profiles.bonus_searches` queries
 * only fire ONCE per session, not per component that needs them.
 */
export const SearchLimitProvider = ({ children }: { children: ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const { plan, loading: subLoading } = useSubscription();
  const [searchCount, setSearchCount] = useState(0);
  const [bonusSearches, setBonusSearches] = useState(0);
  const [loaded, setLoaded] = useState(false);

  const isPro = UNLIMITED_SEARCH_PLANS.includes(plan);

  const refresh = useCallback(async () => {
    if (!user) {
      setSearchCount(0);
      setBonusSearches(0);
      setLoaded(true);
      return;
    }

    try {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      let count = 0;
      try {
        const historyRes = await supabase
          .from("search_history")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .gte("created_at", startOfMonth.toISOString());
        count = historyRes.count || 0;
      } catch {
        /* silently ignore 503 */
      }

      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("bonus_searches")
          .eq("user_id", user.id)
          .maybeSingle();
        setBonusSearches(profile?.bonus_searches || 0);
      } catch {
        /* silently ignore */
      }

      setSearchCount(count || 0);
    } catch (e) {
      console.warn("SearchLimit refresh failed:", e);
    }
    setLoaded(true);
  }, [user]);

  // Optimistic increment — updates UI instantly
  const recordSearch = useCallback(() => {
    setSearchCount((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (authLoading || subLoading) return;
    refresh();
  }, [authLoading, subLoading, refresh]);

  const value = useMemo<SearchLimitValue>(() => {
    const totalAllowed = FREE_LIMIT + bonusSearches;
    const remaining = Math.max(0, totalAllowed - searchCount);
    const canSearch = !user || !loaded || isPro || remaining > 0;
    const limitReached = loaded && !!user && !isPro && remaining <= 0;
    return {
      canSearch,
      limitReached,
      remaining,
      isPro,
      loaded,
      refresh,
      recordSearch,
      searchCount,
      totalAllowed,
    };
  }, [user, loaded, isPro, bonusSearches, searchCount, refresh, recordSearch]);

  return (
    <SearchLimitContext.Provider value={value}>
      {children}
    </SearchLimitContext.Provider>
  );
};

export const useSearchLimitContext = (): SearchLimitValue => {
  const ctx = useContext(SearchLimitContext);
  if (!ctx)
    throw new Error("useSearchLimitContext must be used within SearchLimitProvider");
  return ctx;
};
