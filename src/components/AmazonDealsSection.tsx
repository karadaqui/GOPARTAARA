import { isUKUser } from "@/data/ebayDeals";

const AMAZON_UK_DEALS = [
  {
    id: 'amazon-accessories',
    label: 'Car Accessories',
    discount: "Shop today's deals",
    description: 'Mounts, organizers, seat covers & more',
    icon: '🚗',
    url: 'https://www.amazon.co.uk/b?_encoding=UTF8&node=301308031&tag=gopartara-21'
  },
  {
    id: 'amazon-oils-fluids',
    label: 'Oils & Fluids',
    discount: "Shop today's deals",
    description: 'Engine oil, coolant, brake fluid & more',
    icon: '🛢️',
    url: 'https://www.amazon.co.uk/b?_encoding=UTF8&node=301315031&tag=gopartara-21'
  },
  {
    id: 'amazon-tools',
    label: 'Tools & Equipment',
    discount: "Shop today's deals",
    description: 'Garage tools, jacks, diagnostic kits',
    icon: '🔧',
    url: 'https://www.amazon.co.uk/b?_encoding=UTF8&node=2486235031&tag=gopartara-21'
  },
  {
    id: 'amazon-electronics',
    label: 'Vehicle Electronics',
    discount: "Shop today's deals",
    description: 'Dash cams, GPS, CarPlay adapters & more',
    icon: '📱',
    url: 'https://www.amazon.co.uk/b?_encoding=UTF8&node=3013843031&tag=gopartara-21'
  },
];

const AMAZON_ALL_DEALS_URL = 'https://www.amazon.co.uk/b?_encoding=UTF8&node=248877031&tag=gopartara-21';

const AmazonDealsSection = () => {
  if (!isUKUser()) return null;

  return (
    <section className="py-10 px-4 max-w-7xl mx-auto">
      <div className="flex items-end justify-between mb-5">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 bg-orange-950/50 border border-orange-700/30 rounded-full px-3 py-1">
              <span className="text-xs font-bold text-orange-300 tracking-wider">Amazon UK</span>
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
            </span>
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>📦</span> Amazon Automotive Deals
          </h2>
          <p className="text-zinc-500 text-xs mt-1">
            Today's deals on car accessories & garage equipment
          </p>
        </div>
        <a
          href={AMAZON_ALL_DEALS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-600/20 to-orange-500/10 border border-orange-500/30 hover:border-orange-500/60 rounded-xl text-sm font-semibold text-orange-400 hover:text-orange-300 transition-all duration-200 hover:shadow-lg hover:shadow-orange-500/10"
        >
          All Amazon Deals
          <span className="group-hover:translate-x-0.5 transition-transform">→</span>
        </a>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide snap-x snap-mandatory -mx-4 px-4">
        {AMAZON_UK_DEALS.map((deal, i) => (
          <a
            key={deal.id}
            href={deal.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ animationDelay: `${i * 50}ms` }}
            className="flex-shrink-0 w-44 snap-start rounded-2xl p-4 border border-orange-900/30 bg-orange-950/10 hover:border-orange-700/40 hover:bg-orange-950/20 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/30 transition-all duration-200 group cursor-pointer"
          >
            <div className="text-2xl mb-3">{deal.icon}</div>
            <p className="font-bold text-white text-[13px] leading-snug mb-1 group-hover:text-orange-400 transition-colors line-clamp-2">{deal.label}</p>
            <p className="text-[10px] text-zinc-600 mb-2 line-clamp-1">{deal.description}</p>
            <div className="inline-flex items-center gap-1 mb-2">
              <span className="text-orange-400 text-[11px] font-bold">↓</span>
              <span className="text-[11px] text-orange-400 font-semibold">{deal.discount}</span>
            </div>
            <div className="flex items-center gap-1 text-zinc-600 group-hover:text-zinc-400 transition-colors">
              <span className="text-[10px]">Shop on Amazon</span>
              <span className="text-[10px] group-hover:translate-x-0.5 transition-transform">→</span>
            </div>
          </a>
        ))}
      </div>

      <p className="text-[10px] text-zinc-700 mt-4 text-center">
        Amazon UK affiliate links — we earn a small commission at no extra cost to you.
      </p>
    </section>
  );
};

export default AmazonDealsSection;
