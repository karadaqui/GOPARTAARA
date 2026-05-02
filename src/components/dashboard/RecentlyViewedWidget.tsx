import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getRecentSearches } from "@/lib/recentSearches";

const RecentlyViewedWidget = () => {
  const [items, setItems] = useState<string[]>([]);

  useEffect(() => {
    setItems(getRecentSearches().slice(0, 5));
  }, []);

  return (
    <div className="glass rounded-2xl p-6 sm:p-8 mb-6">
      <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
        <span aria-hidden="true">🕐</span>
        Recently Viewed
      </h2>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No recent searches yet. Start searching to see your history here.
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((term) => (
            <li
              key={term}
              className="flex items-center justify-between gap-3"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 10,
                padding: "10px 14px",
              }}
            >
              <span
                className="truncate"
                style={{ color: "#ffffff", fontSize: 14, fontWeight: 600 }}
              >
                {term}
              </span>
              <Link
                to={`/search?q=${encodeURIComponent(term)}`}
                className="text-xs font-semibold whitespace-nowrap hover:underline"
                style={{ color: "#fbbf24" }}
              >
                Search again →
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default RecentlyViewedWidget;
