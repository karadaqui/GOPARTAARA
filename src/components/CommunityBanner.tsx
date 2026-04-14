import { useNavigate } from "react-router-dom";

const CommunityBanner = () => {
  const navigate = useNavigate();

  const handleShare = async () => {
    const shareData = {
      title: "PARTARA",
      text: "Find car parts cheaper with PARTARA — gopartara.com 🔧",
      url: "https://gopartara.com",
    };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch { }
    } else {
      await navigator.clipboard.writeText(shareData.text);
    }
  };

  return (
    <div className="py-12 text-center max-w-xl mx-auto">
      {/* Large elegant emoji */}
      <div className="text-4xl mb-4">🤝</div>

      {/* Premium gradient title */}
      <h3 
        className="text-2xl font-extrabold mb-3 tracking-tight"
        style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #a1a1aa 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        Help us add more suppliers
      </h3>

      {/* Subtle description */}
      <p className="text-sm text-zinc-500 max-w-md mx-auto mb-7 leading-relaxed">
        We're a small independent team. Every search, share and subscription 
        helps us partner with more suppliers and build a better product for UK car owners.
      </p>

      {/* Elegant divider */}
      <div 
        className="h-0.5 w-10 mx-auto mb-7"
        style={{
          background: 'linear-gradient(90deg, transparent, #dc2626, transparent)',
        }}
      />

      {/* Premium buttons */}
      <div className="flex gap-3 justify-center flex-wrap">
        {/* Ghost button */}
        <button
          onClick={handleShare}
          className="px-6 py-2.5 text-sm font-medium text-zinc-300 border border-white/15 rounded-lg bg-transparent transition-all duration-200 hover:border-white/30"
        >
          Share PARTARA 🔗
        </button>

        {/* Red accent button */}
        <button
          onClick={() => navigate('/pricing')}
          className="px-6 py-2.5 text-sm font-semibold text-red-400 border border-red-500/40 rounded-lg transition-all duration-200 hover:bg-red-500/10"
          style={{ background: 'rgba(220,38,38,0.08)' }}
        >
          Support Us → Pro
        </button>
      </div>

      {/* Small footnote */}
      <p className="text-xs text-zinc-600 mt-5">
        Currently live: eBay (global) 🇬🇧
      </p>
    </div>
  );
};

export default CommunityBanner;
