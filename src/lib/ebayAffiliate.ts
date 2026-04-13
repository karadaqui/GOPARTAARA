/**
 * Build eBay Partner Network affiliate URL from any eBay listing URL.
 * Campaign ID: 5339059463 | Custom ID: partara | Publisher ID: 5575378759
 */
export function buildEbayAffiliateUrl(originalEbayUrl: string): string {
  try {
    const itemIdMatch = originalEbayUrl.match(/\/itm\/(\d+)/);
    if (itemIdMatch) {
      const itemId = itemIdMatch[1];
      return `https://rover.ebay.com/rover/1/711-53200-19255-0/1?icep_id=114&ipn=icep&toolid=20004&campid=5339059463&ipn=icep&vectorid=229508&lgeo=1&customid=partara&item=${itemId}&ff3=4&pub=5575378759`;
    }
  } catch {
    // fall through to fallback
  }
  return `https://rover.ebay.com/rover/1/711-53200-19255-0/1?mpre=${encodeURIComponent(originalEbayUrl)}&campid=5339059463&customid=partara&toolid=10001&pub=5575378759`;
}
