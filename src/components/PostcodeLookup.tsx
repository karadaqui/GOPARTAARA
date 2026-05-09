import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Search, Loader2, CheckCircle2 } from "lucide-react";
import { lookupUKPostcode, searchPhoton, type AddressSuggestion } from "@/lib/addressLookup";
import { isValidUKPostcode } from "@/lib/addressValidation";

interface Props {
  value: string;
  country?: string;          // ISO-2; if "GB" we use postcodes.io
  onChange: (v: string) => void;
  onSelect: (s: AddressSuggestion) => void;
  placeholder?: string;
  verified?: boolean;        // show "Address verified ✓" badge
}

export default function PostcodeLookup({ value, country = "GB", onChange, onSelect, placeholder, verified }: Props) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (value.trim().length < 3) { setSuggestions([]); return; }
    debounceRef.current = window.setTimeout(async () => {
      setLoading(true);
      const isUK = country === "GB" || country === "United Kingdom";
      const results = isUK && isValidUKPostcode(value)
        ? await lookupUKPostcode(value)
        : await searchPhoton(value);
      setSuggestions(results);
      setLoading(false);
      setOpen(results.length > 0);
    }, 350);
    return () => { if (debounceRef.current) window.clearTimeout(debounceRef.current); };
  }, [value, country]);

  return (
    <div className="relative">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={placeholder || (country === "GB" ? "Type postcode (e.g. SW1A 1AA)" : "Type address…")}
          className="bg-secondary border-border rounded-xl pl-9 pr-9"
          autoComplete="off"
        />
        {loading && <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-muted-foreground" />}
        {!loading && verified && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 text-[11px] text-green-600">
            <CheckCircle2 size={12} /> verified
          </span>
        )}
      </div>
      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full max-h-60 overflow-auto rounded-xl border border-border bg-card shadow-lg">
          {suggestions.map((s, i) => (
            <li key={i}>
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); onSelect(s); setOpen(false); }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-secondary"
              >
                {s.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
