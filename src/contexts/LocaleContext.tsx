import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useCountry, SUPPORTED_COUNTRIES, type Country } from "@/contexts/CountryContext";

// ── Currency config ──
const COUNTRY_CURRENCY: Record<string, { code: string; symbol: string }> = {
  GB: { code: "GBP", symbol: "£" },
  US: { code: "USD", symbol: "$" },
  DE: { code: "EUR", symbol: "€" },
  FR: { code: "EUR", symbol: "€" },
  IT: { code: "EUR", symbol: "€" },
  ES: { code: "EUR", symbol: "€" },
  AU: { code: "AUD", symbol: "A$" },
  CA: { code: "CAD", symbol: "C$" },
};

// ── Language config ──
const COUNTRY_LANG: Record<string, string> = {
  GB: "en", US: "en", CA: "en", AU: "en",
  DE: "de", FR: "fr", IT: "it", ES: "es",
};

// ── Translations ──
type TranslationKey = "new" | "used" | "not_specified" | "great_price" | "good_price" | "high_price"
  | "free_shipping" | "ships_to" | "no_ship" | "shipping_check" | "handling_days" | "est_delivery" | "top_rated" | "in_stock" | "left_only";

const TRANSLATIONS: Record<string, Record<TranslationKey, string>> = {
  en: {
    new: "New", used: "Used", not_specified: "Not specified",
    great_price: "Great Price", good_price: "Good Price", high_price: "High Price",
    free_shipping: "Free P&P", ships_to: "Ships to", no_ship: "Doesn't ship to",
    shipping_check: "Shipping: check listing", handling_days: "d handling",
    est_delivery: "Est. delivery", top_rated: "Top Rated", in_stock: "In stock",
    left_only: "Only {n} left",
  },
  de: {
    new: "Neu", used: "Gebraucht", not_specified: "Nicht angegeben",
    great_price: "Top-Preis", good_price: "Guter Preis", high_price: "Hoher Preis",
    free_shipping: "Kostenloser Versand", ships_to: "Versand nach", no_ship: "Kein Versand nach",
    shipping_check: "Versand: siehe Angebot", handling_days: "T Bearbeitung",
    est_delivery: "Voraussichtl. Lieferung", top_rated: "Top-Bewertung", in_stock: "Auf Lager",
    left_only: "Nur {n} übrig",
  },
  fr: {
    new: "Neuf", used: "Occasion", not_specified: "Non spécifié",
    great_price: "Excellent prix", good_price: "Bon prix", high_price: "Prix élevé",
    free_shipping: "Livraison gratuite", ships_to: "Expédié vers", no_ship: "Pas d'expédition vers",
    shipping_check: "Livraison : voir annonce", handling_days: "j de traitement",
    est_delivery: "Livraison estimée", top_rated: "Vendeur Top", in_stock: "En stock",
    left_only: "Plus que {n}",
  },
  it: {
    new: "Nuovo", used: "Usato", not_specified: "Non specificato",
    great_price: "Ottimo prezzo", good_price: "Buon prezzo", high_price: "Prezzo alto",
    free_shipping: "Spedizione gratuita", ships_to: "Spedisce in", no_ship: "Non spedisce in",
    shipping_check: "Spedizione: vedi annuncio", handling_days: "g lavorazione",
    est_delivery: "Consegna stimata", top_rated: "Top", in_stock: "Disponibile",
    left_only: "Solo {n} rimasti",
  },
  es: {
    new: "Nuevo", used: "Usado", not_specified: "No especificado",
    great_price: "Gran precio", good_price: "Buen precio", high_price: "Precio alto",
    free_shipping: "Envío gratis", ships_to: "Envío a", no_ship: "Sin envío a",
    shipping_check: "Envío: ver anuncio", handling_days: "d de preparación",
    est_delivery: "Entrega estimada", top_rated: "Top Ventas", in_stock: "En stock",
    left_only: "Solo quedan {n}",
  },
};

// ── Exchange rates ──
const LS_RATES_KEY = "partara_exchange_rates";
const LS_RATES_TS = "partara_exchange_rates_ts";
const RATES_TTL = 6 * 60 * 60 * 1000; // 6h

interface ExchangeRates {
  [from_to: string]: number; // e.g. "GBP_EUR": 1.17
}

async function fetchRates(): Promise<ExchangeRates> {
  try {
    const stored = localStorage.getItem(LS_RATES_KEY);
    const ts = Number(localStorage.getItem(LS_RATES_TS) || "0");
    if (stored && Date.now() - ts < RATES_TTL) return JSON.parse(stored);
  } catch {}

  const rates: ExchangeRates = {};
  const bases = ["GBP", "EUR", "USD", "AUD", "CAD"];
  try {
    // Use a single base call for GBP and compute cross rates
    const res = await fetch("https://api.exchangerate-api.com/v4/latest/GBP");
    if (res.ok) {
      const data = await res.json();
      for (const target of bases) {
        if (target !== "GBP" && data.rates[target]) {
          rates[`GBP_${target}`] = data.rates[target];
          rates[`${target}_GBP`] = 1 / data.rates[target];
        }
      }
      // Cross rates
      for (const a of bases) {
        for (const b of bases) {
          if (a !== b && !rates[`${a}_${b}`]) {
            const aToGbp = rates[`${a}_GBP`] || (a === "GBP" ? 1 : undefined);
            const gbpToB = rates[`GBP_${b}`] || (b === "GBP" ? 1 : undefined);
            if (aToGbp && gbpToB) rates[`${a}_${b}`] = aToGbp * gbpToB;
          }
        }
      }
      try {
        localStorage.setItem(LS_RATES_KEY, JSON.stringify(rates));
        localStorage.setItem(LS_RATES_TS, String(Date.now()));
      } catch {}
    }
  } catch {}
  return rates;
}

// ── Context ──
const LS_LOCATION = "partara_location_country";

interface LocaleContextValue {
  /** User's physical location country code (ISO). Falls back to marketplace. */
  locationCountry: string;
  /** Language code derived from physical location */
  lang: string;
  /** Currency for display, from physical location */
  currency: { code: string; symbol: string };
  /** Marketplace currency (from the eBay marketplace being searched) */
  marketplaceCurrency: { code: string; symbol: string };
  /** Translate a key */
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
  /** Convert amount from marketplace currency to user's local currency. Returns null if same currency or no rate. */
  convertPrice: (amount: number) => { converted: number; symbol: string; code: string } | null;
  /** Format price with appropriate currency symbol */
  formatPrice: (amount: number, currencyCode?: string) => string;
  /** Get country name from code */
  getCountryName: (code: string) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const { country, hasChosenCountry } = useCountry();

  const [locationCountry, setLocationCountry] = useState<string>(() => {
    try {
      return localStorage.getItem(LS_LOCATION) || country.code;
    } catch { return country.code; }
  });

  const [rates, setRates] = useState<ExchangeRates>({});

  // Load exchange rates on mount
  useEffect(() => {
    fetchRates().then(setRates);
  }, []);

  // When geolocation detects location, store it
  useEffect(() => {
    // If the user hasn't explicitly chosen a country and geolocation was used,
    // the CountryContext detectLocation sets the country. We listen for the LS key.
    const handleStorage = () => {
      try {
        const loc = localStorage.getItem(LS_LOCATION);
        if (loc) setLocationCountry(loc);
      } catch {}
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // If user denied location, fall back to marketplace country
  const effectiveLocation = locationCountry || country.code;
  const lang = COUNTRY_LANG[effectiveLocation] || "en";
  const currency = COUNTRY_CURRENCY[effectiveLocation] || COUNTRY_CURRENCY.GB;
  const marketplaceCurrency = COUNTRY_CURRENCY[country.code] || COUNTRY_CURRENCY.GB;

  const t = useCallback((key: TranslationKey, vars?: Record<string, string | number>): string => {
    const dict = TRANSLATIONS[lang] || TRANSLATIONS.en;
    let str = dict[key] || TRANSLATIONS.en[key] || key;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        str = str.replace(`{${k}}`, String(v));
      }
    }
    return str;
  }, [lang]);

  const convertPrice = useCallback((amount: number): { converted: number; symbol: string; code: string } | null => {
    if (marketplaceCurrency.code === currency.code) return null;
    const rateKey = `${marketplaceCurrency.code}_${currency.code}`;
    const rate = rates[rateKey];
    if (!rate) return null;
    return { converted: Math.round(amount * rate * 100) / 100, symbol: currency.symbol, code: currency.code };
  }, [marketplaceCurrency.code, currency.code, currency.symbol, rates]);

  const formatPrice = useCallback((amount: number, code?: string): string => {
    const sym = code ? (Object.values(COUNTRY_CURRENCY).find(c => c.code === code)?.symbol || "£") : marketplaceCurrency.symbol;
    return `${sym}${amount.toFixed(2)}`;
  }, [marketplaceCurrency.symbol]);

  const getCountryName = useCallback((code: string): string => {
    return SUPPORTED_COUNTRIES.find(c => c.code === code)?.name || code;
  }, []);

  return (
    <LocaleContext.Provider value={{
      locationCountry: effectiveLocation,
      lang,
      currency,
      marketplaceCurrency,
      t,
      convertPrice,
      formatPrice,
      getCountryName,
    }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}

/** Call this when geolocation detects a country */
export function setDetectedLocation(countryCode: string) {
  try { localStorage.setItem(LS_LOCATION, countryCode); } catch {}
}
