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

/** Guest search tracking */
export const getGuestSearchCount = (): number =>
  parseInt(localStorage.getItem("partara_guest_searches") || "0", 10);

export const incrementGuestSearch = () => {
  localStorage.setItem(
    "partara_guest_searches",
    String(getGuestSearchCount() + 1),
  );
};

/**
 * Reads from the global SearchLimitProvider so the underlying
 * `search_history` count and `profiles.bonus_searches` queries
 * only fire ONCE per session, regardless of how many components
 * call this hook.
 */
export const useSearchLimit = () => useSearchLimitContext();
