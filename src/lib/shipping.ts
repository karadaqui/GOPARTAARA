// Shipping region helper for the marketplace.
// ships_to is stored on seller_profiles as text[].
// New format: ISO-2 country codes (e.g. "GB","DE","FR").
// Legacy format: "UK" | "EU" | "Worldwide" — still supported for read.

import { EU_CODES, ALL_CODES, normalizeShipsToCodes, getCountry, isWorldwide, isEuOnly, isUkOnly } from "./countriesData";

export type ShippingRegion = "UK" | "EU" | "Worldwide";
export type BuyerLocation = "any" | "uk" | "eu" | "other";

export const SHIPPING_REGIONS: ShippingRegion[] = ["UK", "EU", "Worldwide"];

/** Short badge for listing cards */
export function shippingBadge(shipsTo: string[] | null | undefined): { icon: string; label: string } {
  const codes = normalizeShipsToCodes(shipsTo);
  if (isWorldwide(codes)) return { icon: "🌍", label: "Worldwide" };
  if (isEuOnly(codes)) return { icon: "🇪🇺", label: "EU only" };
  if (isUkOnly(codes)) return { icon: "🇬🇧", label: "UK only" };
  if (codes.includes("GB") && EU_CODES.every(c => codes.includes(c))) {
    return { icon: "🇬🇧🇪🇺", label: "UK & EU" };
  }
  if (codes.length <= 3) {
    const flags = codes.map(c => getCountry(c)?.flag || "").join("");
    return { icon: flags || "🌍", label: `${codes.length} countries` };
  }
  return { icon: "🌍", label: `${codes.length} countries` };
}

/** Long human label for detail page */
export function shippingLongLabel(shipsTo: string[] | null | undefined): string {
  const codes = normalizeShipsToCodes(shipsTo);
  if (isWorldwide(codes)) return "Worldwide";
  if (isEuOnly(codes)) return "Europe (EU)";
  if (isUkOnly(codes)) return "UK only";
  if (codes.includes("GB") && EU_CODES.every(c => codes.includes(c))) return "UK & Europe";
  if (codes.length <= 6) {
    return codes.map(c => getCountry(c)?.name || c).join(", ");
  }
  return `${codes.length} countries`;
}

/** Does this seller ship to the buyer's selected location? */
export function shipsToBuyer(shipsTo: string[] | null | undefined, buyer: BuyerLocation): boolean {
  if (buyer === "any") return true;
  const codes = normalizeShipsToCodes(shipsTo);
  if (isWorldwide(codes)) return true;
  if (buyer === "uk") return codes.includes("GB");
  if (buyer === "eu") return EU_CODES.some(c => codes.includes(c));
  // "other" — only if seller has at least one non-UK / non-EU country
  return codes.some(c => c !== "GB" && !EU_CODES.includes(c));
}
