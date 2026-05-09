// Free address-lookup helpers: postcodes.io for UK postcodes, Photon for everything else.
// Both APIs are public, key-less, CORS-enabled — safe to call from the browser.

export type AddressSuggestion = {
  label: string;        // human readable
  street1?: string;
  city?: string;
  county?: string;
  postcode?: string;
  country?: string;     // ISO-2
};

/** Normalise a UK postcode lookup. Returns at most one address (with city/county). */
export async function lookupUKPostcode(postcode: string): Promise<AddressSuggestion[]> {
  const clean = postcode.trim().replace(/\s+/g, "");
  if (clean.length < 3) return [];
  try {
    const r = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(clean)}`);
    if (!r.ok) return [];
    const j = await r.json();
    const d = j?.result;
    if (!d) return [];
    return [{
      label: `${d.postcode} — ${d.admin_ward || d.parish || ""}, ${d.admin_district || d.region}`,
      street1: "",
      city: d.post_town || d.admin_district || "",
      county: d.admin_county || d.region || "",
      postcode: d.postcode || "",
      country: "GB",
    }];
  } catch { return []; }
}

const ISO_BY_COUNTRY: Record<string, string> = {
  "United Kingdom": "GB", "England": "GB", "Scotland": "GB", "Wales": "GB", "Northern Ireland": "GB",
  "United States": "US", "USA": "US", "Ireland": "IE", "France": "FR", "Germany": "DE", "Spain": "ES",
  "Italy": "IT", "Netherlands": "NL", "Belgium": "BE", "Portugal": "PT", "Poland": "PL",
  "Sweden": "SE", "Denmark": "DK", "Norway": "NO", "Finland": "FI", "Austria": "AT", "Switzerland": "CH",
  "Australia": "AU", "Canada": "CA", "New Zealand": "NZ",
};

/** Worldwide free-text address search via Photon (komoot). */
export async function searchPhoton(query: string): Promise<AddressSuggestion[]> {
  const q = query.trim();
  if (q.length < 3) return [];
  try {
    const r = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=5`);
    if (!r.ok) return [];
    const j = await r.json();
    const feats = Array.isArray(j?.features) ? j.features : [];
    return feats.map((f: any): AddressSuggestion => {
      const p = f.properties || {};
      const street = [p.housenumber, p.street].filter(Boolean).join(" ");
      const labelParts = [p.name, street, p.city || p.town || p.village, p.postcode, p.country].filter(Boolean);
      return {
        label: labelParts.join(", "),
        street1: street || p.name || "",
        city: p.city || p.town || p.village || "",
        county: p.state || p.county || "",
        postcode: p.postcode || "",
        country: p.countrycode?.toUpperCase() || ISO_BY_COUNTRY[p.country] || "",
      };
    }).filter((a: AddressSuggestion) => a.label.length > 0);
  } catch { return []; }
}
