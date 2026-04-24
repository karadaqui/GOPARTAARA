import { useState } from "react";
import { Globe, X, ArrowRight } from "lucide-react";
import CountryFlag from "@/components/CountryFlag";
import { type VinCountryInfo } from "@/lib/vinCountry";

export interface EbayMarket {
  code: string;
  name: string;
  emoji: string;
  domain: string;
  ebayMarketplace: string;
  mkrid: string;
}

const SUPPORTED_EBAY_MARKETS: EbayMarket[] = [
  { code: "GB", name: "United Kingdom", emoji: "🇬🇧", domain: "ebay.co.uk", ebayMarketplace: "EBAY_GB", mkrid: "710-53481-19255-0" },
  { code: "US", name: "United States", emoji: "🇺🇸", domain: "ebay.com", ebayMarketplace: "EBAY_US", mkrid: "711-53200-19255-0" },
  { code: "DE", name: "Germany", emoji: "🇩🇪", domain: "ebay.de", ebayMarketplace: "EBAY_DE", mkrid: "707-53477-19255-0" },
  { code: "FR", name: "France", emoji: "🇫🇷", domain: "ebay.fr", ebayMarketplace: "EBAY_FR", mkrid: "709-53476-19255-0" },
  { code: "IT", name: "Italy", emoji: "🇮🇹", domain: "ebay.it", ebayMarketplace: "EBAY_IT", mkrid: "724-53478-19255-0" },
  { code: "ES", name: "Spain", emoji: "🇪🇸", domain: "ebay.es", ebayMarketplace: "EBAY_ES", mkrid: "1185-53479-19255-0" },
  { code: "AU", name: "Australia", emoji: "🇦🇺", domain: "ebay.com.au", ebayMarketplace: "EBAY_AU", mkrid: "705-53470-19255-0" },
  { code: "NL", name: "Netherlands", emoji: "🇳🇱", domain: "ebay.nl", ebayMarketplace: "EBAY_NL", mkrid: "1346-53482-19255-0" },
];

const COMING_SOON_MARKETS = [
  { code: "JP", name: "Japan", emoji: "🇯🇵" },
  { code: "KR", name: "South Korea", emoji: "🇰🇷" },
  { code: "CN", name: "China", emoji: "🇨🇳" },
  { code: "CA", name: "Canada", emoji: "🇨🇦" },
  { code: "SE", name: "Sweden", emoji: "🇸🇪" },
  { code: "BE", name: "Belgium", emoji: "🇧🇪" },
];

interface VinCountryModalProps {
  open: boolean;
  onClose: () => void;
  countryInfo: VinCountryInfo;
  onSearchGlobal: () => void;
  onSelectMarket: (market: EbayMarket) => void;
}

const VinCountryModal = ({ open, onClose, countryInfo, onSearchGlobal, onSelectMarket }: VinCountryModalProps) => {
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg mx-4 bg-[#111] border border-white/[0.08] rounded-3xl overflow-hidden shadow-2xl animate-scale-in">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl hover:bg-white/5 text-zinc-500 hover:text-white transition-colors z-10"
        >
          <X size={18} />
        </button>

        <div className="p-6 sm:p-8 text-center">
          {/* Globe icon */}
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-red-600/20 to-amber-600/20 border border-white/[0.06] flex items-center justify-center">
            <Globe size={32} className="text-red-400" />
          </div>

          {/* Title */}
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
            {countryInfo.name} Market Coming Soon
          </h2>

          {/* Description */}
          <p className="text-sm text-zinc-400 leading-relaxed mb-6 max-w-sm mx-auto">
            We detected your vehicle was manufactured in {countryInfo.name}.
            We're working hard to bring local {countryInfo.name} suppliers to GOPARTARA.
          </p>

          {/* Progress bar */}
          <div className="mb-6">
            <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
              <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-red-600 to-amber-500 animate-pulse" />
            </div>
            <p className="text-[10px] text-zinc-600 uppercase tracking-wider mt-2 font-medium">
              Development in progress
            </p>
          </div>

          {/* Action buttons */}
          <div className="space-y-3 mb-4">
            <button
              onClick={onSearchGlobal}
              className="w-full py-3.5 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
            >
              Search Global eBay Instead <ArrowRight size={16} />
            </button>
            <button
              onClick={() => setShowCountryPicker(!showCountryPicker)}
              className="w-full py-3 border border-zinc-700 hover:border-zinc-500 text-zinc-300 rounded-xl transition-colors text-sm"
            >
              Choose a Different eBay Market
            </button>
          </div>

          {/* Country picker grid */}
          {showCountryPicker && (
            <div className="pt-4 border-t border-white/[0.06]">
              <p className="text-xs text-zinc-500 mb-3 font-medium">Active Markets</p>
              <div className="grid grid-cols-4 gap-2 mb-4">
                {SUPPORTED_EBAY_MARKETS.map((market) => (
                  <button
                    key={market.code}
                    onClick={() => onSelectMarket(market)}
                    className="p-2.5 bg-zinc-800/60 hover:bg-zinc-700 rounded-xl text-center transition-colors border border-transparent hover:border-white/10"
                  >
                    <div className="flex justify-center mb-1">
                      <CountryFlag countryCode={market.code} emoji={market.emoji} size={22} />
                    </div>
                    <span className="text-[10px] text-zinc-300 font-medium">{market.name}</span>
                  </button>
                ))}
              </div>

              <p className="text-xs text-zinc-500 mb-3 font-medium">Coming Soon</p>
              <div className="grid grid-cols-4 gap-2">
                {COMING_SOON_MARKETS.map((market) => (
                  <div
                    key={market.code}
                    className="p-2.5 bg-zinc-900/40 rounded-xl text-center opacity-50 cursor-not-allowed"
                  >
                    <div className="flex justify-center mb-1">
                      <CountryFlag countryCode={market.code} emoji={market.emoji} size={22} />
                    </div>
                    <span className="text-[10px] text-zinc-500 font-medium">{market.name}</span>
                    <span className="block text-[8px] text-zinc-600 mt-0.5">Soon</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export { SUPPORTED_EBAY_MARKETS };
export default VinCountryModal;
