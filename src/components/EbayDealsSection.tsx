import { EBAY_DEALS, EBAY_ALL_DEALS_URL, type EbayDeal } from "@/data/ebayDeals";

const DealCard = ({ deal }: { deal: EbayDeal }) => (
  <a
    href={deal.url}
    target="_blank"
    rel="noopener noreferrer"
    className={`flex-shrink-0 w-44 p-4 rounded-2xl border bg-gradient-to-br ${deal.color} ${deal.borderColor} hover:scale-105 hover:shadow-lg hover:shadow-black/30 transition-all duration-200 cursor-pointer group snap-start`}
  >
    <div className="text-3xl mb-3">{deal.icon}</div>
    <p className="font-bold text-white text-sm mb-1">{deal.brand} Parts</p>
    <div className="inline-flex items-center gap-1 bg-green-500/20 border border-green-500/30 rounded-full px-2 py-0.5">
      <span className="text-green-400 text-[10px] font-bold">↓ {deal.discount}</span>
    </div>
    <p className="text-zinc-500 text-[10px] mt-2 group-hover:text-zinc-300 transition-colors">Shop on eBay →</p>
  </a>
);

const EbayDealsSection = () => (
  <section className="py-8 px-4 max-w-7xl mx-auto">
    <div className="flex items-center justify-between mb-5">
      <div>
        <p className="text-[11px] font-semibold tracking-widest uppercase text-red-500/60 mb-1">EBAY MOTORS DEALS</p>
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          🔥 Up to 10% Off by Brand
          <span className="text-xs font-normal text-zinc-600 bg-zinc-800 px-2 py-0.5 rounded-full">UK Only</span>
        </h2>
      </div>
      <a href={EBAY_ALL_DEALS_URL} target="_blank" rel="noopener noreferrer" className="text-xs text-zinc-500 hover:text-red-400 transition-colors">
        All eBay deals →
      </a>
    </div>
    <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide snap-x snap-mandatory">
      {EBAY_DEALS.map(deal => <DealCard key={deal.brand} deal={deal} />)}
    </div>
    <p className="text-[10px] text-zinc-700 mt-3">
      Deals are from eBay UK. Discounts vary by seller and listing. Powered by eBay Partner Network.
    </p>
  </section>
);

export default EbayDealsSection;
