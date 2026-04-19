import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";

type FilterOption = { label: string; value: string; disabled?: boolean };

const FilterDropdown = ({
  label,
  options,
  value,
  onChange,
  alignRight,
}: {
  label: string;
  options: FilterOption[];
  value: string;
  onChange: (v: string) => void;
  alignRight?: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  const ref = useRef<HTMLDivElement>(null);

  const updatePos = useCallback(() => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setPos({
        top: rect.bottom + 8,
        left: alignRight ? rect.right - 180 : rect.left,
        width: Math.max(rect.width, 180),
      });
    }
  }, [alignRight]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (open) {
      updatePos();
      window.addEventListener("scroll", updatePos, true);
      window.addEventListener("resize", updatePos);
      return () => {
        window.removeEventListener("scroll", updatePos, true);
        window.removeEventListener("resize", updatePos);
      };
    }
  }, [open, updatePos]);

  const isActive = value !== options[0]?.value;

  return (
    <div ref={ref} className="shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex min-h-[44px] items-center gap-2 rounded-xl border px-4 py-2 text-sm whitespace-nowrap transition-all duration-200 ${
          isActive
            ? "border-red-500/40 bg-red-500/10 text-red-400"
            : "border-white/[0.08] bg-zinc-900/60 text-zinc-300 hover:border-white/20 hover:text-white"
        }`}
      >
        {isActive && <span className="h-2 w-2 rounded-full bg-red-500" />}
        <span>{label}</span>
        <ChevronDown
          size={14}
          className={`transition-transform duration-200 ${open ? "rotate-180 text-red-400" : "text-zinc-500"}`}
        />
      </button>

      {open && createPortal(
        <div
          style={{
            position: "fixed",
            zIndex: 9999,
            top: pos.top,
            left: pos.left,
            minWidth: pos.width,
          }}
          className="rounded-2xl border border-white/10 bg-zinc-900 p-2 shadow-2xl max-h-[360px] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                if (opt.disabled) return;
                onChange(opt.value);
                setOpen(false);
              }}
              disabled={opt.disabled}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all min-h-[44px] flex items-center ${
                opt.disabled
                  ? "text-zinc-600 opacity-50 cursor-not-allowed"
                  :
                value === opt.value
                  ? "bg-red-600/20 text-red-400 font-medium"
                  : "text-zinc-300 hover:bg-zinc-800 hover:text-white"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
};

interface FilterBarProps {
  conditionFilter: string;
  setConditionFilter: (v: string) => void;
  shippingFilter: string;
  setShippingFilter: (v: string) => void;
  priceRangeIdx: number;
  setPriceRangeIdx: (v: number) => void;
  categoryFilter: string;
  setCategoryFilter: (v: string) => void;
  brandFilter: string;
  setBrandFilter: (v: string) => void;
  sortBy: string;
  setSortBy: (v: string) => void;
  activeFilterCount: number;
  clearAllFilters: () => void;
  shipsToLabel: string;
  priceRanges: readonly { label: string; min: number; max: number }[];
  sortOptions: readonly { value: string; label: string; icon: string }[];
  partCategories: readonly { label: string; icon: string }[];
}

const CONDITION_OPTIONS: FilterOption[] = [
  { label: "All Conditions", value: "All" },
  { label: "New", value: "New" },
  { label: "Used", value: "Used" },
  { label: "Refurbished", value: "Refurbished" },
];

const BRAND_OPTIONS: FilterOption[] = [
  { label: "All Suppliers", value: "All" },
  { label: "🌍 eBay Global", value: "eBay" },
  { label: "🔩 Green Spark Plug Co. (Classic & Vintage)", value: "Green Spark Plug Co." },
  { label: "🇬🇧 mytyres.co.uk", value: "mytyres.co.uk" },
  { label: "🌍 Tyres UK (Tyres.net)", value: "Tyres UK" },
  { label: "🇪🇸 neumaticos-online.es", value: "neumaticos-online.es" },
  { label: "🇮🇹 Pneumatici IT", value: "Pneumatici IT" },
  { label: "🇪🇪 ReifenDirekt EE", value: "ReifenDirekt EE" },
  { label: "Amazon · Coming soon", value: "Amazon", disabled: true },
  { label: "Euro Car Parts · Coming soon", value: "Euro Car Parts", disabled: true },
  { label: "GSF Car Parts · Coming soon", value: "GSF Car Parts", disabled: true },
  { label: "Autodoc · Coming soon", value: "Autodoc", disabled: true },
  { label: "Halfords · Coming soon", value: "Halfords", disabled: true },
  { label: "Black Circles · Coming soon", value: "Black Circles", disabled: true },
];

const FilterBar = ({
  conditionFilter,
  setConditionFilter,
  shippingFilter,
  setShippingFilter,
  priceRangeIdx,
  setPriceRangeIdx,
  categoryFilter,
  setCategoryFilter,
  brandFilter,
  setBrandFilter,
  sortBy,
  setSortBy,
  activeFilterCount,
  clearAllFilters,
  shipsToLabel,
  priceRanges,
  sortOptions,
  partCategories,
}: FilterBarProps) => {
  const shippingOptions: FilterOption[] = [
    { label: "All", value: "All" },
    { label: "⚡ Free Shipping", value: "Free Shipping" },
    { label: `📦 Ships to ${shipsToLabel}`, value: "Ships to Country" },
    { label: "🚀 Fast (< 5 days)", value: "Fast" },
  ];

  const priceOptions: FilterOption[] = priceRanges.map((r, i) => ({
    label: r.label,
    value: String(i),
  }));

  const categoryOptions: FilterOption[] = partCategories.map((c) => ({
    label: `${c.icon} ${c.label}`,
    value: c.label,
  }));

  const sortFilterOptions: FilterOption[] = sortOptions.map((s) => ({
    label: `${s.icon} ${s.label}`,
    value: s.value,
  }));

  const currentSortLabel = sortOptions.find((s) => s.value === sortBy)?.label || "Best Match";

  return (
    <div className="bg-[#111]/40 backdrop-blur-sm border border-white/[0.06] rounded-2xl px-3 py-2.5 mb-6">
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
        {activeFilterCount > 0 && (
          <div className="flex items-center gap-1.5 shrink-0 pr-2 border-r border-white/10">
            <span className="bg-red-600 text-white text-[10px] font-bold rounded-full px-2 py-0.5">
              {activeFilterCount}
            </span>
            <button
              onClick={clearAllFilters}
              className="text-[11px] text-zinc-500 hover:text-white transition-colors whitespace-nowrap"
            >
              Clear all
            </button>
          </div>
        )}

        <FilterDropdown
          label="Condition"
          options={CONDITION_OPTIONS}
          value={conditionFilter}
          onChange={setConditionFilter}
        />

        <FilterDropdown
          label="Shipping"
          options={shippingOptions}
          value={shippingFilter}
          onChange={setShippingFilter}
        />

        <FilterDropdown
          label="Price"
          options={priceOptions}
          value={String(priceRangeIdx)}
          onChange={(v) => setPriceRangeIdx(Number(v))}
        />

        <FilterDropdown
          label="Category"
          options={categoryOptions}
          value={categoryFilter}
          onChange={setCategoryFilter}
        />

        <FilterDropdown
          label="Supplier"
          options={BRAND_OPTIONS}
          value={brandFilter}
          onChange={setBrandFilter}
        />

        <div className="flex-1" />
        <div className="border-l border-white/10 h-6 shrink-0 hidden sm:block" />

        <FilterDropdown
          label={`Sort: ${currentSortLabel}`}
          options={sortFilterOptions}
          value={sortBy}
          onChange={setSortBy}
          alignRight
        />
      </div>
    </div>
  );
};

export default FilterBar;
