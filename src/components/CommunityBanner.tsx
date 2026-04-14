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
      <div className="text-4xl mb-4" aria-hidden="true">🤝</div>

      <h3 className="community-banner-title">Help us add more suppliers</h3>

      <p className="community-banner-copy">
        We're a small independent team. Every search, share and subscription
        helps us partner with more suppliers and build a better product for UK & global car owners.
      </p>

      <div className="community-banner-divider" aria-hidden="true" />

      <div className="community-banner-actions">
        <button
          type="button"
          onClick={handleShare}
          className="community-banner-button community-banner-button-ghost"
        >
          Share PARTARA 🔗
        </button>

        <button
          type="button"
          onClick={() => navigate('/pricing')}
          className="community-banner-button community-banner-button-accent"
        >
          Support Us → Pro
        </button>
      </div>

      <p className="community-banner-footnote">
        Currently live: eBay (global) 🇬🇧
      </p>
    </div>
  );
};

export default CommunityBanner;
