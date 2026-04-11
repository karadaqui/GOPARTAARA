import { useState, useEffect, useCallback } from "react";

export interface Country {
  code: string;
  name: string;
  flag: string;
  ebayMarketplace: string;
}

export const SUPPORTED_COUNTRIES: Country[] = [
  { code: "GB", name: "United Kingdom", flag: "🇬🇧", ebayMarketplace: "EBAY_GB" },
  { code: "DE", name: "Germany", flag: "🇩🇪", ebayMarketplace: "EBAY_DE" },
  { code: "FR", name: "France", flag: "🇫🇷", ebayMarketplace: "EBAY_FR" },
  { code: "IT", name: "Italy", flag: "🇮🇹", ebayMarketplace: "EBAY_IT" },
  { code: "ES", name: "Spain", flag: "🇪🇸", ebayMarketplace: "EBAY_ES" },
  { code: "AU", name: "Australia", flag: "🇦🇺", ebayMarketplace: "EBAY_AU" },
  { code: "US", name: "United States", flag: "🇺🇸", ebayMarketplace: "EBAY_US" },
  { code: "CA", name: "Canada", flag: "🇨🇦", ebayMarketplace: "EBAY_ENCA" },
];

const LS_KEY = "partara_country";
const LS_BANNER_DISMISSED = "partara_location_banner_dismissed";
const SS_NUDGE_DISMISSED = "partara_location_nudge_dismissed";

const DEFAULT_COUNTRY = SUPPORTED_COUNTRIES[0]; // GB

function getStoredCountry(): Country | null {
  try {
    const stored = localStorage.getItem(LS_KEY);
    if (stored) {
      const found = SUPPORTED_COUNTRIES.find((c) => c.code === stored);
      if (found) return found;
    }
  } catch {}
  return null;
}

export function useCountry() {
  const [country, setCountryState] = useState<Country>(
    () => getStoredCountry() || DEFAULT_COUNTRY
  );
  const [bannerDismissed, setBannerDismissed] = useState(() => {
    try {
      return localStorage.getItem(LS_BANNER_DISMISSED) === "true";
    } catch {
      return false;
    }
  });
  const [nudgeDismissed, setNudgeDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(SS_NUDGE_DISMISSED) === "true";
    } catch {
      return false;
    }
  });
  const [hasChosenCountry, setHasChosenCountry] = useState(
    () => !!getStoredCountry()
  );

  const setCountry = useCallback((c: Country) => {
    setCountryState(c);
    setHasChosenCountry(true);
    try {
      localStorage.setItem(LS_KEY, c.code);
      localStorage.setItem(LS_BANNER_DISMISSED, "true");
    } catch {}
    setBannerDismissed(true);
  }, []);

  const dismissBanner = useCallback(() => {
    setBannerDismissed(true);
    try {
      localStorage.setItem(LS_BANNER_DISMISSED, "true");
    } catch {}
  }, []);

  const dismissNudge = useCallback(() => {
    setNudgeDismissed(true);
    try {
      sessionStorage.setItem(SS_NUDGE_DISMISSED, "true");
    } catch {}
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
            // Use a free reverse geocoding API
            const res = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&localityLanguage=en`
            );
            const data = await res.json();
            const countryCode = data.countryCode;
            const found = SUPPORTED_COUNTRIES.find(
              (c) => c.code === countryCode
            );
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

  return {
    country,
    setCountry,
    bannerDismissed,
    dismissBanner,
    nudgeDismissed,
    dismissNudge,
    hasChosenCountry,
    detectLocation,
    showBanner: !bannerDismissed && !hasChosenCountry,
    showNudge: !hasChosenCountry && bannerDismissed && !nudgeDismissed,
  };
}
