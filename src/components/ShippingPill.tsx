// Styled shipping pill used on affiliate product cards across search results.
// Single source of truth for "Ships worldwide" / "UK only" / etc. badges.

type Tone = "green" | "blue" | "grey";

interface BadgeConfig {
  label: string;
  tone: Tone;
  shipsTo: string; // for tooltips
}

// Keyed by lower-cased supplier name. Match by exact key OR substring fallback.
const BADGES: Record<string, BadgeConfig> = {
  "green spark plug co.": { label: "🌍 Ships worldwide", tone: "green", shipsTo: "Worldwide" },
  "maxpeedingrods":       { label: "🌍 Ships worldwide", tone: "green", shipsTo: "Worldwide" },
  "mytyres.co.uk":        { label: "🇬🇧 UK only",        tone: "blue",  shipsTo: "UK only" },
  "tyres uk":             { label: "🇬🇧 UK only",        tone: "blue",  shipsTo: "UK only" },
  "ev king":              { label: "🇬🇧 UK + EU",        tone: "blue",  shipsTo: "UK + EU" },
  "amazon uk":            { label: "🇬🇧 UK + EU",        tone: "blue",  shipsTo: "UK + EU" },
  "pneumatici it":        { label: "🇪🇺 EU only",        tone: "blue",  shipsTo: "Italy + EU" },
  "neumaticos-online.es": { label: "🇪🇺 EU only",        tone: "blue",  shipsTo: "Spain + EU" },
  "reifendirekt ee":      { label: "🇪🇺 EU only",        tone: "blue",  shipsTo: "Germany + EU" },
  "autobandenmarkt":      { label: "🇪🇺 EU only",        tone: "blue",  shipsTo: "Belgium + EU" },
  "kohl automobile":      { label: "🇩🇪 DE + EU",        tone: "blue",  shipsTo: "Germany + EU" },
  "tirendo":              { label: "🇳🇴 Norway only",    tone: "grey",  shipsTo: "Norway only" },
  "dunford inc":          { label: "🇺🇸 US only",        tone: "grey",  shipsTo: "US only" },
  "ebay":                 { label: "🌍 Varies by seller", tone: "grey", shipsTo: "Varies by seller" },
  "ebay global":          { label: "🌍 Varies by seller", tone: "grey", shipsTo: "Varies by seller" },
};

export function getShippingBadge(supplierName: string | undefined | null): BadgeConfig | null {
  if (!supplierName) return null;
  const key = supplierName.toLowerCase().trim();
  if (BADGES[key]) return BADGES[key];
  // Substring fallback (handles "Green Spark Plug Co. (Affiliate)" etc.)
  for (const [k, v] of Object.entries(BADGES)) {
    if (key.includes(k) || k.includes(key)) return v;
  }
  return null;
}

const TONE_CLASSES: Record<Tone, string> = {
  green: "bg-emerald-600/15 text-emerald-400 border-emerald-500/30",
  blue:  "bg-sky-600/15 text-sky-400 border-sky-500/30",
  grey:  "bg-zinc-700/30 text-zinc-300 border-zinc-500/30",
};

interface Props {
  supplierName: string | undefined | null;
  className?: string;
}

const ShippingPill = ({ supplierName, className = "" }: Props) => {
  const badge = getShippingBadge(supplierName);
  if (!badge) return null;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[11px] font-semibold ${TONE_CLASSES[badge.tone]} ${className}`}
    >
      {badge.label}
    </span>
  );
};

export default ShippingPill;
