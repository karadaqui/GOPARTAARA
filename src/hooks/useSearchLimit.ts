import { useSearchLimitContext } from "@/contexts/SearchLimitContext";

/** Check if same query was searched recently */
export const isSameQuery = (query: string): boolean => {
  const last = localStorage.getItem("partara_last_search");
  return !!last && last.trim().toLowerCase() === query.trim().toLowerCase();
};

/** Store last search query */
export const setLastSearch = (query: string) => {
  localStorage.setItem("partara_last_search", query.trim().toLowerCase());
};

/** Guest (anonymous) search tracking — 3 searches / 30 days, stored locally */
export const ANON_SEARCH_LIMIT = 3;
const ANON_KEY = "gopartara_anon_searches";

interface AnonData { count: number; reset: string | null }

const readAnon = (): AnonData => {
  try {
    const raw = localStorage.getItem(ANON_KEY);
    const parsed = raw ? JSON.parse(raw) : { count: 0, reset: null };
    // Reset window if expired
    if (parsed.reset && new Date() > new Date(parsed.reset)) {
      return { count: 0, reset: null };
    }
    return { count: parsed.count || 0, reset: parsed.reset || null };
  } catch {
    return { count: 0, reset: null };
  }
};

const writeAnon = (data: AnonData) => {
  try { localStorage.setItem(ANON_KEY, JSON.stringify(data)); } catch { /* ignore */ }
};

export const getGuestSearchCount = (): number => readAnon().count;

export const getGuestSearchesRemaining = (): number =>
  Math.max(0, ANON_SEARCH_LIMIT - readAnon().count);

export const incrementGuestSearch = () => {
  const data = readAnon();
  const next: AnonData = { count: data.count + 1, reset: data.reset };
  if (!next.reset) {
    const reset = new Date();
    reset.setDate(reset.getDate() + 30);
    next.reset = reset.toISOString();
  }
  writeAnon(next);
};

/**
 * Reads from the global SearchLimitProvider so the underlying
 * `search_history` count and `profiles.bonus_searches` queries
 * only fire ONCE per session, regardless of how many components
 * call this hook.
 */
export const useSearchLimit = () => useSearchLimitContext();
