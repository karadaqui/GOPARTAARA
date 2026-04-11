import { X } from "lucide-react";
import { useCountry } from "@/hooks/useCountry";

const LocationNudge = () => {
  const { showNudge, dismissNudge } = useCountry();

  if (!showNudge) return null;

  return (
    <div className="relative mx-auto max-w-2xl mb-4 animate-in fade-in-50 slide-in-from-top-2 duration-500">
      <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm px-4 py-2.5 text-sm text-muted-foreground">
        <span>🌍</span>
        <span>For more accurate results, select your country</span>
        <span className="text-primary">→</span>
        <button
          onClick={dismissNudge}
          className="ml-auto text-muted-foreground/60 hover:text-foreground transition-colors"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};

export default LocationNudge;
