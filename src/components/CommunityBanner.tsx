import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const CommunityBanner = () => {
  const navigate = useNavigate();

  const handleClaimFreeMonth = async () => {
    try {
      const raw = localStorage.getItem('sb-bkwieknlxvkrzluongif-auth-token');
      if (!raw) { navigate('/auth'); return; }
      const token = JSON.parse(raw)?.access_token;

      const response = await fetch(
        'https://bkwieknlxvkrzluongif.supabase.co/functions/v1/activate-trial',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({}),
        }
      );

      const result = await response.json();
      if (result.success) {
        toast.success('🎉 1 month Pro activated!');
        setTimeout(() => window.location.reload(), 1500);
      } else if (result.already_used) {
        toast.success(result.message);
      } else {
        toast.error(result.error || 'Something went wrong');
      }
    } catch {
      toast.error('Connection error. Please try again.');
    }
  };

  return (
    <section className="w-full border-b border-border/60 bg-gradient-to-b from-secondary/80 to-transparent py-8 px-4">
      <div className="max-w-3xl mx-auto text-center">
        {/* Live badge */}
        <div className="inline-flex items-center gap-2 mb-4 bg-secondary/60 border border-border/40 rounded-full px-4 py-1.5">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
          <span className="text-xs font-semibold text-muted-foreground tracking-wide">
            LIVE · eBay Global · 1,000,000+ parts
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight mb-3 leading-tight">
          We're small.{' '}
          <span className="text-primary">Our ambitions aren't.</span>
        </h1>

        {/* Description */}
        <p className="text-muted-foreground text-sm sm:text-base leading-relaxed mb-5 max-w-xl mx-auto">
          PARTARA searches <strong className="text-foreground">1,000,000+ parts</strong> from eBay Global —
          live prices, real deals, every time.
          We're an independent team working hard to add
          more suppliers. With your support, we'll get there faster.
        </p>

        {/* Free Pro CTA */}
        <div className="inline-flex flex-col sm:flex-row items-center gap-3 bg-gradient-to-r from-primary/10 to-secondary/50 border border-primary/40 rounded-2xl px-6 py-4 mb-5">
          <div className="text-left">
            <p className="text-foreground font-bold text-sm">
              🎁 First Month Pro — Completely Free
            </p>
            <p className="text-muted-foreground text-xs">
              No credit card · Cancel anytime ·
              Share & your friend gets 1 month free too
            </p>
          </div>
          <button
            type="button"
            onClick={handleClaimFreeMonth}
            className="flex-shrink-0 px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-bold rounded-xl transition-all hover:shadow-lg hover:shadow-primary/20 whitespace-nowrap"
          >
            Claim Free Month →
          </button>
        </div>

        {/* Coming soon suppliers */}
        <div className="flex flex-wrap justify-center gap-2">
          <span className="text-xs text-muted-foreground/60">Adding soon:</span>
          {['Euro Car Parts', 'GSF', 'Autodoc', 'Halfords'].map(s => (
            <span key={s} className="text-xs text-muted-foreground/60 bg-secondary border border-border rounded-full px-2.5 py-0.5">
              {s}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CommunityBanner;
