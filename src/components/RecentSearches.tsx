import { useState, useEffect, useCallback } from "react";
import { X } from "lucide-react";

const STORAGE_KEY = "partara_recent_searches";
const MAX_RECENT = 5;

export const addRecentSearch = (query: string) => {
  if (!query || !query.trim()) return;
  try {
    const trimmed = query.trim();
    const raw = localStorage.getItem(STORAGE_KEY);
    const list: string[] = raw ? JSON.parse(raw) : [];
    const filtered = list.filter((q) => q.toLowerCase() !== trimmed.toLowerCase());
    filtered.unshift(trimmed);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered.slice(0, MAX_RECENT)));
  } catch {}
};

interface Props {
  onSelect: (query: string) => void;
}

const RecentSearches = ({ onSelect }: Props) => {
  const [items, setItems] = useState<string[]>([]);

  const load = useCallback(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      setItems(raw ? JSON.parse(raw) : []);
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const remove = (q: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const next = items.filter((it) => it !== q);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setItems(next);
    } catch {}
  };

  if (items.length === 0) return null;

  return (
    <div className="mt-4">
      <p className="text-xs text-zinc-500 mb-2 font-medium">Recently searched:</p>
      <div className="flex flex-wrap gap-2">
        {items.map((q) => (
          <button
            key={q}
            onClick={() => onSelect(q)}
            className="group inline-flex items-center gap-1.5 hover:border-white/20 transition-colors"
            style={{
              background: "#111111",
              border: "1px solid #1f1f1f",
              color: "#a1a1aa",
              fontSize: "13px",
              padding: "6px 12px",
              borderRadius: "6px",
            }}
          >
            <span>{q}</span>
            <span
              role="button"
              aria-label={`Remove ${q}`}
              onClick={(e) => remove(q, e)}
              className="opacity-50 hover:opacity-100 hover:text-white transition-colors -mr-1 ml-0.5"
            >
              <X size={12} />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default RecentSearches;
