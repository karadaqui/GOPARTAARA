import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Search, ArrowUp } from "lucide-react";

const FREE_LIMIT = 5;

const SearchCounter = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchCount, setSearchCount] = useState(0);
  const [bonusSearches, setBonusSearches] = useState(0);
  const [isPro, setIsPro] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      // Get current month search count
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

    fetchData();
  }, [user]);

  if (!user || !loaded || isPro) return null;

  const totalAllowed = FREE_LIMIT + bonusSearches;
  const remaining = Math.max(0, totalAllowed - searchCount);

  if (remaining <= 0) {
    return (
      <button
        onClick={() => {
          navigate("/");
          setTimeout(() => {
            const el = document.getElementById("pricing");
            if (el) el.scrollIntoView({ behavior: "smooth" });
          }, 100);
        }}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        <ArrowUp size={12} />
        Upgrade to Pro
      </button>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-secondary text-muted-foreground border border-border">
      <Search size={12} />
      {remaining} search{remaining !== 1 ? "es" : ""} remaining
    </span>
  );
};

export default SearchCounter;
