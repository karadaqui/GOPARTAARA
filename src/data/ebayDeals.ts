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

const EBAY_AFFILIATE_QUERY = 'mkcid=1&mkrid=710-53481-19255-0&siteid=3&campid=5339148333&toolid=20014&customid=partara&mkevt=1';

const withEbayAffiliate = (baseUrl: string) =>
  `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}${EBAY_AFFILIATE_QUERY}`;

export const EBAY_DEALS: EbayDeal[] = [
  {
    id: 'bmw',
    type: 'brand',
    brand: 'BMW',
    label: 'BMW Parts',
    discount: 'At least 20% off',
    description: 'Genuine & aftermarket BMW parts',
    expiryDate: null,
    url: withEbayAffiliate('https://www.ebay.co.uk/e/motors/m-deals-bmw'),
  },
  {
    id: 'vauxhall',
    type: 'brand',
    brand: 'Vauxhall',
    label: 'Vauxhall Parts',
    discount: 'At least 20% off',
    description: 'Parts for all Vauxhall models',
    expiryDate: null,
    url: withEbayAffiliate('https://www.ebay.co.uk/e/motors/m-deals-vauxhall'),
  },
  {
    id: 'mini',
    type: 'brand',
    brand: 'Mini',
    label: 'MINI Parts',
    discount: 'At least 20% off',
    description: 'Genuine MINI & Cooper parts',
    expiryDate: null,
    url: withEbayAffiliate('https://www.ebay.co.uk/e/motors/m-deals-mini'),
  },
  {
    id: 'ford',
    type: 'brand',
    brand: 'Ford',
    label: 'Ford Parts',
    discount: 'At least 20% off',
    description: 'Ford & Transit parts on sale',
    expiryDate: null,
    url: withEbayAffiliate('https://www.ebay.co.uk/e/motors/m-deals-ford'),
  },
  {
    id: 'renault',
    type: 'brand',
    brand: 'Renault',
    label: 'Renault Parts',
    discount: '20% off',
    description: 'Clio, Megane, Kadjar parts',
    expiryDate: null,
    url: withEbayAffiliate('https://www.ebay.co.uk/e/motors/1526-20-off-renault-parts-more'),
  },
  {
    id: 'dacia',
    type: 'brand',
    brand: 'Dacia',
    label: 'Dacia Parts',
    discount: '20% off',
    description: 'Sandero, Duster, Jogger parts',
    expiryDate: null,
    url: withEbayAffiliate('https://www.ebay.co.uk/e/motors/1526-20-off-dacia-parts-accessories'),
  },
  {
    id: 'tools-equipment',
    type: 'tools',
    brand: null,
    label: 'Tools & Equipment',
    discount: 'Up to 50% off',
    description: 'Garage gear, jacks, testers & kits',
    expiryDate: null,
    url: withEbayAffiliate('https://www.ebay.co.uk/deals/automotive/garage-equipment-tools'),
  },
  {
    id: 'toolbox-storage',
    type: 'tools',
    brand: null,
    label: 'Tool Box & Storage',
    discount: 'Big savings',
    description: 'Organisers, chests & workshop storage',
    expiryDate: null,
    url: withEbayAffiliate('https://www.ebay.co.uk/e/motors/m-deals-tools-storage'),
  },
  {
    id: 'car-technology',
    type: 'tools',
    brand: null,
    label: 'Car Technology',
    discount: 'Up to 50% off',
    description: 'Dash cams, sat navs & in-car tech',
    expiryDate: null,
    url: withEbayAffiliate('https://www.ebay.co.uk/e/motors/in-car-technology-deals'),
  },
  {
    id: 'all-deals',
    type: 'all',
    brand: null,
    label: 'All automotive eBay UK Deals',
    discount: 'Browse every deal',
    description: 'Full automotive deals page',
    expiryDate: null,
    url: withEbayAffiliate('https://www.ebay.co.uk/deals/automotive'),
  },
];

export const EBAY_ALL_DEALS_URL = withEbayAffiliate('https://www.ebay.co.uk/deals/automotive');

export function getActiveDeals(): EbayDeal[] {
  const now = new Date();
  return EBAY_DEALS.filter((deal) => {
    if (!deal.expiryDate) return true;
    return new Date(deal.expiryDate) > now;
  });
}

export function findDealByBrand(query: string): EbayDeal | undefined {
  return getActiveDeals().find(
    (deal) => deal.brand && query.toLowerCase().includes(deal.brand.toLowerCase()),
  );
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
