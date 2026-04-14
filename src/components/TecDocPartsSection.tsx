import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { buildEbayAffiliateUrl } from "@/lib/ebayAffiliate";
import { Loader2, Search, ExternalLink, AlertTriangle, Wrench } from "lucide-react";

const CATEGORIES = [
  { label: "Brakes", icon: "🛑" },
  { label: "Engine", icon: "⚙️" },
  { label: "Suspension", icon: "🔧" },
  { label: "Filters", icon: "🔍" },
  { label: "Exhaust", icon: "💨" },
  { label: "Electrics", icon: "⚡" },
  { label: "Cooling", icon: "❄️" },
  { label: "Steering", icon: "🎯" },
];

interface TecDocPart {
  id: number | string;
  name: string;
  brand: string;
  oemNumber: string;
  category: string;
}

interface TecDocPartsSectionProps {
  make: string;
  model?: string | null;
  year?: number | null;
}

const TecDocPartsSection = ({ make, model, year }: TecDocPartsSectionProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [parts, setParts] = useState<TecDocPart[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const { toast } = useToast();

  const vehicleLabel = `${make} ${model || ""} ${year || ""}`.trim();

  const handleCategoryClick = async (category: string) => {
    if (category === selectedCategory && searched) return;
    setSelectedCategory(category);
    setLoading(true);
    setSearched(true);
    setParts([]);

    try {
      // First try to find the vehicle in TecDoc
      const { data: vData, error: vErr } = await supabase.functions.invoke("tecdoc-lookup", {
        body: { action: "search_vehicle", make, model: model || undefined, year: year || undefined },
      });

      if (vErr) throw vErr;

      const vehicles = vData?.vehicles || [];
      if (vehicles.length > 0) {
        const vehicleId = vehicles[0].id || vehicles[0].ktype;
        const { data: pData, error: pErr } = await supabase.functions.invoke("tecdoc-lookup", {
          body: { action: "get_parts", vehicleId, category },
        });
        if (pErr) throw pErr;
        setParts(pData?.parts || []);
      }
    } catch (err: any) {
      console.error("TecDoc lookup failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const buildEbaySearchUrl = (articleNumber: string, partName: string) => {
    const query = articleNumber
      ? `${articleNumber} ${make} ${model || ""}`.trim()
      : `${partName} ${make} ${model || ""}`.trim();
    const base = `https://www.ebay.co.uk/sch/i.html?_nkw=${encodeURIComponent(query)}`;
    return buildEbayAffiliateUrl(base);
  };

  return (
    <div className="mb-8 rounded-2xl bg-[#111] border border-white/[0.08] overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-red-600/15 flex items-center justify-center shrink-0">
          <Wrench size={20} className="text-red-500" />
        </div>
        <div>
          <h3 className="font-bold text-lg text-white">🔧 Compatible Parts for Your {vehicleLabel.toUpperCase()}</h3>
          <p className="text-xs text-zinc-500">Powered by TecDoc — browse OEM-matched parts by category</p>
        </div>
      </div>

      {/* Category Grid */}
      <div className="px-5 py-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.label}
              onClick={() => handleCategoryClick(cat.label)}
              disabled={loading}
              className={`relative flex items-center gap-2.5 px-4 py-3.5 rounded-xl border text-sm font-semibold transition-all duration-200 ${
                selectedCategory === cat.label
                  ? "bg-red-600 border-red-500 text-white shadow-lg shadow-red-600/20"
                  : "bg-[#1a1a1a] border-white/[0.08] text-zinc-300 hover:border-red-500/40 hover:bg-red-600/10 hover:text-white"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <span className="text-lg">{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-8 text-zinc-400 text-sm gap-2">
          <Loader2 size={16} className="animate-spin" /> Searching TecDoc for {selectedCategory} parts…
        </div>
      )}

      {/* Parts Results */}
      {searched && !loading && parts.length > 0 && (
        <div className="border-t border-white/[0.06]">
          <div className="px-5 py-3 bg-zinc-900/50">
            <p className="text-sm font-semibold text-white">
              {selectedCategory} — {parts.length} compatible part{parts.length !== 1 ? "s" : ""} found
            </p>
          </div>
          <div className="divide-y divide-white/[0.04] max-h-[400px] overflow-y-auto">
            {parts.map((part) => (
              <div key={part.id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-white/[0.02] transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{part.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {part.brand && (
                      <span className="text-xs text-zinc-500">{part.brand}</span>
                    )}
                    {part.oemNumber && (
                      <span className="text-xs font-mono bg-zinc-800 px-2 py-0.5 rounded text-zinc-400 border border-white/[0.06]">
                        {part.oemNumber}
                      </span>
                    )}
                  </div>
                </div>
                <a
                  href={buildEbaySearchUrl(part.oemNumber, part.name)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0"
                >
                  <button className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-red-600/10 border border-red-500/20 text-red-400 hover:bg-red-600 hover:text-white text-xs font-semibold transition-all duration-200">
                    <Search size={13} />
                    Find on eBay
                    <ExternalLink size={11} />
                  </button>
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No results */}
      {searched && !loading && parts.length === 0 && (
        <div className="px-5 py-4 border-t border-white/[0.06]">
          <div className="flex items-center gap-2.5 text-sm text-zinc-400 bg-zinc-900/50 rounded-xl px-4 py-3">
            <AlertTriangle size={15} className="text-amber-500 shrink-0" />
            No specific parts found. Showing general eBay results instead.
          </div>
        </div>
      )}
    </div>
  );
};

export default TecDocPartsSection;
