import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Cookie, X } from "lucide-react";
import { Link } from "react-router-dom";

const CONSENT_KEY = "partara_cookie_consent";

type Consent = {
  essential: true;
  functional: boolean;
  analytics: boolean;
  timestamp: string;
};

const getStoredConsent = (): Consent | null => {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const applyConsent = (consent: Consent) => {
  localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));

  // Enable/disable Google Analytics based on consent
  if (typeof window !== "undefined") {
    // GA opt-out
    (window as any)["ga-disable-G-YRZ3243HF0"] = !consent.analytics;

    if (!consent.analytics) {
      // Remove GA cookies
      document.cookie.split(";").forEach((c) => {
        const name = c.trim().split("=")[0];
        if (name.startsWith("_ga") || name.startsWith("_gid")) {
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        }
      });
    }
  }
};

const CookieConsent = () => {
  const [visible, setVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [functional, setFunctional] = useState(true);
  const [analytics, setAnalytics] = useState(true);

  useEffect(() => {
    const consent = getStoredConsent();
    if (!consent) {
      // Disable analytics by default until consent
      (window as any)["ga-disable-G-YRZ3243HF0"] = true;
      setVisible(true);
    } else {
      applyConsent(consent);
    }
  }, []);

  const save = useCallback(
    (func: boolean, anal: boolean) => {
      const consent: Consent = {
        essential: true,
        functional: func,
        analytics: anal,
        timestamp: new Date().toISOString(),
      };
      applyConsent(consent);
      setVisible(false);
      setShowPreferences(false);
    },
    []
  );

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-[100] p-4 md:p-6">
      <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-card/95 backdrop-blur-lg shadow-2xl shadow-black/40">
        {!showPreferences ? (
          /* ── Main banner ── */
          <div className="p-5 md:p-6">
            <div className="flex items-start gap-4">
              <div className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary mt-0.5">
                <Cookie size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm mb-1.5">We value your privacy</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  We use cookies to enhance your experience, remember your preferences, and analyse
                  site traffic. You can choose which cookies to allow.{" "}
                  <Link to="/privacy" className="text-primary hover:underline">
                    Privacy Policy
                  </Link>
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-4">
              <Button
                size="sm"
                variant="outline"
                className="text-xs order-3 sm:order-1"
                onClick={() => setShowPreferences(true)}
              >
                Manage Preferences
              </Button>
              <div className="flex gap-2 sm:ml-auto order-1 sm:order-2">
                <Button
                  size="sm"
                  variant="secondary"
                  className="flex-1 sm:flex-none text-xs"
                  onClick={() => save(false, false)}
                >
                  Reject All
                </Button>
                <Button
                  size="sm"
                  className="flex-1 sm:flex-none text-xs"
                  onClick={() => save(true, true)}
                >
                  Accept All
                </Button>
              </div>
            </div>
          </div>
        ) : (
          /* ── Preferences panel ── */
          <div className="p-5 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm">Cookie Preferences</h3>
              <button
                onClick={() => setShowPreferences(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Close preferences"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Essential */}
              <PreferenceRow
                title="Essential"
                description="Required for the website to function. Cannot be disabled."
                checked={true}
                disabled
              />
              {/* Functional */}
              <PreferenceRow
                title="Functional"
                description="Remember your preferences, theme, and display settings."
                checked={functional}
                onChange={setFunctional}
              />
              {/* Analytics */}
              <PreferenceRow
                title="Analytics"
                description="Help us understand how visitors use the site via Google Analytics."
                checked={analytics}
                onChange={setAnalytics}
              />
            </div>

            <div className="flex gap-2 mt-5">
              <Button
                size="sm"
                variant="secondary"
                className="flex-1 text-xs"
                onClick={() => save(false, false)}
              >
                Reject All
              </Button>
              <Button
                size="sm"
                className="flex-1 text-xs"
                onClick={() => save(functional, analytics)}
              >
                Save Preferences
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const PreferenceRow = ({
  title,
  description,
  checked,
  disabled,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (v: boolean) => void;
}) => (
  <div className="flex items-center justify-between gap-4">
    <div className="min-w-0">
      <p className="text-xs font-medium">{title}</p>
      <p className="text-[11px] text-muted-foreground leading-relaxed">{description}</p>
    </div>
    <Switch
      checked={checked}
      disabled={disabled}
      onCheckedChange={onChange}
      className="shrink-0"
    />
  </div>
);

export default CookieConsent;
