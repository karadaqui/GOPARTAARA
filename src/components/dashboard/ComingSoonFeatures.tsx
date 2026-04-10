import { Sparkles, BarChart3, Globe, Zap } from "lucide-react";

const COMING_SOON = [
  { icon: BarChart3, title: "Advanced Analytics", desc: "Deep insights into your parts spending and savings." },
  { icon: Globe, title: "Multi-Region Search", desc: "Search parts across EU and US suppliers." },
  { icon: Zap, title: "Auto-Order", desc: "Automatically purchase when price targets are hit." },
];

const ComingSoonFeatures = () => (
  <div className="glass rounded-2xl p-6 sm:p-8">
    <h2 className="font-display text-lg font-semibold flex items-center gap-2 mb-4">
      <Sparkles size={18} className="text-amber-400" />
      Coming Soon — Business Exclusives
    </h2>
    <div className="grid gap-3">
      {COMING_SOON.map((f) => (
        <div key={f.title} className="flex items-start gap-3 p-3 rounded-xl bg-secondary/30 border border-border">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
            <f.icon size={14} className="text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-medium">{f.title}</p>
            <p className="text-xs text-muted-foreground">{f.desc}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default ComingSoonFeatures;
