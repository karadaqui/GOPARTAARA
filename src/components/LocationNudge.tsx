import { X, Globe, ArrowRight } from "lucide-react";
import { useCountry } from "@/hooks/useCountry";

const LocationNudge = () => {
  const { showNudge, dismissNudge, setSelectorHighlighted } = useCountry();

  if (!showNudge) return null;

  return (
    <div className="relative mx-auto max-w-2xl mb-4 animate-in fade-in-50 slide-in-from-top-2 duration-500">
      <button
        onClick={() => {
          setSelectorHighlighted(true);
          dismissNudge();
        }}
        className="w-full flex items-center gap-2.5 rounded-xl border border-white/10 bg-zinc-800/80 backdrop-blur-sm px-4 py-2.5 text-sm text-muted-foreground hover:bg-zinc-700/80 hover:text-foreground transition-colors group"
      >
        <Globe size={16} className="text-primary shrink-0" />
        <span className="flex-1 text-left">Select your country for better results</span>
        <ArrowRight size={14} className="text-primary shrink-0 group-hover:translate-x-0.5 transition-transform" />
        <span
          role="button"
          onClick={(e) => {
            e.stopPropagation();
            dismissNudge();
          }}
          className="ml-1 text-muted-foreground/60 hover:text-foreground transition-colors"
        >
          <X size={14} />
        </span>
      </button>
    </div>
  );
};

export default LocationNudge;
