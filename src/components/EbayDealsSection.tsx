import { useState, useEffect } from "react";
import { getActiveDeals, isUKUser, EbayDeal } from "@/data/ebayDeals";

const DealCard = ({ deal }: { deal: EbayDeal }) => {
  const icon = deal.type === 'tools' ? '🔧' : deal.type === 'all' ? '🔥' : deal.brand?.[0] || '⭐';
  const borderColor = deal.type === 'all'
    ? 'border-red-700/40 bg-red-950/20 hover:border-red-600/60'
    : deal.type === 'tools'
    ? 'border-amber-800/30 bg-amber-950/15 hover:border-amber-700/50'
    : 'border-zinc-800/60 bg-zinc-900/80 hover:border-zinc-700/60';
  const iconBg = deal.type === 'all'
    ? 'bg-red-900/50 text-red-300'
    : deal.type === 'tools'
    ? 'bg-amber-900/40 text-amber-300'
    : 'bg-blue-900/40 text-blue-300';
  const discountColor = deal.type === 'all' ? 'text-red-400' : 'text-green-400';

  return (
    <a
      href={deal.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex-shrink-0 w-[140px] snap-start rounded-xl p-3 border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20 group cursor-pointer ${borderColor}`}
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black mb-2 ${iconBg}`}>
        {icon}
      </div>
      <p className="font-bold text-white text-xs leading-snug mb-1 group-hover:text-red-400 transition-colors line-clamp-2">
        {deal.label}
      </p>
      <p className="text-[9px] text-zinc-500 mb-1.5 line-clamp-1">{deal.description}</p>
      <span className={`text-[10px] font-semibold ${discountColor}`}>{deal.discount}</span>
      <div className="flex items-center gap-0.5 text-zinc-600 group-hover:text-zinc-400 transition-colors mt-1">
        <span className="text-[9px]">Shop →</span>
      </div>
    </a>
  );
};

const EbayDealsSection = () => {
  const [activeDeals, setActiveDeals] = useState(getActiveDeals());

  useEffect(() => {
    const interval = setInterval(() => setActiveDeals(getActiveDeals()), 60000);
    return () => clearInterval(interval);
  }, []);

  if (!isUKUser() || activeDeals.length === 0) return null;

  return (
    <section className="py-8 px-4 max-w-7xl mx-auto">
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="inline-flex items-center gap-1.5 bg-blue-950/60 border border-blue-700/40 rounded-full px-2.5 py-0.5">
            <span className="text-[10px] font-bold text-blue-300 tracking-wider">UK</span>
            <span className="w-1 h-1 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-[9px] text-blue-400/70">EXCLUSIVE</span>
          </span>
        </div>
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <span className="text-red-500">🔥</span>
          eBay Motors Deals
        </h2>
        <p className="text-zinc-500 text-[10px] mt-0.5">
          Exclusive UK discounts · Updated daily · Powered by eBay Partner Network
        </p>
      </div>

      <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory -mx-4 px-4">
        {activeDeals.map((deal) => (
          <DealCard key={deal.id} deal={deal} />
        ))}
      </div>

      <p className="text-[9px] text-zinc-700 mt-3 text-center">
        Affiliate links — we may earn a small commission at no extra cost to you.
      </p>
    </section>
  );
};

export default EbayDealsSection;
