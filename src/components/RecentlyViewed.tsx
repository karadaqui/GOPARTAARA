import { useState, useEffect } from "react";
import { ExternalLink } from "lucide-react";
import {
  getRecentViews,
  clearRecentViews as clearStorage,
  formatTimeAgo,
  type RecentViewItem,
} from "@/lib/recentViews";

interface RecentlyViewedProps {
  maxItems?: number;
}

const RecentlyViewed = ({ maxItems }: RecentlyViewedProps) => {
  const [items, setItems] = useState<RecentViewItem[]>([]);

  useEffect(() => {
    const views = getRecentViews();
    setItems(maxItems ? views.slice(0, maxItems) : views);
  }, [maxItems]);

  if (items.length === 0) return null;

  const handleClear = () => {
    clearStorage();
    setItems([]);
  };

  return (
    <section className="py-12 px-4">
      <div className="container max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs font-semibold tracking-[0.25em] uppercase text-primary/60 mb-1">
              CONTINUE WHERE YOU LEFT OFF
            </p>
            <h2 className="text-xl font-bold text-foreground tracking-tight">
              Recently Viewed
            </h2>
          </div>
          <button
            onClick={handleClear}
            className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
          >
            Clear all
          </button>
        </div>

        {/* Horizontal scroll */}
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
          {items.map((item) => (
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
                <div className="absolute top-2 left-2 bg-background/60 backdrop-blur-sm px-2 py-0.5 rounded-full">
                  <span className="text-[10px] text-muted-foreground font-medium">
                    {item.supplier}
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="px-1">
                <p className="text-xs text-muted-foreground font-medium leading-snug line-clamp-2 mb-1.5 group-hover:text-foreground transition-colors">
                  {item.title}
                </p>
                <p className="text-sm font-bold text-foreground">{item.price}</p>
                <p className="text-[10px] text-muted-foreground/50 mt-0.5">
                  {formatTimeAgo(item.viewedAt)}
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
