// HS (Harmonized System) codes per marketplace category.
// Used for international shipments via Shippo customs declarations.
export const HS_CODES: Record<string, string> = {
  "Engine Parts": "8409.99",
  "Body Parts": "8708.99",
  "Brakes": "8708.30",
  "Suspension": "8708.80",
  "Electrical": "8708.99",
  "Filters": "8421.31",
  "Exhaust": "8708.92",
  "Interior": "8708.99",
  "Cooling": "8708.99",
  "Transmission": "8708.40",
  "Body Panels": "8708.10",
  "Lighting": "8512.20",
  "Wheels & Tyres": "8708.70",
  "Other": "8708.99",
};

export function hsCodeFor(category?: string | null): string {
  if (!category) return HS_CODES["Other"];
  return HS_CODES[category] || HS_CODES["Other"];
}

// EU member countries for Brexit warning detection.
export const EU_COUNTRY_NAMES = new Set<string>([
  "Austria", "Belgium", "Bulgaria", "Croatia", "Cyprus", "Czech Republic",
  "Denmark", "Estonia", "Finland", "France", "Germany", "Greece",
  "Hungary", "Ireland", "Italy", "Latvia", "Lithuania", "Luxembourg",
  "Malta", "Netherlands", "Poland", "Portugal", "Romania", "Slovakia",
  "Slovenia", "Spain", "Sweden",
]);
export const EU_COUNTRY_ISO = new Set<string>([
  "AT","BE","BG","HR","CY","CZ","DK","EE","FI","FR","DE","GR","HU","IE","IT",
  "LV","LT","LU","MT","NL","PL","PT","RO","SK","SI","ES","SE",
]);
export function isEUCountry(name?: string | null): boolean {
  if (!name) return false;
  return EU_COUNTRY_NAMES.has(name) || EU_COUNTRY_ISO.has(name.toUpperCase());
}
export function isUKCountry(name?: string | null): boolean {
  if (!name) return false;
  const n = name.toLowerCase();
  return n === "united kingdom" || n === "uk" || n === "gb" || n === "great britain";
}
