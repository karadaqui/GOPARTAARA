import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export interface Country {
  code: string;
  name: string;
  flag: string;
  ebayMarketplace: string;
}

export const GLOBAL_MARKETPLACE: Country = {
  code: "GLOBAL",
  name: "Global",
  flag: "🌍",
  ebayMarketplace: "EBAY_ENTH",
};

export const SUPPORTED_COUNTRIES: Country[] = [
  { code: "GB", name: "United Kingdom", flag: "🇬🇧", ebayMarketplace: "EBAY_GB" },
  { code: "DE", name: "Germany", flag: "🇩🇪", ebayMarketplace: "EBAY_DE" },
  { code: "FR", name: "France", flag: "🇫🇷", ebayMarketplace: "EBAY_FR" },
  { code: "IT", name: "Italy", flag: "🇮🇹", ebayMarketplace: "EBAY_IT" },
  { code: "ES", name: "Spain", flag: "🇪🇸", ebayMarketplace: "EBAY_ES" },
  { code: "LV", name: "Latvia", flag: "🇱🇻", ebayMarketplace: "EBAY_GB" },
  { code: "AU", name: "Australia", flag: "🇦🇺", ebayMarketplace: "EBAY_AU" },
  { code: "US", name: "United States", flag: "🇺🇸", ebayMarketplace: "EBAY_US" },
  { code: "CA", name: "Canada", flag: "🇨🇦", ebayMarketplace: "EBAY_ENCA" },
];

/** All selectable options including Global */
export const ALL_MARKETPLACE_OPTIONS: Country[] = [GLOBAL_MARKETPLACE, ...SUPPORTED_COUNTRIES];

const LS_MARKETPLACE_KEY = "partara_selected_marketplace";
const LS_BANNER_DISMISSED = "partara_location_banner_dismissed";
const SS_NUDGE_DISMISSED = "partara_location_nudge_dismissed";
const DEFAULT_COUNTRY = SUPPORTED_COUNTRIES[0]; // GB

function getStoredMarketplace(): Country | null {
  try {
    const stored = localStorage.getItem(LS_MARKETPLACE_KEY);
    if (stored) {
      if (stored === "GLOBAL") return GLOBAL_MARKETPLACE;
      const found = SUPPORTED_COUNTRIES.find((c) => c.code === stored);
      if (found) return found;
    }
    // Migrate old key
    const old = localStorage.getItem("partara_country");
    if (old) {
      localStorage.removeItem("partara_country");
      const found = SUPPORTED_COUNTRIES.find((c) => c.code === old);
      if (found) {
        localStorage.setItem(LS_MARKETPLACE_KEY, found.code);
        return found;
      }
    }
  } catch {}
  return null;
}

/** Twemoji CDN URL for a country code */
export function getTwemojiUrl(countryCode: string): string {
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((c) => (0x1f1e6 + c.charCodeAt(0) - 65).toString(16))
    .join("-");
  return `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/${codePoints}.png`;
}

/** Detect if platform likely doesn't render flag emojis (Windows) */
export function useNeedsFlagPolyfill(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Win/i.test(navigator.userAgent);
}

interface CountryContextValue {
  /** The selected marketplace (for eBay search) */
  country: Country;
  setCountry: (c: Country) => void;
  showBanner: boolean;
  dismissBanner: () => void;
  showNudge: boolean;
  dismissNudge: () => void;
  hasChosenCountry: boolean;
  detectLocation: () => Promise<Country>;
  selectorHighlighted: boolean;
  setSelectorHighlighted: (v: boolean) => void;
  isGlobal: boolean;
}

const CountryContext = createContext<CountryContextValue | null>(null);

export function CountryProvider({ children }: { children: ReactNode }) {
  const [country, setCountryState] = useState<Country>(
    () => getStoredMarketplace() || DEFAULT_COUNTRY
  );
  const [bannerDismissed, setBannerDismissed] = useState(() => {
    try { return localStorage.getItem(LS_BANNER_DISMISSED) === "true"; } catch { return false; }
  });
  const [nudgeDismissed, setNudgeDismissed] = useState(() => {
    try { return sessionStorage.getItem(SS_NUDGE_DISMISSED) === "true"; } catch { return false; }
  });
  const [hasChosenCountry, setHasChosenCountry] = useState(() => !!getStoredMarketplace());
  const [selectorHighlighted, setSelectorHighlighted] = useState(false);

  const setCountry = useCallback((c: Country) => {
    setCountryState(c);
    setHasChosenCountry(true);
    setSelectorHighlighted(false);
    try {
      localStorage.setItem(LS_MARKETPLACE_KEY, c.code);
      localStorage.setItem(LS_BANNER_DISMISSED, "true");
    } catch {}
    setBannerDismissed(true);
  }, []);

  const dismissBanner = useCallback(() => {
    setBannerDismissed(true);
    try { localStorage.setItem(LS_BANNER_DISMISSED, "true"); } catch {}
  }, []);

  const dismissNudge = useCallback(() => {
    setNudgeDismissed(true);
    try { sessionStorage.setItem(SS_NUDGE_DISMISSED, "true"); } catch {}
  }, []);

  const detectLocation = useCallback((): Promise<Country> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation not supported"));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const res = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&localityLanguage=en`
            );
            const data = await res.json();
            const found = SUPPORTED_COUNTRIES.find((c) => c.code === data.countryCode);
            resolve(found || DEFAULT_COUNTRY);
          } catch {
            resolve(DEFAULT_COUNTRY);
          }
        },
        () => reject(new Error("Permission denied")),
        { timeout: 10000 }
      );
    });
  }, []);

  return (
    <CountryContext.Provider
      value={{
        country,
        setCountry,
        showBanner: !bannerDismissed && !hasChosenCountry,
        dismissBanner,
        showNudge: !hasChosenCountry && bannerDismissed && !nudgeDismissed,
        dismissNudge,
        hasChosenCountry,
        detectLocation,
        selectorHighlighted,
        setSelectorHighlighted,
        isGlobal: country.code === "GLOBAL",
      }}
    >
      {children}
    </CountryContext.Provider>
  );
}

export function useCountry() {
  const ctx = useContext(CountryContext);
  if (!ctx) throw new Error("useCountry must be used within CountryProvider");
  return ctx;
}
