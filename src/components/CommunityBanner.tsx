const CommunityBanner = () => {
  return (
    <section id="mission-section" className="px-4 py-6 max-w-4xl mx-auto">
      <div className="rounded-2xl border border-border overflow-hidden bg-secondary/60">
        {/* Red top accent line */}
        <div className="h-0.5 w-full bg-primary" />

        <div className="p-6 sm:p-8">
          {/* Top row: left content + right CTA card */}
          <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 items-start mb-6">
            {/* Left: headline + description */}
            <div className="flex-1">
              {/* Live badge */}
              <div className="inline-flex items-center gap-2 mb-3 bg-secondary border border-border/50 rounded-full px-3 py-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
                <span className="text-[11px] font-semibold text-muted-foreground tracking-wider">
                  LIVE · eBay Global · 1,000,000+ parts
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight leading-tight mb-3">
                We're small.<br />
                <span className="text-primary">Our ambitions aren't.</span>
              </h2>

              <p className="text-muted-foreground/70 text-sm leading-relaxed max-w-md">
                We're an independent team working hard to give every driver access to the best prices from trusted suppliers worldwide. Your support helps us add more suppliers, faster.
              </p>
              <div className="mt-5 flex gap-2">
                <input
                  type="text"
                  placeholder="Search parts e.g. BMW brake pads..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                      window.location.href = `/search?q=${encodeURIComponent(e.currentTarget.value.trim())}`;
                    }
                  }}
                  className="flex-1 bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground text-sm placeholder:text-muted-foreground/50 focus:border-primary outline-none transition-colors"
                />
                <button
                  onClick={(e) => {
                    const input = (e.currentTarget as HTMLElement).previousElementSibling as HTMLInputElement;
                    if (input?.value?.trim()) {
                      window.location.href = `/search?q=${encodeURIComponent(input.value.trim())}`;
                    }
                  }}
                  className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-bold rounded-xl transition-colors whitespace-nowrap"
                >
                  Search
                </button>
              </div>
            </div>

            {/* Right: Free Pro CTA card */}
            <div className="w-full sm:w-48 flex-shrink-0 bg-secondary/80 border border-border/50 rounded-xl p-4 text-center">
              <div className="text-2xl mb-2">🎁</div>
              <p className="text-foreground font-bold text-sm mb-1">1 Month Pro Free</p>
              <p className="text-muted-foreground/70 text-[11px] mb-3 leading-relaxed">No credit card needed</p>
              <a
                href="/pricing"
                className="block w-full py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold rounded-lg transition-colors"
              >
                Claim now →
              </a>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              { value: '1M+', label: 'Parts searchable', color: 'text-foreground' },
              { value: 'Live', label: 'eBay Global prices', color: 'text-green-400' },
              { value: 'Free', label: 'To search & compare', color: 'text-foreground' },
            ].map(stat => (
              <div key={stat.label} className="bg-secondary/60 border border-border/30 rounded-xl p-3 text-center">
                <p className={`text-lg font-black tracking-tight ${stat.color}`}>{stat.value}</p>
                <p className="text-[10px] text-muted-foreground/50 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Coming soon suppliers */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] text-muted-foreground/50">Adding soon:</span>
            {['Amazon', 'Euro Car Parts', 'GSF Car Parts', 'Autodoc', 'Halfords', 'Black Circles'].map(s => (
              <span key={s} className="text-[11px] text-muted-foreground/50 bg-secondary border border-border/50 rounded-full px-2.5 py-0.5">
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CommunityBanner;
