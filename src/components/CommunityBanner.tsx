import { useNavigate } from "react-router-dom";
import ScrollReveal from "@/components/ScrollReveal";

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
    <ScrollReveal className="max-w-6xl mx-auto mt-12">
      <div style={{
        textAlign: 'center',
        padding: '48px 24px',
        maxWidth: '600px',
        margin: '0 auto',
      }}>
        {/* Large elegant emoji */}
        <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>🤝</div>

        {/* Premium gradient title */}
        <h3 style={{
          fontSize: '1.5rem',
          fontWeight: 800,
          background: 'linear-gradient(135deg, #ffffff 0%, #a1a1aa 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: '12px',
          letterSpacing: '-0.5px',
        }}>
          Help us add more suppliers
        </h3>

        {/* Subtle description */}
        <p style={{
          color: '#71717a',
          fontSize: '0.9rem',
          lineHeight: 1.7,
          maxWidth: '480px',
          margin: '0 auto 28px',
        }}>
          We're a small independent team. Every search, share and subscription
          helps us partner with more suppliers and build a better product for UK car owners.
        </p>

        {/* Elegant divider */}
        <div style={{
          width: '40px',
          height: '2px',
          background: 'linear-gradient(90deg, transparent, #dc2626, transparent)',
          margin: '0 auto 28px',
        }} />

        {/* Premium buttons - no filled background */}
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'center',
          flexWrap: 'wrap',
        }}>
          {/* Ghost button with subtle border */}
          <button
            onClick={handleShare}
            style={{
              padding: '10px 24px',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '8px',
              background: 'transparent',
              color: '#e4e4e7',
              fontSize: '0.85rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s',
              backdropFilter: 'blur(4px)',
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.3)';
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.15)';
            }}
          >
            Share PARTARA 🔗
          </button>

          {/* Red accent button - clean no box */}
          <button
            onClick={() => navigate('/pricing')}
            style={{
              padding: '10px 24px',
              border: '1px solid rgba(220,38,38,0.4)',
              borderRadius: '8px',
              background: 'rgba(220,38,38,0.08)',
              color: '#f87171',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLButtonElement).style.background = 'rgba(220,38,38,0.15)';
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.background = 'rgba(220,38,38,0.08)';
            }}
          >
            Support Us → Pro
          </button>
        </div>

        {/* Small footnote */}
        <p style={{
          color: '#3f3f46',
          fontSize: '0.75rem',
          marginTop: '20px',
        }}>
          Currently live: eBay (global) 🇬🇧
        </p>
      </div>
    </ScrollReveal>
  );
};

export default CommunityBanner;
