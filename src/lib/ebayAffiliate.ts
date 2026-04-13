/**
 * Build eBay Partner Network affiliate URL from any eBay listing URL.
 * Uses simple mpre redirect - works for ALL eBay country sites.
 * Campaign ID: 5339148333 | Custom ID: partara
 */
export function buildEbayAffiliateUrl(originalUrl: string): string {
  if (!originalUrl) return '#';
  
  try {
    // Simple mpre redirect - works for ALL eBay country sites
    const encoded = encodeURIComponent(originalUrl);
    return `https://rover.ebay.com/rover/1/711-53200-19255-0/1?mpre=${encoded}&campid=5339148333&customid=partara&toolid=10001`;
  } catch (e) {
    return originalUrl;
  }
}
