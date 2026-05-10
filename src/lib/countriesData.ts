// Master country list with ISO-2 codes and flag emojis.
// Used by the seller "Ships to" multi-select and elsewhere.

export interface CountryEntry {
  code: string;   // ISO-2 (e.g. "GB"). Special: "WW" used internally for Worldwide marker (not stored).
  name: string;
  flag: string;
}

// Full set – ISO 3166-1 alpha-2 (subset covering common shipping destinations).
const ALL: CountryEntry[] = [
  { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
  { code: "DE", name: "Germany", flag: "🇩🇪" },
  { code: "FR", name: "France", flag: "🇫🇷" },
  { code: "IT", name: "Italy", flag: "🇮🇹" },
  { code: "ES", name: "Spain", flag: "🇪🇸" },
  { code: "NL", name: "Netherlands", flag: "🇳🇱" },
  { code: "PL", name: "Poland", flag: "🇵🇱" },
  { code: "BE", name: "Belgium", flag: "🇧🇪" },
  { code: "AU", name: "Australia", flag: "🇦🇺" },
  { code: "CA", name: "Canada", flag: "🇨🇦" },
  { code: "US", name: "United States", flag: "🇺🇸" },
  { code: "TR", name: "Turkey", flag: "🇹🇷" },
  { code: "AE", name: "United Arab Emirates", flag: "🇦🇪" },
  { code: "AR", name: "Argentina", flag: "🇦🇷" },
  { code: "AT", name: "Austria", flag: "🇦🇹" },
  { code: "BG", name: "Bulgaria", flag: "🇧🇬" },
  { code: "BR", name: "Brazil", flag: "🇧🇷" },
  { code: "CH", name: "Switzerland", flag: "🇨🇭" },
  { code: "CL", name: "Chile", flag: "🇨🇱" },
  { code: "CN", name: "China", flag: "🇨🇳" },
  { code: "CO", name: "Colombia", flag: "🇨🇴" },
  { code: "CY", name: "Cyprus", flag: "🇨🇾" },
  { code: "CZ", name: "Czech Republic", flag: "🇨🇿" },
  { code: "DK", name: "Denmark", flag: "🇩🇰" },
  { code: "EE", name: "Estonia", flag: "🇪🇪" },
  { code: "EG", name: "Egypt", flag: "🇪🇬" },
  { code: "FI", name: "Finland", flag: "🇫🇮" },
  { code: "GR", name: "Greece", flag: "🇬🇷" },
  { code: "HK", name: "Hong Kong", flag: "🇭🇰" },
  { code: "HR", name: "Croatia", flag: "🇭🇷" },
  { code: "HU", name: "Hungary", flag: "🇭🇺" },
  { code: "ID", name: "Indonesia", flag: "🇮🇩" },
  { code: "IE", name: "Ireland", flag: "🇮🇪" },
  { code: "IL", name: "Israel", flag: "🇮🇱" },
  { code: "IN", name: "India", flag: "🇮🇳" },
  { code: "IS", name: "Iceland", flag: "🇮🇸" },
  { code: "JP", name: "Japan", flag: "🇯🇵" },
  { code: "KR", name: "South Korea", flag: "🇰🇷" },
  { code: "LT", name: "Lithuania", flag: "🇱🇹" },
  { code: "LU", name: "Luxembourg", flag: "🇱🇺" },
  { code: "LV", name: "Latvia", flag: "🇱🇻" },
  { code: "MA", name: "Morocco", flag: "🇲🇦" },
  { code: "MT", name: "Malta", flag: "🇲🇹" },
  { code: "MX", name: "Mexico", flag: "🇲🇽" },
  { code: "MY", name: "Malaysia", flag: "🇲🇾" },
  { code: "NG", name: "Nigeria", flag: "🇳🇬" },
  { code: "NO", name: "Norway", flag: "🇳🇴" },
  { code: "NZ", name: "New Zealand", flag: "🇳🇿" },
  { code: "PE", name: "Peru", flag: "🇵🇪" },
  { code: "PH", name: "Philippines", flag: "🇵🇭" },
  { code: "PT", name: "Portugal", flag: "🇵🇹" },
  { code: "RO", name: "Romania", flag: "🇷🇴" },
  { code: "RS", name: "Serbia", flag: "🇷🇸" },
  { code: "RU", name: "Russia", flag: "🇷🇺" },
  { code: "SA", name: "Saudi Arabia", flag: "🇸🇦" },
  { code: "SE", name: "Sweden", flag: "🇸🇪" },
  { code: "SG", name: "Singapore", flag: "🇸🇬" },
  { code: "SI", name: "Slovenia", flag: "🇸🇮" },
  { code: "SK", name: "Slovakia", flag: "🇸🇰" },
  { code: "TH", name: "Thailand", flag: "🇹🇭" },
  { code: "TW", name: "Taiwan", flag: "🇹🇼" },
  { code: "UA", name: "Ukraine", flag: "🇺🇦" },
  { code: "VN", name: "Vietnam", flag: "🇻🇳" },
  { code: "ZA", name: "South Africa", flag: "🇿🇦" },
];

// EU member countries (ISO-2)
export const EU_CODES = [
  "AT","BE","BG","HR","CY","CZ","DK","EE","FI","FR","DE","GR","HU","IE","IT",
  "LV","LT","LU","MT","NL","PL","PT","RO","SK","SI","ES","SE",
];

// Popular pinned (per spec)
export const POPULAR_CODES = [
  "GB","DE","FR","IT","ES","NL","PL","BE","AU","CA","US","TR",
];

const POPULAR_SET = new Set(POPULAR_CODES);

// Returns countries with popular ones first, rest alphabetical by name.
export const COUNTRY_LIST: CountryEntry[] = (() => {
  const popular = POPULAR_CODES
    .map(code => ALL.find(c => c.code === code))
    .filter((c): c is CountryEntry => !!c);
  const rest = ALL
    .filter(c => !POPULAR_SET.has(c.code))
    .sort((a, b) => a.name.localeCompare(b.name));
  return [...popular, ...rest];
})();

export const ALL_CODES = COUNTRY_LIST.map(c => c.code);

const BY_CODE: Record<string, CountryEntry> = Object.fromEntries(
  COUNTRY_LIST.map(c => [c.code, c]),
);

export function getCountry(code: string): CountryEntry | undefined {
  return BY_CODE[code?.toUpperCase()];
}

export function countryLabel(code: string): string {
  const c = getCountry(code);
  return c ? `${c.flag} ${c.name}` : code;
}

// Normalize legacy ships_to values ("UK", "EU", "Worldwide") to ISO-2 code arrays.
export function normalizeShipsToCodes(input: string[] | null | undefined): string[] {
  if (!input || input.length === 0) return ["GB"];
  const out = new Set<string>();
  for (const raw of input) {
    if (!raw) continue;
    const v = raw.trim();
    const upper = v.toUpperCase();
    if (upper === "UK") { out.add("GB"); continue; }
    if (upper === "EU") { EU_CODES.forEach(c => out.add(c)); continue; }
    if (upper === "WORLDWIDE" || upper === "WW") { ALL_CODES.forEach(c => out.add(c)); continue; }
    if (upper.length === 2 && BY_CODE[upper]) { out.add(upper); continue; }
    // Try matching by name
    const match = COUNTRY_LIST.find(c => c.name.toLowerCase() === v.toLowerCase());
    if (match) out.add(match.code);
  }
  if (out.size === 0) out.add("GB");
  return Array.from(out);
}

export function isWorldwide(codes: string[]): boolean {
  return ALL_CODES.every(c => codes.includes(c));
}

export function isEuOnly(codes: string[]): boolean {
  if (codes.length !== EU_CODES.length) return false;
  return EU_CODES.every(c => codes.includes(c));
}

export function isUkOnly(codes: string[]): boolean {
  return codes.length === 1 && codes[0] === "GB";
}
