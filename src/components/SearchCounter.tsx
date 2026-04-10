import { useNavigate } from "react-router-dom";
import { Search, ArrowUp } from "lucide-react";
import { useSearchLimit } from "@/hooks/useSearchLimit";
import { useAuth } from "@/contexts/AuthContext";

const SearchCounter = ({ limitData }: { limitData?: ReturnType<typeof import("@/hooks/useSearchLimit").useSearchLimit> }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const ownData = useSearchLimit();
  const { remaining, isPro, loaded } = limitData || ownData;

  if (!user || !loaded || isPro) return null;

  if (remaining <= 0) {
    return (
      <button
        onClick={() => navigate("/pricing")}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        <ArrowUp size={12} />
        Upgrade to Pro
      </button>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-destructive/15 text-destructive border border-destructive/30">
      <Search size={12} />
      {remaining} search{remaining !== 1 ? "es" : ""} remaining
    </span>
  );
};

export default SearchCounter;
