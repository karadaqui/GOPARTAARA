import { useState, useRef, useCallback, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { useCountry, SUPPORTED_COUNTRIES } from "@/hooks/useCountry";

const CountrySelector = () => {
  const { country, setCountry } = useCountry();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors py-1 px-2 rounded-lg hover:bg-accent/10"
      >
        <span className="text-base">{country.flag}</span>
        <span className="hidden lg:inline">{country.code}</span>
        <ChevronDown
          size={12}
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute top-full right-0 pt-2 w-52 z-50">
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
                <span className="text-base">{c.flag}</span>
                <span>{c.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CountrySelector;
