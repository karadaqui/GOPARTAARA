import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const CommunityBanner = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleClaimFreeMonth = async () => {
    if (!user) { navigate('/auth'); return; }
    const { activateTrial } = await import('@/utils/activateTrial');
    const result = await activateTrial(supabase);
    if (result.success) toast.success(result.message);
    else toast.error(result.message);
  };

  return (
    <div className="py-16 px-4 max-w-2xl mx-auto text-center">
      {/* Live badge */}
      <div className="flex justify-center mb-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-4 py-1.5 text-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-emerald-400 font-medium">
            LIVE · eBay Global · 1,000,000+ parts
          </span>
        </div>
      </div>

      {/* Heading */}
      <h3 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight mb-6">
        We're small.<br />
        Our ambitions aren't.
      </h3>

      {/* Paragraph 1 */}
      <p className="text-muted-foreground text-base leading-relaxed mb-4">
        Right now, PARTARA searches over{" "}
        <span className="text-foreground font-semibold">1,000,000+ parts</span> through{" "}
        <span className="text-foreground font-semibold">eBay Global</span> — covering the UK and beyond.
        Every search is live, every deal is real,
        and we never miss a discount.
      </p>

      {/* Paragraph 2 */}
      <p className="text-muted-foreground text-sm leading-relaxed mb-8">
        We're an independent team with big dreams — working hard
        to bring every driver, every car owner, every mechanic
        the best prices from trusted suppliers worldwide.
        Global coverage is coming. With your support,
        we'll get there faster.
      </p>

      {/* What's live now */}
      <div className="mb-6">
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
          What's live today
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {[
            { name: "eBay UK", status: "live" },
            { name: "eBay Global", status: "live" },
            { name: "Amazon UK Deals", status: "live" },
          ].map((s) => (
            <span
              key={s.name}
              className="inline-flex items-center gap-1.5 text-sm text-emerald-400 bg-emerald-500/10 rounded-full px-3 py-1"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {s.name}
            </span>
          ))}
        </div>
      </div>

      {/* Coming soon suppliers */}
      <div className="mb-8">
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
          Suppliers &amp; markets we're adding
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {[
            "Euro Car Parts",
            "GSF Car Parts",
            "Autodoc",
            "Halfords",
            "Global Suppliers",
          ].map((supplier) => (
            <span
              key={supplier}
              className="text-sm text-muted-foreground bg-muted/40 rounded-full px-3 py-1"
            >
              {supplier}
              <span className="ml-1 text-xs text-yellow-500">· soon</span>
            </span>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="w-12 h-px bg-border mx-auto mb-8" />

      {/* Free Pro offer */}
      <div className="mb-8">
        <p className="text-3xl mb-3" aria-hidden="true">🎁</p>
        <h4 className="text-lg font-semibold text-foreground mb-2">
          First Month Pro — Free
        </h4>
        <p className="text-muted-foreground text-sm leading-relaxed mb-4">
          New to PARTARA? Your first month Pro is on us —
          no card needed. Already a member? Share your referral link
          and your friend gets 1 month free too.
        </p>
        <button
          type="button"
          onClick={handleClaimFreeMonth}
          className="inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground px-6 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Claim Free Month →
        </button>
      </div>

      {/* Feedback */}
      <p className="text-xs text-muted-foreground">
        We read every message. Tell us what you think →{" "}
        <a
          href="mailto:info@gopartara.com"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          info@gopartara.com
        </a>
        {" "}·{" "}
        <a
          href="https://wa.me/447423753090"
          target="_blank"
          rel="noopener noreferrer"
          className="text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          WhatsApp
        </a>
      </p>
    </div>
  );
};

export default CommunityBanner;
