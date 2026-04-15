/**
 * Detect manufacturing country from the first character of a VIN.
 * Returns the country info with the appropriate eBay marketplace ID.
 */
export interface VinCountryInfo {
  code: string;
  name: string;
  ebayMarketplace: string;
  ebayDomain: string;
  mkrid: string;
  fallback?: boolean; // true if we redirect to a different eBay site
  fallbackNote?: string;
}

export function getCountryFromVIN(vin: string): VinCountryInfo {
  const first = vin[0]?.toUpperCase();

  if (["1", "2", "3", "4", "5"].includes(first))
    return { code: "US", name: "United States", ebayMarketplace: "EBAY_US", ebayDomain: "ebay.com", mkrid: "711-53200-19255-0" };

  if (first === "J")
    return { code: "JP", name: "Japan", ebayMarketplace: "EBAY_GB", ebayDomain: "ebay.co.uk", mkrid: "710-53481-19255-0", fallback: true, fallbackNote: "Japanese eBay listings coming soon — showing UK eBay results" };

  if (first === "K")
    return { code: "KR", name: "South Korea", ebayMarketplace: "EBAY_US", ebayDomain: "ebay.com", mkrid: "711-53200-19255-0", fallback: true, fallbackNote: "Showing US eBay results for Korean vehicles" };

  if (first === "S")
    return { code: "GB", name: "United Kingdom", ebayMarketplace: "EBAY_GB", ebayDomain: "ebay.co.uk", mkrid: "710-53481-19255-0" };

  if (first === "W")
    return { code: "DE", name: "Germany", ebayMarketplace: "EBAY_DE", ebayDomain: "ebay.de", mkrid: "707-53477-19255-0" };

  if (first === "V")
    return { code: "FR", name: "France", ebayMarketplace: "EBAY_FR", ebayDomain: "ebay.fr", mkrid: "709-53476-19255-0" };

  if (first === "Z")
    return { code: "IT", name: "Italy", ebayMarketplace: "EBAY_IT", ebayDomain: "ebay.it", mkrid: "724-53478-19255-0" };

  if (first === "Y")
    return { code: "SE", name: "Sweden", ebayMarketplace: "EBAY_GB", ebayDomain: "ebay.co.uk", mkrid: "710-53481-19255-0", fallback: true, fallbackNote: "Showing UK eBay results for Swedish vehicles" };

  if (first === "L")
    return { code: "CN", name: "China", ebayMarketplace: "EBAY_US", ebayDomain: "ebay.com", mkrid: "711-53200-19255-0", fallback: true, fallbackNote: "Showing US eBay results for Chinese vehicles" };

  if (first === "9")
    return { code: "BR", name: "Brazil", ebayMarketplace: "EBAY_US", ebayDomain: "ebay.com", mkrid: "711-53200-19255-0", fallback: true, fallbackNote: "Showing US eBay results for Brazilian vehicles" };

  // Default to UK
  return { code: "GB", name: "United Kingdom", ebayMarketplace: "EBAY_GB", ebayDomain: "ebay.co.uk", mkrid: "710-53481-19255-0" };
}
