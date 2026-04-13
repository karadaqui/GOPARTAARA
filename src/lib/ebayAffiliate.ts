/**
 * Build eBay Partner Network affiliate URL from any eBay listing URL.
 * Applies direct EPN tracking params to the destination URL.
 * Campaign ID: 5339148333 | Custom ID: partara
 */
export function buildEbayAffiliateUrl(originalUrl: string): string {
  if (!originalUrl) return '#';

  try {
    const url = new URL(originalUrl);
    url.searchParams.set('mkcid', '1');
    url.searchParams.set('mkrid', '711-53200-19255-0');
    url.searchParams.set('siteid', '3');
    url.searchParams.set('campid', '5339148333');
    url.searchParams.set('customid', 'partara');
    url.searchParams.set('toolid', '10001');
    url.searchParams.set('mkevt', '1');
    return url.toString();
  } catch {
    return originalUrl;
  }
}
