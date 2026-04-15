export interface EbayDeal {
  id: string;
  type: 'brand' | 'tools' | 'all';
  brand: string | null;
  label: string;
  discount: string;
  description: string;
  expiryDate: string | null;
  url: string;
}

const AFF = 'mkcid=1&mkrid=710-53481-19255-0&siteid=3&campid=5339148333&toolid=20014&customid=partara&mkevt=1';

export const EBAY_DEALS: EbayDeal[] = [
  { id: 'bmw', type: 'brand', brand: 'BMW', label: 'BMW Parts', discount: 'At least 10% off', description: 'Genuine & aftermarket BMW parts', expiryDate: null, url: `https://www.ebay.co.uk/e/motors/m-deals-bmw?${AFF}` },
  { id: 'vauxhall', type: 'brand', brand: 'Vauxhall', label: 'Vauxhall Parts', discount: 'At least 10% off', description: 'Parts for all Vauxhall models', expiryDate: null, url: `https://www.ebay.co.uk/e/motors/m-deals-vauxhall?${AFF}` },
  { id: 'mini', type: 'brand', brand: 'Mini', label: 'MINI Parts', discount: 'At least 10% off', description: 'Genuine MINI & Cooper parts', expiryDate: null, url: `https://www.ebay.co.uk/e/motors/m-deals-mini?${AFF}` },
  { id: 'ford', type: 'brand', brand: 'Ford', label: 'Ford Parts', discount: 'At least 10% off', description: 'Ford & Transit parts on sale', expiryDate: null, url: `https://www.ebay.co.uk/e/motors/m-deals-ford?${AFF}` },
  { id: 'renault', type: 'brand', brand: 'Renault', label: 'Renault Parts', discount: '20% off', description: 'Clio, Megane, Kadjar parts', expiryDate: null, url: `https://www.ebay.co.uk/e/motors/1526-20-off-renault-parts-more?${AFF}` },
  { id: 'dacia', type: 'brand', brand: 'Dacia', label: 'Dacia Parts', discount: '20% off', description: 'Sandero, Duster, Jogger parts', expiryDate: null, url: `https://www.ebay.co.uk/e/motors/1526-20-off-dacia-parts-accessories?${AFF}` },
  { id: 'tools-equipment', type: 'tools', brand: null, label: 'Tools & Equipment', discount: 'Up to 50% off', description: 'Goodyear, Makita & more', expiryDate: null, url: `https://www.ebay.co.uk/deals/automotive/garage-equipment-tools?${AFF}` },
  { id: 'toolbox-storage', type: 'tools', brand: null, label: 'Tool Box & Storage', discount: 'Big savings', description: 'Organisers, chests & more', expiryDate: null, url: `https://www.ebay.co.uk/e/motors/m-deals-tools-storage?${AFF}` },
  { id: 'all-deals', type: 'all', brand: null, label: 'All eBay UK Deals', discount: 'Browse all', description: 'Full automotive deals page', expiryDate: null, url: `https://www.ebay.co.uk/deals/automotive?${AFF}` },
];

export const EBAY_ALL_DEALS_URL = `https://www.ebay.co.uk/deals/automotive?${AFF}`;

export function getActiveDeals(): EbayDeal[] {
  const now = new Date();
  return EBAY_DEALS.filter(deal => {
    if (!deal.expiryDate) return true;
    return new Date(deal.expiryDate) > now;
  });
}

export function findDealByBrand(query: string): EbayDeal | undefined {
  return getActiveDeals().find(d => d.brand && query.toLowerCase().includes(d.brand.toLowerCase()));
}

export function isUKUser(): boolean {
  try {
    const selectedMarket = localStorage.getItem('partara_market') || 'GB';
    const locale = navigator.language || '';
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return (
      selectedMarket === 'GB' ||
      locale.includes('en-GB') ||
      timezone === 'Europe/London' ||
      timezone.startsWith('Europe/')
    );
  } catch {
    return false;
  }
}
