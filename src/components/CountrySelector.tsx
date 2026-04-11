import { useState, useRef, useCallback, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { useCountry, SUPPORTED_COUNTRIES } from "@/hooks/useCountry";
import CountryFlag from "@/components/CountryFlag";

const CountrySelector = () => {
  const { country, setCountry, selectorHighlighted, setSelectorHighlighted } = useCountry();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // When highlighted externally (e.g. "Choose Manually"), auto-open
  useEffect(() => {
    if (selectorHighlighted) {
      setOpen(true);
      // Clear highlight after 3 seconds
      const t = setTimeout(() => setSelectorHighlighted(false), 3000);
      return () => clearTimeout(t);
    }
  }, [selectorHighlighted, setSelectorHighlighted]);

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (ref.current && !ref.current.contains(e.target as Node)) {
      setOpen(false);
    }
  }, []);

  useEffect(() => {
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, handleClickOutside]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-all py-1 px-2 rounded-lg hover:bg-accent/10 ${
          selectorHighlighted ? "ring-2 ring-primary/60 animate-pulse" : ""
        }`}
      >
        <CountryFlag countryCode={country.code} emoji={country.flag} size={18} />
        <span className="hidden lg:inline">{country.code}</span>
        <ChevronDown
          size={12}
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute top-full right-0 pt-2 w-56 z-50">
          <div className="rounded-xl border border-border/60 bg-popover/95 backdrop-blur-xl p-1.5 shadow-xl shadow-background/40 animate-in fade-in-0 zoom-in-95">
            <p className="px-3 py-1.5 text-xs text-muted-foreground uppercase tracking-wider">
              Select Country
            </p>
            {SUPPORTED_COUNTRIES.map((c) => (
              <button
                key={c.code}
                onClick={() => {
                  setCountry(c);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  c.code === country.code
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-popover-foreground hover:bg-accent/10"
                }`}
              >
                <CountryFlag countryCode={c.code} emoji={c.flag} size={20} />
                <span className="flex-1">{c.name}</span>
                <span className="text-xs text-muted-foreground">{c.code}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CountrySelector;
