import { useEffect, useRef, useState } from "react";
import { Search, Clock, X } from "lucide-react";
import {
  getRecentSearches,
  removeRecentSearch,
  clearRecentSearches,
} from "@/lib/recentSearches";

export const POPULAR_SEARCHES = [
  "BMW E46 brake pads",
  "Ford Focus clutch kit",
  "VW Golf air filter",
  "Vauxhall Astra timing belt",
  "Toyota Yaris spark plugs",
  "Honda Civic oil filter",
  "Audi A4 radiator",
  "Mercedes C-Class discs and pads",
  "Peugeot 206 water pump",
  "Renault Clio starter motor",
  "Nissan Qashqai wiper blades",
  "Land Rover Discovery coil spring",
  "Mini Cooper alternator",
  "Skoda Octavia DPF filter",
  "Seat Leon turbocharger",
  "Volvo V40 brake discs",
  "Citroen C3 fuel pump",
  "Fiat 500 headlight",
  "Hyundai i10 wheel bearing",
  "Kia Sportage suspension arm",
  "Mazda 3 EGR valve",
  "Subaru Impreza intercooler",
  "Jaguar XF battery",
  "Range Rover Sport air suspension",
  "Vauxhall Corsa wing mirror",
  "Ford Fiesta thermostat",
  "VW Passat MAF sensor",
  "BMW 1 Series exhaust",
  "Audi A3 ignition coil",
  "Toyota Corolla cabin filter",
  "Nissan Juke catalytic converter",
  "Honda Jazz steering rack",
  "Peugeot 308 alternator",
  "Renault Clio radiator",
  "Toyota Corolla timing chain",
  "Mercedes A-Class suspension arm",
  "Audi A3 alternator",
  "BMW 3 Series water pump",
  "Ford Fiesta clutch",
  "Vauxhall Insignia DPF filter",
  "Volkswagen Passat gearbox mount",
  "Honda Jazz brake discs",
  "Kia Sportage shock absorbers",
  "Hyundai Tucson air mass sensor",
  "SEAT Ibiza starter motor",
  "Skoda Octavia coolant pump",
  "Volvo XC60 serpentine belt",
  "Mazda 6 catalytic converter",
  "Subaru Forester head gasket",
  "Mini Cooper S turbocharger",
  "Jaguar XF air suspension compressor",
  "Range Rover Sport brake caliper",
  "Porsche Cayenne oil cooler",
  "Fiat 500 timing belt kit",
  "Alfa Romeo Giulia lambda sensor",
];

const QUICK_CHIPS = [
  "BMW brake pads",
  "Ford Focus clutch",
  "Oil filter",
  "Tyres",
];

const supplierCountFor = (s: string) => {
  // Deterministic pseudo-random count between 4 and 7 based on string hash
  let hash = 0;
  for (let i = 0; i < s.length; i++) hash = ((hash << 5) - hash + s.charCodeAt(i)) | 0;
  return 4 + (Math.abs(hash) % 4);
};

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const highlight = (text: string, query: string) => {
  const q = query.trim();
  if (!q) return text;
  try {
    const re = new RegExp(`(${escapeRegExp(q)})`, "ig");
    const parts = text.split(re);
    return parts.map((p, i) =>
      re.test(p) ? (
        <strong key={i} style={{ color: "#ffffff", fontWeight: 700 }}>
          {p}
        </strong>
      ) : (
        <span key={i} style={{ color: "#a1a1aa" }}>
          {p}
        </span>
      )
    );
  } catch {
    return text;
  }
};

interface Props {
  query: string;
  open: boolean;
  onSelect: (q: string) => void;
  onClose: () => void;
  /** Optional: register an external keydown handler from the input */
  inputRef?: React.RefObject<HTMLInputElement>;
}

const SearchAutocomplete = ({ query, open, onSelect, onClose, inputRef }: Props) => {
  const [activeIdx, setActiveIdx] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const trimmed = query.trim();
  const showSuggestions = trimmed.length >= 3;

  const matches = showSuggestions
    ? POPULAR_SEARCHES.filter((s) =>
        s.toLowerCase().includes(trimmed.toLowerCase())
      ).slice(0, 8)
    : [];

  const [recents, setRecents] = useState<string[]>([]);
  useEffect(() => {
    if (open && !showSuggestions) {
      setRecents(getRecentSearches().slice(0, 5));
    }
  }, [open, showSuggestions]);

  // Reset highlight when query changes
  useEffect(() => {
    setActiveIdx(-1);
  }, [query, open]);

  // Click outside to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(t) &&
        !(inputRef?.current && inputRef.current.contains(t))
      ) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose, inputRef]);

  // Keyboard navigation on the input
  useEffect(() => {
    const el = inputRef?.current;
    if (!el || !open) return;
    const handler = (e: KeyboardEvent) => {
      if (!showSuggestions || matches.length === 0) {
        if (e.key === "Escape") onClose();
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIdx((i) => (i + 1) % matches.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIdx((i) => (i <= 0 ? matches.length - 1 : i - 1));
      } else if (e.key === "Enter") {
        if (activeIdx >= 0 && activeIdx < matches.length) {
          e.preventDefault();
          onSelect(matches[activeIdx]);
        }
      } else if (e.key === "Escape") {
        onClose();
      }
    };
    el.addEventListener("keydown", handler);
    return () => el.removeEventListener("keydown", handler);
  }, [open, matches, activeIdx, showSuggestions, onSelect, onClose, inputRef]);

  if (!open) return null;

  return (
    <div
      ref={containerRef}
      className="absolute left-0 right-0 top-full mt-1.5 z-50 overflow-hidden"
      style={{
        background: "#111111",
        border: "1px solid #1f1f1f",
        borderRadius: "12px",
        maxHeight: 320,
        overflowY: "auto",
        boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
      }}
    >
      {showSuggestions ? (
        matches.length > 0 ? (
          <ul role="listbox">
            {matches.map((s, i) => (
              <li
                key={s}
                role="option"
                aria-selected={i === activeIdx}
                onMouseEnter={() => setActiveIdx(i)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onSelect(s);
                }}
                className="flex items-center justify-between cursor-pointer transition-colors"
                style={{
                  height: 44,
                  padding: "0 16px",
                  background:
                    i === activeIdx ? "rgba(255,255,255,0.04)" : "transparent",
                }}
              >
                <span className="flex items-center gap-3 min-w-0">
                  <Search size={14} style={{ color: "#52525b", flexShrink: 0 }} />
                  <span className="text-sm truncate">{highlight(s, trimmed)}</span>
                </span>
                <span
                  className="text-xs whitespace-nowrap ml-3"
                  style={{ color: "#52525b" }}
                >
                  {supplierCountFor(s)} suppliers
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <div
            className="flex items-center gap-2 text-sm"
            style={{ height: 44, padding: "0 16px", color: "#52525b" }}
          >
            No suggestions — press Enter to search "{trimmed}"
          </div>
        )
      ) : (
        <div className="p-3">
          {recents.length > 0 && (
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1.5 px-1">
                <span
                  style={{
                    fontSize: 12,
                    color: "#71717a",
                    fontWeight: 500,
                  }}
                >
                  Recent searches
                </span>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    clearRecentSearches();
                    setRecents([]);
                  }}
                  style={{
                    fontSize: 12,
                    color: "#71717a",
                    cursor: "pointer",
                    background: "transparent",
                    border: "none",
                    padding: 0,
                  }}
                  className="hover:!text-zinc-300 transition-colors"
                >
                  Clear all
                </button>
              </div>
              <ul>
                {recents.map((r) => (
                  <li
                    key={r}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      onSelect(r);
                    }}
                    className="flex items-center justify-between cursor-pointer transition-colors hover:bg-white/5"
                    style={{
                      height: 38,
                      padding: "0 8px",
                      borderRadius: 6,
                    }}
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      <Clock size={13} style={{ color: "#52525b", flexShrink: 0 }} />
                      <span
                        className="text-sm truncate"
                        style={{ color: "#a1a1aa" }}
                      >
                        {r}
                      </span>
                    </span>
                    <button
                      type="button"
                      aria-label={`Remove ${r}`}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        removeRecentSearch(r);
                        setRecents((prev) => prev.filter((it) => it !== r));
                      }}
                      className="opacity-50 hover:opacity-100 transition-opacity"
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "#71717a",
                        cursor: "pointer",
                        padding: 4,
                        marginRight: -4,
                      }}
                    >
                      <X size={13} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <p
            className="mb-2 px-1"
            style={{
              fontSize: 11,
              color: "#52525b",
              fontWeight: 600,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            Popular searches
          </p>
          <div className="flex flex-wrap gap-2">
            {QUICK_CHIPS.map((c) => (
              <button
                key={c}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onSelect(c);
                }}
                className="transition-colors hover:border-white/20 hover:text-white"
                style={{
                  background: "transparent",
                  border: "1px solid #1f1f1f",
                  borderRadius: 999,
                  color: "#71717a",
                  fontSize: 13,
                  padding: "6px 12px",
                  cursor: "pointer",
                }}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchAutocomplete;
