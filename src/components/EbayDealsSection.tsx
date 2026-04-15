import { useState, useEffect } from "react";
import { getActiveDeals, EBAY_ALL_DEALS_URL, isUKUser, EbayDeal } from "@/data/ebayDeals";

const TABS = [
  { id: 'all', label: 'All Deals' },
  { id: 'brand', label: 'By Brand' },
  { id: 'tools', label: '🔧 Tools' },
  { id: 'category', label: 'Categories' },
];

const useCountdown = (expiryDate: string) => {
  const [timeLeft, setTimeLeft] = useState('');
  useEffect(() => {
    const update = () => {
      const diff = new Date(expiryDate).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft('Expired'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      if (h > 24) {
        const d = Math.floor(h / 24);
        setTimeLeft(`${d}d ${h % 24}h left`);
      } else {
        setTimeLeft(`${h}h ${m}m left`);
      }
    };
    update();
    const i = setInterval(update, 60000);
    return () => clearInterval(i);
  }, [expiryDate]);
  return timeLeft;
};

const CountdownTimer = ({ expiryDate }: { expiryDate: string }) => {
  const timeLeft = useCountdown(expiryDate);
  if (timeLeft === 'Expired') return null;
  return (
    <div className="flex items-center gap-1 mt-2">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
      <span className="text-[10px] text-amber-400 font-semibold">⏱ {timeLeft}</span>
    </div>
  );
};

const DealCard = ({ deal, index }: { deal: EbayDeal; index: number }) => (
  <a
    key={deal.id}
    href={deal.url}
    target="_blank"
    rel="noopener noreferrer"
    style={{ animationDelay: `${index * 50}ms` }}
    className={`flex-shrink-0 w-44 snap-start rounded-2xl p-4 border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/30 group cursor-pointer ${
      deal.expiryDate ? 'border-amber-700/30 bg-amber-950/20' :
      deal.type === 'tools' ? 'border-amber-800/20 bg-amber-950/10' :
      deal.type === 'category' ? 'border-blue-800/30 bg-blue-950/20' :
      'border-zinc-800/60 bg-zinc-900/80'
    }`}
  >
    <div className="flex items-start justify-between mb-3">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black ${
        deal.type === 'tools' ? 'bg-amber-900/40 text-amber-300' :
        deal.type === 'category' ? 'bg-blue-900/40 text-blue-300' :
        'bg-red-900/40 text-red-300'
      }`}>
        {deal.type === 'tools' ? '🔧' : deal.type === 'category' ? '🏷️' : deal.brand?.[0] || '⭐'}
      </div>
      {deal.expiryDate ? (
        <span className="text-[9px] font-bold text-amber-400 bg-amber-950/60 border border-amber-700/30 rounded-full px-1.5 py-0.5">SALE</span>
      ) : (
        <span className="text-[9px] font-bold text-blue-300 bg-blue-950/60 border border-blue-700/30 rounded-full px-1.5 py-0.5">UK</span>
      )}
    </div>
    <p className="font-bold text-white text-[13px] leading-snug mb-1.5 group-hover:text-red-400 transition-colors line-clamp-2">{deal.label}</p>
    <p className="text-[10px] text-zinc-600 mb-2 line-clamp-1">{deal.description}</p>
    <div className="inline-flex items-center gap-1 mb-2">
      <span className="text-green-400 text-[11px] font-bold">↓</span>
      <span className="text-[11px] text-green-400 font-semibold">{deal.discount}</span>
    </div>
    {deal.expiryDate && <CountdownTimer expiryDate={deal.expiryDate} />}
    <div className="flex items-center gap-1 text-zinc-600 group-hover:text-zinc-400 transition-colors mt-1">
      <span className="text-[10px]">Shop on eBay</span>
      <span className="text-[10px] group-hover:translate-x-0.5 transition-transform">→</span>
    </div>
  </a>
);

const EbayDealsSection = () => {
  const [activeDeals, setActiveDeals] = useState(getActiveDeals());
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    const interval = setInterval(() => setActiveDeals(getActiveDeals()), 60000);
    return () => clearInterval(interval);
  }, []);

  if (!isUKUser() || activeDeals.length === 0) return null;

  const filteredDeals = activeTab === 'all' ? activeDeals : activeDeals.filter(d => d.type === activeTab);

  return (
    <section className="py-10 px-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-end justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 bg-blue-950/60 border border-blue-700/40 rounded-full px-3 py-1">
              <span className="text-xs font-bold text-blue-300 tracking-wider">UK</span>
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              <span className="text-[10px] text-blue-400/70">EXCLUSIVE</span>
            </span>
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-red-500">🔥</span>
            eBay Motors Deals
          </h2>
          <p className="text-zinc-500 text-xs mt-1">
            Exclusive UK discounts · Updated daily · Powered by eBay Partner Network
          </p>
        </div>
        <a
          href={EBAY_ALL_DEALS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-600/20 to-red-500/10 border border-red-500/30 hover:border-red-500/60 rounded-xl text-sm font-semibold text-red-400 hover:text-red-300 transition-all duration-200 hover:shadow-lg hover:shadow-red-500/10"
        >
          All eBay UK Deals
          <span className="group-hover:translate-x-0.5 transition-transform">→</span>
        </a>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mt-3 mb-5 overflow-x-auto scrollbar-hide">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-red-600 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
        <span className="flex items-center text-[10px] text-zinc-600 ml-1">
          {filteredDeals.length} active deals
        </span>
      </div>

      {/* Cards */}
      <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide snap-x snap-mandatory -mx-4 px-4">
        {filteredDeals.map((deal, i) => (
          <DealCard key={deal.id} deal={deal} index={i} />
        ))}
      </div>

      <p className="text-[10px] text-zinc-700 mt-4 text-center">
        Deals available on eBay UK only. Discounts vary by seller. Affiliate links — we may earn a small commission at no extra cost to you.
      </p>
    </section>
  );
};

export default EbayDealsSection;
