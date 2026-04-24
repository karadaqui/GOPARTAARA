const STORAGE_KEY = "gopartara_recent_searches";
const MAX_ITEMS = 10;

export function getRecentSearches(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((s) => typeof s === "string") : [];
  } catch {
    return [];
  }
}

export function addRecentSearch(query: string): void {
  if (!query || !query.trim()) return;
  const trimmed = query.trim();
  try {
    const list = getRecentSearches().filter(
      (q) => q.toLowerCase() !== trimmed.toLowerCase()
    );
    list.unshift(trimmed);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, MAX_ITEMS)));
  } catch {}
}

export function removeRecentSearch(query: string): void {
  try {
    const list = getRecentSearches().filter((q) => q !== query);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {}
}

export function clearRecentSearches(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}
