import { EBAY_DEALS, EBAY_ALL_DEALS_URL, isUKUser } from "@/data/ebayDeals";

const EbayDealsSection = () => {
  if (!isUKUser()) return null;

  return (
    <section className="py-10 px-4 max-w-7xl mx-auto">
      {/* Premium header */}
      <div className="flex items-end justify-between mb-6">
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

      {/* Deal cards */}
      <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide snap-x snap-mandatory -mx-4 px-4">
        {EBAY_DEALS.map((deal, index) => (
          <a
            key={deal.brand}
            href={deal.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ animationDelay: `${index * 50}ms` }}
            className="flex-shrink-0 w-40 snap-start bg-zinc-900/80 border border-zinc-800/60 hover:border-zinc-600/60 hover:bg-zinc-800/60 rounded-2xl p-4 transition-all duration-200 hover:shadow-xl hover:shadow-black/30 hover:-translate-y-0.5 group cursor-pointer"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700/50 flex items-center justify-center text-base font-black text-white group-hover:border-zinc-600 transition-colors">
                {deal.brand[0]}
              </div>
              <span className="text-[9px] font-bold text-blue-400 bg-blue-950/60 border border-blue-700/30 rounded-full px-1.5 py-0.5">UK</span>
            </div>
            <p className="font-bold text-white text-sm leading-tight mb-2 group-hover:text-red-400 transition-colors">{deal.label}</p>
            <div className="flex items-center gap-1 mb-3">
              <span className="text-green-400 text-[10px] font-bold">↓</span>
              <span className="text-[10px] text-green-400 font-semibold">10%+ off</span>
            </div>
            <div className="flex items-center gap-1 text-zinc-600 group-hover:text-zinc-400 transition-colors">
              <span className="text-[10px]">Shop on eBay</span>
              <span className="text-[10px] group-hover:translate-x-0.5 transition-transform">→</span>
            </div>
          </a>
        ))}
      </div>

      <p className="text-[10px] text-zinc-700 mt-4 text-center">
        Deals available on eBay UK only. Discounts vary by seller. Affiliate links — we may earn a small commission at no extra cost to you.
      </p>
    </section>
  );
};

export default EbayDealsSection;
