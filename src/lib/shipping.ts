// Shipping region helper for the marketplace.
// Regions stored on seller_profiles.ships_to as text[]: 'UK' | 'EU' | 'Worldwide'

export type ShippingRegion = "UK" | "EU" | "Worldwide";
export type BuyerLocation = "any" | "uk" | "eu" | "other";

export const SHIPPING_REGIONS: ShippingRegion[] = ["UK", "EU", "Worldwide"];

/** Short badge for listing cards */
export function shippingBadge(shipsTo: string[] | null | undefined): { icon: string; label: string } {
  const r = (shipsTo || []).map(s => s.toUpperCase());
  if (r.includes("WORLDWIDE")) return { icon: "🌍", label: "Worldwide" };
  if (r.includes("UK") && r.includes("EU")) return { icon: "🇬🇧🇪🇺", label: "UK & EU" };
  if (r.includes("EU")) return { icon: "🇪🇺", label: "EU only" };
  return { icon: "🇬🇧", label: "UK only" };
}

/** Long human label for detail page */
export function shippingLongLabel(shipsTo: string[] | null | undefined): string {
  const r = (shipsTo || []).map(s => s.toUpperCase());
  const parts: string[] = [];
  if (r.includes("UK")) parts.push("UK");
  if (r.includes("EU")) parts.push("Europe");
  if (r.includes("WORLDWIDE")) parts.push("Worldwide");
  return parts.length ? parts.join(", ") : "UK";
}

/** Does this seller ship to the buyer's selected location? */
export function shipsToBuyer(shipsTo: string[] | null | undefined, buyer: BuyerLocation): boolean {
  if (buyer === "any") return true;
  const r = (shipsTo || []).map(s => s.toUpperCase());
  if (r.includes("WORLDWIDE")) return true;
  if (buyer === "uk") return r.includes("UK");
  if (buyer === "eu") return r.includes("EU");
  // "other" — only worldwide sellers reach
  return false;
}
