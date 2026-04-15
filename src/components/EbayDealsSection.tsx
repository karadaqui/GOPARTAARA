import { useState, useEffect } from "react";
import { getActiveDeals, EBAY_ALL_DEALS_URL, isUKUser, EbayDeal } from "@/data/ebayDeals";

const DealCard = ({ deal }: { deal: EbayDeal }) => (
  <a
    href={deal.url}
    target="_blank"
    rel="noopener noreferrer"
    className="flex items-center gap-3 rounded-xl p-3 border border-zinc-800/60 bg-zinc-900/80 hover:border-red-500/30 hover:bg-zinc-900 transition-all duration-200 group cursor-pointer"
  >
    <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-black flex-shrink-0 ${
      deal.type === 'tools' ? 'bg-amber-900/40 text-amber-300' : 'bg-red-900/40 text-red-300'
    }`}>
      {deal.type === 'tools' ? '🔧' : deal.brand?.[0] || '⭐'}
    </div>
    <div className="flex-1 min-w-0">
      <p className="font-semibold text-white text-sm leading-tight group-hover:text-red-400 transition-colors truncate">{deal.label}</p>
      <p className="text-[10px] text-zinc-500 truncate">{deal.description}</p>
    </div>
    <div className="flex flex-col items-end flex-shrink-0">
      <span className="text-[11px] text-green-400 font-semibold whitespace-nowrap">{deal.discount}</span>
      <span className="text-[10px] text-zinc-600 group-hover:text-zinc-400 transition-colors">→</span>
    </div>
  </a>
);

const EbayDealsSection = () => {
  const [activeDeals, setActiveDeals] = useState(getActiveDeals());

  useEffect(() => {
    const interval = setInterval(() => setActiveDeals(getActiveDeals()), 60000);
    return () => clearInterval(interval);
  }, []);

  if (!isUKUser() || activeDeals.length === 0) return null;

  return (
    <section className="py-8 px-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-end justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 bg-blue-950/60 border border-blue-700/40 rounded-full px-2.5 py-0.5">
              <span className="text-[10px] font-bold text-blue-300 tracking-wider">UK EXCLUSIVE</span>
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            </span>
          </div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="text-red-500">🔥</span>
            eBay Motors Deals
          </h2>
        </div>
      </div>

      {/* Grid of deals */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        {activeDeals.map((deal) => (
          <DealCard key={deal.id} deal={deal} />
        ))}
        {/* All Deals card */}
        <a
          href={EBAY_ALL_DEALS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-xl p-3 border border-red-500/20 bg-gradient-to-r from-red-950/30 to-red-900/10 hover:border-red-500/40 transition-all duration-200 group cursor-pointer"
        >
          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-black flex-shrink-0 bg-red-900/40 text-red-300">
            🏷️
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-white text-sm leading-tight group-hover:text-red-400 transition-colors">All eBay UK Deals</p>
            <p className="text-[10px] text-zinc-500">Browse all automotive deals</p>
          </div>
          <span className="text-[10px] text-red-400 group-hover:translate-x-0.5 transition-transform flex-shrink-0">→</span>
        </a>
      </div>

      <p className="text-[10px] text-zinc-700 mt-3 text-center">
        Affiliate links — we may earn a small commission at no extra cost to you.
      </p>
    </section>
  );
};

export default EbayDealsSection;
