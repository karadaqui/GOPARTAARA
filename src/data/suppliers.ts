// Central supplier registry. Used by Hero subtitle, Search ticker,
// Tyres page country filter, and the Motor Parts page.
//
// All Awin links must use awinaffid=2845282.
// Notes:
//   - Amazon UK here (Awin mid 118045) is for cross-site supplier links.
//     The Amazon Associates tag (gopartara-21) used on /deals is unrelated
//     and remains untouched.

export type SupplierCategory =
  | "tyres" | "wheels" | "parts" | "accessories"
  | "performance" | "bmw" | "motorcycle" | "classic";

export interface Supplier {
  /** Stable id (lowercase, no spaces) — used for filtering */
  id: string;
  name: string;
  /** Optional Awin merchant id */
  mid?: number;
  /** ISO-2 country codes the supplier serves */
  countries: string[];
  category: SupplierCategory[];
  baseUrl: string;
  /** Template URL: replace {query} with encoded query (or {encodedUrl} for Awin deeplink) */
  searchUrl?: string;
  affiliateUrl?: string;
  /** Display logo / short name */
  logo: string;
  flag: string;
  /** True if live for searching, false if "Coming Soon" */
  live?: boolean;
}

export const SUPPLIERS: Supplier[] = [
  // ── Existing ───────────────────────────────────────────────────────────
  {
    id: "ebay",
    name: "eBay",
    countries: ["GB", "US", "DE", "FR", "IT", "ES", "AU", "CA"],
    category: ["parts", "accessories", "tyres", "wheels"],
    baseUrl: "https://www.ebay.com",
    logo: "eBay",
    flag: "🌍",
    live: true,
  },
  {
    id: "mytyres",
    name: "mytyres.co.uk",
    mid: 4118,
    countries: ["GB"],
    category: ["tyres"],
    baseUrl: "https://www.mytyres.co.uk",
    affiliateUrl:
      "https://www.awin1.com/cread.php?awinmid=4118&awinaffid=2845282&clickref=partara-suppliers&p=https%3A%2F%2Fwww.mytyres.co.uk",
    logo: "mytyres.co.uk",
    flag: "🇬🇧",
    live: true,
  },
  {
    id: "tyresuk",
    name: "Tyres UK",
    mid: 12715,
    countries: ["GB"],
    category: ["tyres"],
    baseUrl: "https://www.tyres.net",
    affiliateUrl:
      "https://www.awin1.com/cread.php?awinmid=12715&awinaffid=2845282&clickref=partara-suppliers&p=https%3A%2F%2Fwww.tyres.net",
    logo: "Tyres UK",
    flag: "🇬🇧",
    live: true,
  },
  {
    id: "greensparkplug",
    name: "Green Spark Plug Co.",
    mid: 16976,
    countries: ["GB"],
    category: ["classic", "parts"],
    baseUrl: "https://www.greensparkplugs.com",
    affiliateUrl:
      "https://www.awin1.com/cread.php?awinmid=16976&awinaffid=2845282&clickref=partara-suppliers&p=https%3A%2F%2Fwww.greensparkplugs.com",
    logo: "Green Spark Plug Co.",
    flag: "🇬🇧",
    live: true,
  },
  {
    id: "pneumatici",
    name: "Pneumatici IT",
    mid: 12716,
    countries: ["IT"],
    category: ["tyres"],
    baseUrl: "https://www.pneumatici.it",
    affiliateUrl:
      "https://www.awin1.com/cread.php?awinmid=12716&awinaffid=2845282&clickref=partara-suppliers&p=https%3A%2F%2Fwww.pneumatici.it",
    logo: "Pneumatici IT",
    flag: "🇮🇹",
    live: true,
  },
  {
    id: "neumaticos",
    name: "neumaticos-online.es",
    mid: 10499,
    countries: ["ES"],
    category: ["tyres"],
    baseUrl: "https://www.neumaticos-online.es",
    affiliateUrl:
      "https://www.awin1.com/cread.php?awinmid=10499&awinaffid=2845282&clickref=partara-suppliers&p=https%3A%2F%2Fwww.neumaticos-online.es",
    logo: "neumaticos-online.es",
    flag: "🇪🇸",
    live: true,
  },
  {
    id: "reifendirekt",
    name: "ReifenDirekt EE",
    mid: 10747,
    countries: ["DE"],
    category: ["tyres"],
    baseUrl: "https://www.reifendirekt.de",
    affiliateUrl:
      "https://www.awin1.com/cread.php?awinmid=10747&awinaffid=2845282&clickref=partara-suppliers&p=https%3A%2F%2Fwww.reifendirekt.de",
    logo: "ReifenDirekt EE",
    flag: "🇩🇪",
    live: true,
  },
  {
    id: "evking",
    name: "EV King",
    countries: ["GB"],
    category: ["accessories"],
    baseUrl: "https://www.evking.co.uk",
    logo: "EV King",
    flag: "🇬🇧",
    live: true,
  },

  // ── New Awin merchants (TASK 1) ────────────────────────────────────────
  {
    id: "dunford",
    name: "WheelHero (Dunford Inc)",
    mid: 67974,
    countries: ["US"],
    category: ["wheels", "tyres"],
    baseUrl: "https://www.wheelhero.com",
    searchUrl: "https://www.wheelhero.com/search?q={query}",
    affiliateUrl:
      "https://www.awin1.com/cread.php?awinmid=67974&awinaffid=2845282&ued={encodedUrl}",
    logo: "WheelHero",
    flag: "🇺🇸",
    live: true,
  },
  {
    id: "amazonuk",
    name: "Amazon UK",
    mid: 118045,
    countries: ["GB"],
    category: ["parts", "accessories", "tyres"],
    baseUrl: "https://www.amazon.co.uk",
    searchUrl: "https://www.amazon.co.uk/s?k={query}",
    affiliateUrl:
      "https://www.awin1.com/cread.php?awinmid=118045&awinaffid=2845282&ued={encodedUrl}",
    logo: "Amazon UK",
    flag: "🇬🇧",
    live: true,
  },
  {
    id: "autobandenmarkt",
    name: "Autobandenmarkt",
    mid: 8626,
    countries: ["BE"],
    category: ["tyres"],
    baseUrl: "https://www.autobandenmarkt.be",
    searchUrl: "https://www.autobandenmarkt.be/zoekresultaten?q={query}",
    affiliateUrl:
      "https://www.awin1.com/cread.php?awinmid=8626&awinaffid=2845282&ued={encodedUrl}",
    logo: "Autobandenmarkt",
    flag: "🇧🇪",
    live: true,
  },
  {
    id: "maxpeedingrods",
    name: "Maxpeedingrods",
    mid: 16673,
    countries: ["US"],
    category: ["parts", "performance"],
    baseUrl: "https://www.maxpeedingrods.com",
    searchUrl: "https://www.maxpeedingrods.com/search?q={query}",
    affiliateUrl:
      "https://www.awin1.com/cread.php?awinmid=16673&awinaffid=2845282&ued={encodedUrl}",
    logo: "Maxpeedingrods",
    flag: "🇺🇸",
    live: true,
  },
  {
    id: "kohl",
    name: "Kohl Automobile",
    mid: 16809,
    countries: ["DE"],
    category: ["parts", "accessories", "bmw", "motorcycle"],
    baseUrl: "https://shop.kohl.de",
    searchUrl: "https://shop.kohl.de/search?sSearch={query}",
    affiliateUrl:
      "https://www.awin1.com/cread.php?awinmid=16809&awinaffid=2845282&ued={encodedUrl}",
    logo: "Kohl DE",
    flag: "🇩🇪",
    live: true,
  },
  {
    id: "tirendo",
    name: "Tirendo",
    mid: 8794,
    countries: ["NO"],
    category: ["tyres"],
    baseUrl: "https://www.tirendo.no",
    searchUrl: "https://www.tirendo.no/search?q={query}",
    affiliateUrl:
      "https://www.awin1.com/cread.php?awinmid=8794&awinaffid=2845282&ued={encodedUrl}",
    logo: "Tirendo",
    flag: "🇳🇴",
    live: true,
  },
  {
    id: "direnza",
    name: "Direnza",
    mid: 104933,
    countries: ["GB"],
    category: ["performance", "parts"],
    baseUrl: "https://www.direnza.co.uk",
    searchUrl: "https://www.direnza.co.uk/search?q={query}",
    affiliateUrl:
      "https://www.awin1.com/cread.php?awinmid=104933&awinaffid=2845282&ued={encodedUrl}",
    logo: "Direnza",
    flag: "🇬🇧",
    live: true,
  },
  {
    id: "gravityperformance",
    name: "Gravity Performance",
    mid: 30295,
    countries: ["GB"],
    category: ["performance", "parts"],
    baseUrl: "https://www.gravityperformance.co.uk",
    searchUrl: "https://www.gravityperformance.co.uk/search?q={query}",
    affiliateUrl:
      "https://www.awin1.com/cread.php?awinmid=30295&awinaffid=2845282&ued={encodedUrl}",
    logo: "Gravity Performance",
    flag: "🇬🇧",
    live: true,
  },
];

/** Filter by selected country (returns all when country is "GLOBAL"). */
export function suppliersForCountry(countryCode: string): Supplier[] {
  if (!countryCode || countryCode === "GLOBAL") return SUPPLIERS.filter(s => s.live !== false);
  return SUPPLIERS.filter(s => s.live !== false && s.countries.includes(countryCode));
}

/** Filter to suppliers serving the country and matching at least one category. */
export function suppliersForCountryAndCategory(
  countryCode: string,
  categories: SupplierCategory[],
): Supplier[] {
  return suppliersForCountry(countryCode).filter(s =>
    s.category.some(c => categories.includes(c)),
  );
}

// ── Shipping coverage (used by Awin merchant cards & sorting) ─────────
// Keyed by Awin mid; "evking" keyed by id since it has no mid.
const EU_CODES = ["AT","BE","BG","HR","CY","CZ","DK","EE","FI","FR","DE","GR","HU","IE","IT","LV","LT","LU","MT","NL","PL","PT","RO","SK","SI","ES","SE"];

interface ShippingInfo {
  label: string;
  codes: string[]; // expanded ISO-2 list
  worldwide?: boolean;
}

const SHIPS_TO: Record<string, ShippingInfo> = {
  "16976": { label: "🌍 Ships worldwide", codes: ["GB", ...EU_CODES, "US", "AU"], worldwide: true },
  "4118":  { label: "🇬🇧 UK", codes: ["GB"] },
  "12715": { label: "🇬🇧 UK", codes: ["GB"] },
  "12716": { label: "🇮🇹 IT + EU", codes: ["IT", ...EU_CODES] },
  "10499": { label: "🇪🇸 ES + EU", codes: ["ES", ...EU_CODES] },
  "10747": { label: "🇩🇪 DE + EU", codes: ["DE", ...EU_CODES] },
  "evking":{ label: "🇬🇧 UK + EU", codes: ["GB", ...EU_CODES] },
  "67974": { label: "🇺🇸 US only", codes: ["US"] },
  "8626":  { label: "🇧🇪 BE + EU", codes: ["BE","FR","NL", ...EU_CODES] },
  "16673": { label: "🌍 Ships worldwide", codes: ["US","GB","DE","FR","IT","ES","AU","CA"], worldwide: true },
  "16809": { label: "🇩🇪 DE + EU", codes: ["DE", ...EU_CODES] },
  "8794":  { label: "🇳🇴 Norway only", codes: ["NO"] },
  "118045":{ label: "🇬🇧 UK + EU", codes: ["GB", ...EU_CODES] },
  "104933":{ label: "🇬🇧 UK + EU", codes: ["GB", ...EU_CODES] },
  "30295": { label: "🇬🇧 UK only", codes: ["GB"] },
};

export function getSupplierShipping(supplier: Supplier): ShippingInfo {
  const key = supplier.mid ? String(supplier.mid) : supplier.id;
  return SHIPS_TO[key] ?? { label: "🌍 Ships internationally", codes: supplier.countries, worldwide: false };
}

/** Sort priority: ships-to-country (0), worldwide (1), other (2). */
export function shippingPriority(supplier: Supplier, countryCode: string): number {
  const info = getSupplierShipping(supplier);
  if (countryCode && countryCode !== "GLOBAL" && info.codes.includes(countryCode)) return 0;
  if (info.worldwide) return 1;
  return 2;
}

/** Map a free-text supplier name (from feeds) to ISO-2 country codes. */
export function lookupSupplierCountries(name: string): string[] {
  if (!name) return [];
  const lower = name.toLowerCase();
  const match = SUPPLIERS.find(s =>
    lower.includes(s.name.toLowerCase()) ||
    s.name.toLowerCase().includes(lower) ||
    lower.includes(s.id),
  );
  return match?.countries ?? [];
}
