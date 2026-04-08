import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const FREE_LIMIT = 5;

export const useSearchLimit = () => {
  const { user } = useAuth();
  const [searchCount, setSearchCount] = useState(0);
  const [bonusSearches, setBonusSearches] = useState(0);
  const [isPro, setIsPro] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const refresh = async () => {
    if (!user) return;

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [{ count }, { data: profile }, subResult] = await Promise.all([
      supabase
        .from("search_history")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", startOfMonth.toISOString()),
      supabase
        .from("profiles")
        .select("bonus_searches")
        .eq("user_id", user.id)
        .single(),
      supabase.functions.invoke("check-subscription"),
    ]);

    setSearchCount(count || 0);
    setBonusSearches(profile?.bonus_searches || 0);
    setIsPro(!subResult.error && subResult.data?.subscribed);
    setLoaded(true);
  };

  useEffect(() => {
    if (!user) {
      setLoaded(true);
      return;
    }
    refresh();
  }, [user]);

  const totalAllowed = FREE_LIMIT + bonusSearches;
  const remaining = Math.max(0, totalAllowed - searchCount);
  const canSearch = !user || !loaded || isPro || remaining > 0;
  const limitReached = loaded && !!user && !isPro && remaining <= 0;

  return { canSearch, limitReached, remaining, isPro, loaded, refresh };
};
