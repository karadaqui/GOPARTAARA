export interface EbayDeal {
  id: string;
  type: 'brand' | 'category' | 'tools';
  brand: string | null;
  label: string;
  discount: string;
  description: string;
  expiryDate: string | null;
  url: string;
}

export const EBAY_DEALS: EbayDeal[] = [
  // ═══ CAR BRAND DEALS ═══
  { id: 'bmw', type: 'brand', brand: 'BMW', label: 'BMW Parts', discount: 'At least 10% off', description: 'Genuine & aftermarket BMW parts', expiryDate: null, url: 'https://www.ebay.co.uk/e/motors/m-deals-bmw?mkcid=1&mkrid=710-53481-19255-0&siteid=3&campid=5339148333&toolid=20014&customid=partara&mkevt=1' },
  { id: 'vauxhall', type: 'brand', brand: 'Vauxhall', label: 'Vauxhall Parts', discount: 'At least 10% off', description: 'Parts for all Vauxhall models', expiryDate: null, url: 'https://www.ebay.co.uk/e/motors/m-deals-vauxhall?mkcid=1&mkrid=710-53481-19255-0&siteid=3&campid=5339148333&toolid=20014&customid=partara&mkevt=1' },
  { id: 'mini', type: 'brand', brand: 'Mini', label: 'MINI Parts', discount: 'At least 10% off', description: 'Genuine MINI & Cooper parts', expiryDate: null, url: 'https://www.ebay.co.uk/e/motors/m-deals-mini?mkcid=1&mkrid=710-53481-19255-0&siteid=3&campid=5339148333&toolid=20014&customid=partara&mkevt=1' },
  { id: 'ford', type: 'brand', brand: 'Ford', label: 'Ford Parts', discount: 'At least 10% off', description: 'Ford & Transit parts on sale', expiryDate: null, url: 'https://www.ebay.co.uk/e/motors/m-deals-ford?mkcid=1&mkrid=710-53481-19255-0&siteid=3&campid=5339148333&toolid=20014&customid=partara&mkevt=1' },
  { id: 'landrover', type: 'brand', brand: 'Land Rover', label: 'Land Rover Parts', discount: 'At least 10% off', description: 'Defender, Discovery & Range Rover', expiryDate: null, url: 'https://www.ebay.co.uk/e/motors/m-deals-land-rover?mkcid=1&mkrid=710-53481-19255-0&siteid=3&campid=5339148333&toolid=20014&customid=partara&mkevt=1' },
  { id: 'honda', type: 'brand', brand: 'Honda', label: 'Honda Parts', discount: 'At least 10% off', description: 'Civic, Jazz, CR-V parts', expiryDate: null, url: 'https://www.ebay.co.uk/e/motors/m-deals-honda?mkcid=1&mkrid=710-53481-19255-0&siteid=3&campid=5339148333&toolid=20014&customid=partara&mkevt=1' },
  { id: 'nissan', type: 'brand', brand: 'Nissan', label: 'Nissan Parts', discount: 'At least 10% off', description: 'Qashqai, Juke & more', expiryDate: null, url: 'https://www.ebay.co.uk/e/motors/m-deals-nissan?mkcid=1&mkrid=710-53481-19255-0&siteid=3&campid=5339148333&toolid=20014&customid=partara&mkevt=1' },
  { id: 'peugeot', type: 'brand', brand: 'Peugeot', label: 'Peugeot Parts', discount: 'At least 10% off', description: '207, 308, 3008 & more', expiryDate: null, url: 'https://www.ebay.co.uk/e/motors/m-deals-peugeot?mkcid=1&mkrid=710-53481-19255-0&siteid=3&campid=5339148333&toolid=20014&customid=partara&mkevt=1' },
  { id: 'renault', type: 'brand', brand: 'Renault', label: 'Renault Parts', discount: 'At least 10% off', description: 'Clio, Megane, Kadjar parts', expiryDate: null, url: 'https://www.ebay.co.uk/e/motors/m-deals-renault?mkcid=1&mkrid=710-53481-19255-0&siteid=3&campid=5339148333&toolid=20014&customid=partara&mkevt=1' },
  { id: 'hyundai', type: 'brand', brand: 'Hyundai', label: 'Hyundai Parts', discount: 'At least 10% off', description: 'i10, i20, Tucson & more', expiryDate: null, url: 'https://www.ebay.co.uk/e/motors/m-deals-hyundai?mkcid=1&mkrid=710-53481-19255-0&siteid=3&campid=5339148333&toolid=20014&customid=partara&mkevt=1' },

  // ═══ TIME-LIMITED SALES ═══
  { id: 'braking-suspension', type: 'category', brand: null, label: '20% off Braking & Suspension', discount: '20% off', description: 'From Motor World Direct', expiryDate: '2026-04-24T10:00:00Z', url: 'https://www.ebay.co.uk/str/motorworlddirect?mkcid=1&mkrid=710-53481-19255-0&siteid=3&campid=5339148333&toolid=20014&customid=partara&mkevt=1' },
  { id: 'spray-cleaning', type: 'category', brand: null, label: '20% off Spray Paints & Cleaning', discount: '20% off', description: 'From Motor World Direct', expiryDate: '2026-04-24T10:00:00Z', url: 'https://www.ebay.co.uk/str/motorworlddirect?mkcid=1&mkrid=710-53481-19255-0&siteid=3&campid=5339148333&toolid=20014&customid=partara&mkevt=1' },
  { id: 'vehicle-essentials', type: 'category', brand: null, label: '20% off Vehicle Essentials', discount: '20% off', description: 'From Sparesworld Direct', expiryDate: '2026-04-24T10:00:00Z', url: 'https://www.ebay.co.uk/str/sparesworlddirect?mkcid=1&mkrid=710-53481-19255-0&siteid=3&campid=5339148333&toolid=20014&customid=partara&mkevt=1' },
  { id: 't-cut', type: 'brand', brand: 'T-Cut', label: '20% off T-Cut', discount: '20% off', description: 'Scratch remover & paint restorer', expiryDate: '2026-04-24T10:00:00Z', url: 'https://www.ebay.co.uk/str/tcut?mkcid=1&mkrid=710-53481-19255-0&siteid=3&campid=5339148333&toolid=20014&customid=partara&mkevt=1' },

  // ═══ TOOLS & GARAGE EQUIPMENT ═══
  { id: 'tools-50off', type: 'tools', brand: null, label: '50% off Tools & Equipment', discount: 'Up to 50% off', description: 'Goodyear, Makita & more', expiryDate: null, url: 'https://www.ebay.co.uk/deals/automotive/garage-equipment-tools?mkcid=1&mkrid=710-53481-19255-0&siteid=3&campid=5339148333&toolid=20014&customid=partara&mkevt=1' },
  { id: 'diagnostic-25off', type: 'tools', brand: null, label: '25% off Diagnostic Equipment', discount: '25% off', description: 'OBD scanners & garage essentials', expiryDate: null, url: 'https://www.ebay.co.uk/deals/automotive/garage-equipment-tools?mkcid=1&mkrid=710-53481-19255-0&siteid=3&campid=5339148333&toolid=20014&customid=partara&mkevt=1' },
  { id: 'toolbox-storage', type: 'tools', brand: null, label: 'Tool Box & Storage Sale', discount: 'Big savings', description: 'Organisers, chests & more', expiryDate: null, url: 'https://www.ebay.co.uk/deals/automotive/garage-equipment-tools?mkcid=1&mkrid=710-53481-19255-0&siteid=3&campid=5339148333&toolid=20014&customid=partara&mkevt=1' },

  // ═══ OTHER AUTOMOTIVE DEALS ═══
  { id: 'oils-fluids', type: 'category', brand: null, label: 'Up to 50% off Oils & Fluids', discount: 'Up to 50% off', description: 'Shell, Mannol, Quantum & more', expiryDate: null, url: 'https://www.ebay.co.uk/deals/automotive/oils-and-fluids?mkcid=1&mkrid=710-53481-19255-0&siteid=3&campid=5339148333&toolid=20014&customid=partara&mkevt=1' },
  { id: 'car-care', type: 'category', brand: null, label: 'Up to 45% off Car Care', discount: 'Up to 45% off', description: 'T-Cut, Goodyear, CarPlan & more', expiryDate: null, url: 'https://www.ebay.co.uk/deals/automotive/car-care-utility-and-trailers?mkcid=1&mkrid=710-53481-19255-0&siteid=3&campid=5339148333&toolid=20014&customid=partara&mkevt=1' },
  { id: 'dash-cams', type: 'category', brand: null, label: 'Up to 20% off Dash Cams', discount: 'Up to 20% off', description: 'Goodyear, REDTIGER & more', expiryDate: null, url: 'https://www.ebay.co.uk/deals/automotive/car-electronics?mkcid=1&mkrid=710-53481-19255-0&siteid=3&campid=5339148333&toolid=20014&customid=partara&mkevt=1' },
  { id: 'motorcycle', type: 'category', brand: null, label: 'Up to 50% off Motorcycle', discount: 'Up to 50% off', description: 'Jackets, boots, helmets & parts', expiryDate: null, url: 'https://www.ebay.co.uk/deals/automotive/apparel-accessories?mkcid=1&mkrid=710-53481-19255-0&siteid=3&campid=5339148333&toolid=20014&customid=partara&mkevt=1' },
  { id: 'batteries', type: 'category', brand: null, label: 'Vehicle Batteries Under £100', discount: 'Big savings', description: 'Reliable power for car & caravan', expiryDate: null, url: 'https://www.ebay.co.uk/deals/automotive/car-parts-accessories?mkcid=1&mkrid=710-53481-19255-0&siteid=3&campid=5339148333&toolid=20014&customid=partara&mkevt=1' },
];

export const EBAY_ALL_DEALS_URL = 'https://www.ebay.co.uk/deals/automotive?mkcid=1&mkrid=710-53481-19255-0&siteid=3&campid=5339148333&toolid=20014&customid=partara&mkevt=1';

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
