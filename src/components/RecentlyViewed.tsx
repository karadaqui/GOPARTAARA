import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import {
  clearRecentViews as clearStorage,
  type RecentViewItem,
} from "@/lib/recentViews";
import RecentViewCard from "@/components/RecentViewCard";
import { useRecentViewActions } from "@/hooks/useRecentViewActions";

const RecentlyViewed = () => {
  const [items, setItems] = useState<RecentViewItem[]>([]);
  const { savedIds, alertIds, onSaved, onAlertSet } = useRecentViewActions();

  useEffect(() => {
    const load = () => {
      try {
        const stored = localStorage.getItem('partara_recent_views');
        setItems(stored ? JSON.parse(stored) : []);
      } catch { setItems([]); }
    };
    load();
    window.addEventListener('storage', load);
    return () => window.removeEventListener('storage', load);
  }, []);

  if (items.length === 0) return null;

  const handleClear = () => {
    clearStorage();
    setItems([]);
  };

  return (
    <section className="py-12 px-4">
      <div className="container max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs font-semibold tracking-[0.25em] uppercase text-primary/60 mb-1">
              CONTINUE BROWSING
            </p>
            <h2 className="text-xl font-bold text-foreground tracking-tight">
              Recently Viewed
            </h2>
          </div>
          <div className="flex items-center gap-4">
            {items.length > 5 && (
              <Link
                to="/recent"
                className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
              >
                View all {items.length} parts <ArrowRight size={12} />
              </Link>
            )}
            <button
              onClick={handleClear}
              className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
          {items.slice(0, 5).map((item) => (
            <div key={item.id} className="flex-shrink-0 w-48 snap-start">
              <RecentViewCard
                item={item}
                savedIds={savedIds}
                alertIds={alertIds}
                onSaved={onSaved}
                onAlertSet={onAlertSet}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RecentlyViewed;
