export interface EbayDeal {
  brand: string;
  label: string;
  discount: string;
  url: string;
}

export const EBAY_DEALS: EbayDeal[] = [
  { brand: 'BMW', label: 'BMW Parts', discount: 'At least 10% off', url: 'https://www.ebay.co.uk/e/motors/m-deals-bmw?mkcid=1&mkrid=710-53481-19255-0&siteid=3&campid=5339148333&toolid=20014&customid=partara&mkevt=1' },
  { brand: 'Vauxhall', label: 'Vauxhall Parts', discount: 'At least 10% off', url: 'https://www.ebay.co.uk/e/motors/m-deals-vauxhall?mkcid=1&mkrid=710-53481-19255-0&siteid=3&campid=5339148333&toolid=20014&customid=partara&mkevt=1' },
  { brand: 'Mini', label: 'MINI Parts', discount: 'At least 10% off', url: 'https://www.ebay.co.uk/e/motors/m-deals-mini?mkcid=1&mkrid=710-53481-19255-0&siteid=3&campid=5339148333&toolid=20014&customid=partara&mkevt=1' },
  { brand: 'Ford', label: 'Ford Parts', discount: 'At least 10% off', url: 'https://www.ebay.co.uk/e/motors/m-deals-ford?mkcid=1&mkrid=710-53481-19255-0&siteid=3&campid=5339148333&toolid=20014&customid=partara&mkevt=1' },
  { brand: 'Land Rover', label: 'Land Rover Parts', discount: 'At least 10% off', url: 'https://www.ebay.co.uk/e/motors/m-deals-land-rover?mkcid=1&mkrid=710-53481-19255-0&siteid=3&campid=5339148333&toolid=20014&customid=partara&mkevt=1' },
  { brand: 'Honda', label: 'Honda Parts', discount: 'At least 10% off', url: 'https://www.ebay.co.uk/e/motors/m-deals-honda?mkcid=1&mkrid=710-53481-19255-0&siteid=3&campid=5339148333&toolid=20014&customid=partara&mkevt=1' },
  { brand: 'Nissan', label: 'Nissan Parts', discount: 'At least 10% off', url: 'https://www.ebay.co.uk/e/motors/m-deals-nissan?mkcid=1&mkrid=710-53481-19255-0&siteid=3&campid=5339148333&toolid=20014&customid=partara&mkevt=1' },
  { brand: 'Peugeot', label: 'Peugeot Parts', discount: 'At least 10% off', url: 'https://www.ebay.co.uk/e/motors/m-deals-peugeot?mkcid=1&mkrid=710-53481-19255-0&siteid=3&campid=5339148333&toolid=20014&customid=partara&mkevt=1' },
  { brand: 'Renault', label: 'Renault Parts', discount: 'At least 10% off', url: 'https://www.ebay.co.uk/e/motors/m-deals-renault?mkcid=1&mkrid=710-53481-19255-0&siteid=3&campid=5339148333&toolid=20014&customid=partara&mkevt=1' },
  { brand: 'Hyundai', label: 'Hyundai Parts', discount: 'At least 10% off', url: 'https://www.ebay.co.uk/e/motors/m-deals-hyundai?mkcid=1&mkrid=710-53481-19255-0&siteid=3&campid=5339148333&toolid=20014&customid=partara&mkevt=1' },
];

export const EBAY_ALL_DEALS_URL = 'https://www.ebay.co.uk/deals/automotive?mkcid=1&mkrid=710-53481-19255-0&siteid=3&campid=5339148333&toolid=20014&customid=partara&mkevt=1';

export function findDealByBrand(query: string): EbayDeal | undefined {
  return EBAY_DEALS.find(d => query.toLowerCase().includes(d.brand.toLowerCase()));
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
