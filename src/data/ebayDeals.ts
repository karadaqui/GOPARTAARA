export interface EbayDeal {
  brand: string;
  discount: string;
  icon: string;
  color: string;
  borderColor: string;
  url: string;
}

export const EBAY_DEALS: EbayDeal[] = [
  { brand: 'BMW', discount: 'At least 10% off', icon: '🚙', color: 'from-blue-900/40 to-blue-800/20', borderColor: 'border-blue-700/30', url: 'https://www.ebay.co.uk/e/motors/m-deals-bmw?mkcid=1&mkrid=710-53481-19255-0&siteid=3&campid=5339148333&toolid=20014&customid=partara&mkevt=1' },
  { brand: 'Vauxhall', discount: 'At least 10% off', icon: '🚗', color: 'from-red-900/40 to-red-800/20', borderColor: 'border-red-700/30', url: 'https://www.ebay.co.uk/e/motors/m-deals-vauxhall?mkcid=1&mkrid=710-53481-19255-0&siteid=3&campid=5339148333&toolid=20014&customid=partara&mkevt=1' },
  { brand: 'Ford', discount: 'At least 10% off', icon: '🚘', color: 'from-blue-900/40 to-indigo-800/20', borderColor: 'border-blue-600/30', url: 'https://www.ebay.co.uk/e/motors/m-deals-ford?mkcid=1&mkrid=710-53481-19255-0&siteid=3&campid=5339148333&toolid=20014&customid=partara&mkevt=1' },
  { brand: 'Mercedes', discount: 'At least 10% off', icon: '⭐', color: 'from-zinc-800/60 to-zinc-700/20', borderColor: 'border-zinc-600/30', url: 'https://www.ebay.co.uk/e/motors/m-deals-mercedes-benz?mkcid=1&mkrid=710-53481-19255-0&siteid=3&campid=5339148333&toolid=20014&customid=partara&mkevt=1' },
  { brand: 'Audi', discount: 'At least 10% off', icon: '🔵', color: 'from-zinc-800/60 to-zinc-700/20', borderColor: 'border-zinc-500/30', url: 'https://www.ebay.co.uk/e/motors/m-deals-audi?mkcid=1&mkrid=710-53481-19255-0&siteid=3&campid=5339148333&toolid=20014&customid=partara&mkevt=1' },
  { brand: 'Toyota', discount: 'At least 10% off', icon: '🚙', color: 'from-red-900/30 to-red-800/10', borderColor: 'border-red-600/30', url: 'https://www.ebay.co.uk/e/motors/m-deals-toyota?mkcid=1&mkrid=710-53481-19255-0&siteid=3&campid=5339148333&toolid=20014&customid=partara&mkevt=1' },
  { brand: 'Volkswagen', discount: 'At least 10% off', icon: '🔷', color: 'from-blue-900/40 to-blue-800/10', borderColor: 'border-blue-500/30', url: 'https://www.ebay.co.uk/e/motors/m-deals-volkswagen?mkcid=1&mkrid=710-53481-19255-0&siteid=3&campid=5339148333&toolid=20014&customid=partara&mkevt=1' },
  { brand: 'Honda', discount: 'At least 10% off', icon: '🏎️', color: 'from-red-900/30 to-zinc-800/20', borderColor: 'border-red-500/30', url: 'https://www.ebay.co.uk/e/motors/m-deals-honda?mkcid=1&mkrid=710-53481-19255-0&siteid=3&campid=5339148333&toolid=20014&customid=partara&mkevt=1' },
  { brand: 'Nissan', discount: 'At least 10% off', icon: '🚗', color: 'from-red-800/30 to-zinc-800/20', borderColor: 'border-red-400/30', url: 'https://www.ebay.co.uk/e/motors/m-deals-nissan?mkcid=1&mkrid=710-53481-19255-0&siteid=3&campid=5339148333&toolid=20014&customid=partara&mkevt=1' },
  { brand: 'Mini', discount: 'At least 10% off', icon: '🚙', color: 'from-zinc-800/40 to-zinc-700/20', borderColor: 'border-zinc-500/30', url: 'https://www.ebay.co.uk/e/motors/m-deals-mini?mkcid=1&mkrid=710-53481-19255-0&siteid=3&campid=5339148333&toolid=20014&customid=partara&mkevt=1' },
  { brand: 'Land Rover', discount: 'At least 10% off', icon: '🚙', color: 'from-green-900/30 to-green-800/10', borderColor: 'border-green-600/30', url: 'https://www.ebay.co.uk/e/motors/m-deals-land-rover?mkcid=1&mkrid=710-53481-19255-0&siteid=3&campid=5339148333&toolid=20014&customid=partara&mkevt=1' },
  { brand: 'Peugeot', discount: 'At least 10% off', icon: '🦁', color: 'from-zinc-800/40 to-zinc-700/10', borderColor: 'border-zinc-500/30', url: 'https://www.ebay.co.uk/e/motors/m-deals-peugeot?mkcid=1&mkrid=710-53481-19255-0&siteid=3&campid=5339148333&toolid=20014&customid=partara&mkevt=1' },
  { brand: 'Renault', discount: 'At least 10% off', icon: '🔷', color: 'from-yellow-900/20 to-zinc-800/20', borderColor: 'border-yellow-600/30', url: 'https://www.ebay.co.uk/e/motors/m-deals-renault?mkcid=1&mkrid=710-53481-19255-0&siteid=3&campid=5339148333&toolid=20014&customid=partara&mkevt=1' },
  { brand: 'Hyundai', discount: 'At least 10% off', icon: '🔵', color: 'from-blue-900/30 to-zinc-800/20', borderColor: 'border-blue-500/30', url: 'https://www.ebay.co.uk/e/motors/m-deals-hyundai?mkcid=1&mkrid=710-53481-19255-0&siteid=3&campid=5339148333&toolid=20014&customid=partara&mkevt=1' },
];

export const EBAY_ALL_DEALS_URL = 'https://www.ebay.co.uk/deals/automotive?mkcid=1&mkrid=710-53481-19255-0&siteid=3&campid=5339148333&toolid=20014&customid=partara&mkevt=1';

export function findDealByBrand(query: string): EbayDeal | undefined {
  return EBAY_DEALS.find(d => query.toLowerCase().includes(d.brand.toLowerCase()));
}
