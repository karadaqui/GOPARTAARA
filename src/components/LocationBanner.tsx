import { useState } from "react";
import { MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCountry } from "@/hooks/useCountry";

const LocationBanner = () => {
  const { showBanner, dismissBanner, setCountry, detectLocation, setSelectorHighlighted } = useCountry();
  const [detecting, setDetecting] = useState(false);

  if (!showBanner) return null;

  const handleAllow = async () => {
    setDetecting(true);
    try {
      const detected = await detectLocation();
      setCountry(detected);
    } catch {
      dismissBanner();
    } finally {
      setDetecting(false);
    }
  };

  const handleChooseManually = () => {
    dismissBanner();
    // Highlight the navbar country selector and open it
    setSelectorHighlighted(true);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[60] animate-in slide-in-from-bottom-4 duration-500">
      <div className="border-t-2 border-primary bg-zinc-900 px-4 py-4 shadow-2xl">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-3 max-w-4xl">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <MapPin className="text-primary shrink-0" size={22} />
            <div>
              <p className="text-sm font-semibold text-white">
                Allow location access for better results
              </p>
              <p className="text-xs text-zinc-400">
                We'll show parts available in your country automatically
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleAllow}
              disabled={detecting}
              className="rounded-xl text-xs"
            >
              {detecting ? "Detecting…" : "Allow Location"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleChooseManually}
              className="rounded-xl text-xs border-zinc-600 text-zinc-300 hover:bg-zinc-800"
            >
              Choose Manually
            </Button>
            <button
              onClick={dismissBanner}
              className="ml-1 text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationBanner;
