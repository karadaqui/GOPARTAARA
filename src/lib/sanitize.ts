/** Strip HTML tags and limit length for safe API input */
export const sanitizeInput = (input: string, maxLength = 200): string => {
  return input
    .replace(/<[^>]*>/g, "")           // strip HTML tags
    .replace(/[<>"'`;(){}]/g, "")      // remove dangerous chars
    .trim()
    .slice(0, maxLength);
};

/** Validate UK plate format (2-8 alphanumeric chars) */
export const isValidPlate = (plate: string): boolean => {
  return /^[A-Za-z0-9]{2,8}$/.test(plate.replace(/\s/g, ""));
};

/** Validate VIN (17 alphanumeric chars, no I/O/Q) */
export const isValidVIN = (vin: string): boolean => {
  return /^[A-HJ-NPR-Z0-9]{17}$/i.test(vin.trim());
};

/** Validate positive price */
export const isValidPrice = (price: number): boolean => {
  return typeof price === "number" && isFinite(price) && price > 0 && price <= 999999;
};

/** Validate email format */
export const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 255;
};

/** Sanitize listing title — reject URLs */
export const sanitizeTitle = (title: string): string | null => {
  const cleaned = sanitizeInput(title, 200);
  if (/https?:\/\//i.test(cleaned) || /www\./i.test(cleaned)) return null;
  return cleaned;
};

/** Sanitize review/message — reject URLs and HTML */
export const sanitizeMessage = (msg: string, maxLength = 1000): string | null => {
  const cleaned = sanitizeInput(msg, maxLength);
  if (/https?:\/\//i.test(cleaned) || /www\./i.test(cleaned)) return null;
  return cleaned;
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
