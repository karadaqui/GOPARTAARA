const STORAGE_KEY = "partara_recent_views";
const MAX_ITEMS = 20;

export interface RecentViewItem {
  id: string;
  title: string;
  price: string;
  currency: string;
  image: string;
  url: string;
  viewedAt: string;
}

export function getRecentViews(): RecentViewItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as RecentViewItem[];
  } catch {
    return [];
  }
}

export function addRecentView(item: Omit<RecentViewItem, "viewedAt">): void {
  const views = getRecentViews().filter((v) => v.id !== item.id);
  views.unshift({ ...item, viewedAt: new Date().toISOString() });
  if (views.length > MAX_ITEMS) views.length = MAX_ITEMS;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(views));
}

export function clearRecentViews(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function formatTimeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}
