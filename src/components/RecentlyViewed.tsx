import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import {
  clearRecentViews as clearStorage,
  type RecentViewItem,
} from "@/lib/recentViews";

const RecentlyViewed = () => {
  const [items, setItems] = useState<RecentViewItem[]>([]);

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

  const currencySymbol = (c: string) => (c === "GBP" ? "£" : c === "EUR" ? "€" : "$");

  return (
    <section className="py-12 px-4">
      <div className="container max-w-6xl mx-auto">
        {/* Header */}
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

        {/* Horizontal scroll */}
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
          {items.slice(0, 5).map((item) => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 w-48 snap-start group"
            >
              {/* Image */}
              <div className="relative w-full h-36 rounded-xl overflow-hidden bg-secondary mb-3">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              </div>

              {/* Info */}
              <div className="px-1">
                <p className="text-xs text-muted-foreground font-medium leading-snug line-clamp-2 mb-1.5 group-hover:text-foreground transition-colors">
                  {item.title}
                </p>
                <p className="text-sm font-bold text-foreground">
                  {currencySymbol(item.currency)}
                  {parseFloat(item.price).toFixed(2)}
                </p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RecentlyViewed;
