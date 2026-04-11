/** Strip HTML tags and limit length for safe API input */
export const sanitizeInput = (input: string, maxLength = 200): string => {
  return input
    .replace(/<[^>]*>/g, "")           // strip HTML tags
    .replace(/[<>"'`;(){}]/g, "")      // remove dangerous chars
    .trim()
    .slice(0, maxLength);
};

/** Client-side rate limiter */
const rateLimitMap = new Map<string, number[]>();

export const checkRateLimit = (key: string, maxRequests = 10, windowMs = 60_000): boolean => {
  const now = Date.now();
  const timestamps = (rateLimitMap.get(key) || []).filter(t => now - t < windowMs);
  if (timestamps.length >= maxRequests) return false;
  timestamps.push(now);
  rateLimitMap.set(key, timestamps);
  return true;
};

/** Session storage cache for search results */
export const getCachedSearch = (key: string): any | null => {
  try {
    const raw = sessionStorage.getItem(`search_cache_${key}`);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > 5 * 60 * 1000) {
      sessionStorage.removeItem(`search_cache_${key}`);
      return null;
    }
    return data;
  } catch {
    return null;
  }
};

export const setCachedSearch = (key: string, data: any) => {
  try {
    sessionStorage.setItem(`search_cache_${key}`, JSON.stringify({ data, ts: Date.now() }));
  } catch {
    // storage full, ignore
  }
};
