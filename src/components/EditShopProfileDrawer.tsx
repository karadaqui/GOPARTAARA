import { useState, useEffect, useMemo } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  X, ArrowLeft, ArrowRight, Save, Loader2, Store, Lock, MapPin, Truck,
  Building2, Search, Globe, Check,
} from "lucide-react";
import { COUNTRIES } from "@/lib/countries";
import PostcodeLookup from "@/components/PostcodeLookup";
import { SENDER_COUNTRIES } from "@/components/SenderAddressFields";
import {
  COUNTRY_LIST, EU_CODES, ALL_CODES, POPULAR_CODES, getCountry, countryLabel,
} from "@/lib/countriesData";

export interface OpeningHourDay {
  open: boolean;
  from: string; // "09:00"
  to: string;   // "17:30"
}
export type OpeningHours = Record<"mon"|"tue"|"wed"|"thu"|"fri"|"sat"|"sun", OpeningHourDay>;

export interface CollectionAddress {
  business_name: string;
  street1: string;
  street2: string;
  city: string;
  county: string;
  postcode: string;
  country: string; // ISO-2
}

export const EMPTY_COLLECTION_ADDRESS: CollectionAddress = {
  business_name: "", street1: "", street2: "", city: "", county: "", postcode: "", country: "GB",
};

export const DEFAULT_OPENING_HOURS: OpeningHours = {
  mon: { open: true, from: "09:00", to: "17:30" },
  tue: { open: true, from: "09:00", to: "17:30" },
  wed: { open: true, from: "09:00", to: "17:30" },
  thu: { open: true, from: "09:00", to: "17:30" },
  fri: { open: true, from: "09:00", to: "17:30" },
  sat: { open: false, from: "09:00", to: "17:30" },
  sun: { open: false, from: "09:00", to: "17:30" },
};

const DAYS: { key: keyof OpeningHours; label: string }[] = [
  { key: "mon", label: "Monday" },
  { key: "tue", label: "Tuesday" },
  { key: "wed", label: "Wednesday" },
  { key: "thu", label: "Thursday" },
  { key: "fri", label: "Friday" },
  { key: "sat", label: "Saturday" },
  { key: "sun", label: "Sunday" },
];

const TIME_OPTIONS: string[] = (() => {
  const out: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 30]) {
      out.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return out;
})();

interface ProfileForm {
  business_name: string; description: string; contact_email: string; contact_phone: string; website_url: string;
  bank_account_name: string; bank_sort_code: string; bank_account_number: string; bank_paypal_email: string;
  ships_to: string[]; country: string;
  sender_name: string; sender_company: string; sender_street1: string; sender_street2: string;
  sender_city: string; sender_state: string; sender_zip: string; sender_country: string; sender_phone: string;
  offers_collection: boolean;
  collection_address: CollectionAddress;
  collection_instructions: string;
  collection_window: string;
  opening_hours: OpeningHours;
  collection_contact_name: string;
  collection_contact_phone: string;
  dispatch_time?: string;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  value: ProfileForm;
  onChange: (patch: Partial<ProfileForm>) => void;
  onSave: () => Promise<void> | void;
  saving?: boolean;
}

const STEPS = [
  { id: 1, title: "Shop Info", icon: Store, hint: "Tell buyers who you are" },
  { id: 2, title: "Location & Shipping", icon: Truck, hint: "Where and how you ship" },
  { id: 3, title: "Sender Address", icon: MapPin, hint: "Used for shipping labels" },
  { id: 4, title: "Collection & Payment", icon: Building2, hint: "How buyers pay & pickup" },
];

export default function EditShopProfileDrawer({ open, onOpenChange, value, onChange, onSave, saving }: Props) {
  const [step, setStep] = useState(1);
  const [bankTab, setBankTab] = useState<"bank" | "paypal">(value.bank_paypal_email ? "paypal" : "bank");
  const [touched, setTouched] = useState(false);

  useEffect(() => { if (open) { setStep(1); setTouched(false); } }, [open]);

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (step === 1) {
      if (!value.business_name.trim()) e.business_name = "Shop name is required.";
      if (!value.contact_email.trim()) e.contact_email = "Email is required.";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.contact_email)) e.contact_email = "Enter a valid email.";
    }
    if (step === 2) {
      if (!value.ships_to || value.ships_to.length === 0) e.ships_to = "Select at least one country.";
    }
    if (step === 3) {
      if (!value.sender_name.trim()) e.sender_name = "Full name is required.";
      if (!value.sender_street1.trim()) e.sender_street1 = "Street address is required.";
      if (!value.sender_city.trim()) e.sender_city = "City is required.";
      if (!value.sender_zip.trim()) e.sender_zip = "Postcode is required.";
      if (!value.sender_phone.trim()) e.sender_phone = "Phone is required.";
    }
    if (step === 4 && value.offers_collection) {
      const a = value.collection_address;
      if (!a.street1.trim()) e.col_street1 = "Street address is required.";
      if (!a.city.trim()) e.col_city = "City is required.";
      if (!a.postcode.trim()) e.col_postcode = "Postcode is required.";
      if (!a.country.trim()) e.col_country = "Country is required.";
    }
    return e;
  }, [step, value]);

  const stepValid = Object.keys(errors).length === 0;
  const next = () => { setTouched(true); if (stepValid) { setStep(s => Math.min(4, s + 1)); setTouched(false); } };
  const back = () => setStep(s => Math.max(1, s - 1));
  const save = async () => { setTouched(true); if (!stepValid) return; await onSave(); };

  const fieldErr = (key: string) => touched && errors[key];

  const current = STEPS[step - 1];
  const Icon = current.icon;

  // ---- Ships to helpers ----
  const setShipsTo = (codes: string[]) => onChange({ ships_to: codes });
  const toggleCountry = (code: string) => {
    const set = new Set(value.ships_to);
    set.has(code) ? set.delete(code) : set.add(code);
    setShipsTo(Array.from(set));
  };

  const collectionAddrPatch = (patch: Partial<CollectionAddress>) =>
    onChange({ collection_address: { ...value.collection_address, ...patch } });

  const setOpeningHour = (day: keyof OpeningHours, patch: Partial<OpeningHourDay>) =>
    onChange({ opening_hours: { ...value.opening_hours, [day]: { ...value.opening_hours[day], ...patch } } });

  const applyMonFriToAll = () => {
    const monday = value.opening_hours.mon;
    const next = { ...value.opening_hours };
    (["tue", "wed", "thu", "fri"] as const).forEach(d => { next[d] = { ...monday }; });
    onChange({ opening_hours: next });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[480px] p-0 flex flex-col gap-0 bg-card border-l border-border [&>button]:hidden"
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-border bg-card/95 backdrop-blur">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">
                Step {step} of {STEPS.length}
              </p>
              <h2 className="text-xl font-display font-semibold text-foreground">Edit Shop Profile</h2>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="rounded-full p-2 hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          {/* Progress dots */}
          <div className="flex items-center gap-2 mt-5">
            {STEPS.map((s) => (
              <div key={s.id} className="flex-1">
                <div
                  className={`h-1.5 rounded-full transition-colors ${
                    s.id <= step ? "bg-primary" : "bg-secondary"
                  }`}
                />
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 mt-4">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Icon size={16} />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground leading-tight">{current.title}</p>
              <p className="text-xs text-muted-foreground">{current.hint}</p>
            </div>
          </div>
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div key={step} className="space-y-4 animate-fade-in">
            {step === 1 && (
              <>
                <Field label="Shop name" required error={fieldErr("business_name")}>
                  <Input
                    value={value.business_name}
                    onChange={e => onChange({ business_name: e.target.value })}
                    placeholder="Smith Auto Parts"
                    className="h-11 bg-secondary border-border rounded-xl"
                  />
                </Field>
                <Field label="Description">
                  <Textarea
                    value={value.description}
                    onChange={e => onChange({ description: e.target.value })}
                    rows={4}
                    placeholder="Tell customers about your business…"
                    className="bg-secondary border-border rounded-xl resize-none"
                  />
                </Field>
                <Field label="Email" required error={fieldErr("contact_email")}>
                  <Input
                    type="email"
                    value={value.contact_email}
                    onChange={e => onChange({ contact_email: e.target.value })}
                    placeholder="you@shop.com"
                    className="h-11 bg-secondary border-border rounded-xl"
                  />
                </Field>
                <Field label="Phone" optional>
                  <Input
                    value={value.contact_phone}
                    onChange={e => onChange({ contact_phone: e.target.value })}
                    placeholder="+44 7…"
                    className="h-11 bg-secondary border-border rounded-xl"
                  />
                </Field>
              </>
            )}

            {step === 2 && (
              <>
                <Field label="Your country" required>
                  <select
                    value={value.country}
                    onChange={e => onChange({ country: e.target.value })}
                    className="w-full h-11 px-3 rounded-xl bg-secondary border border-border text-sm"
                  >
                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>

                <CountryShipsToSelector
                  value={value.ships_to}
                  onChange={setShipsTo}
                  onToggle={toggleCountry}
                  error={fieldErr("ships_to")}
                />

                <Field label="Default dispatch time">
                  <select
                    value={value.dispatch_time || "1-2 days"}
                    onChange={e => onChange({ dispatch_time: e.target.value })}
                    className="w-full h-11 px-3 rounded-xl bg-secondary border border-border text-sm"
                  >
                    <option value="Same day">Same day</option>
                    <option value="1-2 days">1-2 days</option>
                    <option value="3-5 days">3-5 days</option>
                    <option value="1 week">1 week</option>
                    <option value="2 weeks">2 weeks</option>
                  </select>
                  <p className="text-[11px] text-muted-foreground mt-1">Applied as the default to new listings.</p>
                </Field>
              </>
            )}

            {step === 3 && (
              <>
                <p className="text-xs text-muted-foreground -mt-2 mb-1">Used to generate Shippo shipping labels.</p>
                <Field label="Full name" required error={fieldErr("sender_name")}>
                  <Input value={value.sender_name} onChange={e => onChange({ sender_name: e.target.value })} placeholder="John Smith" className="h-11 bg-secondary border-border rounded-xl" />
                </Field>
                <Field label="Company name" optional>
                  <Input value={value.sender_company} onChange={e => onChange({ sender_company: e.target.value })} placeholder="Smith Auto Parts Ltd" className="h-11 bg-secondary border-border rounded-xl" />
                </Field>
                <Field label="Postcode lookup">
                  <PostcodeLookup
                    value={value.sender_zip}
                    country={value.sender_country || "GB"}
                    onChange={(v) => onChange({ sender_zip: v })}
                    onSelect={(s) => onChange({
                      sender_street1: s.street1 || value.sender_street1,
                      sender_city: s.city || value.sender_city,
                      sender_state: s.county || value.sender_state,
                      sender_zip: s.postcode || value.sender_zip,
                      sender_country: s.country || value.sender_country,
                    })}
                  />
                </Field>
                <Field label="Street address" required error={fieldErr("sender_street1")}>
                  <Input value={value.sender_street1} onChange={e => onChange({ sender_street1: e.target.value })} placeholder="123 High Street" className="h-11 bg-secondary border-border rounded-xl" />
                </Field>
                <Field label="Street line 2" optional>
                  <Input value={value.sender_street2} onChange={e => onChange({ sender_street2: e.target.value })} placeholder="Unit 4B" className="h-11 bg-secondary border-border rounded-xl" />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="City" required error={fieldErr("sender_city")}>
                    <Input value={value.sender_city} onChange={e => onChange({ sender_city: e.target.value })} placeholder="London" className="h-11 bg-secondary border-border rounded-xl" />
                  </Field>
                  <Field label="County / State" optional>
                    <Input value={value.sender_state} onChange={e => onChange({ sender_state: e.target.value })} placeholder="Greater London" className="h-11 bg-secondary border-border rounded-xl" />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Postcode" required error={fieldErr("sender_zip")}>
                    <Input value={value.sender_zip} onChange={e => onChange({ sender_zip: e.target.value })} placeholder="SW1A 1AA" className="h-11 bg-secondary border-border rounded-xl" />
                  </Field>
                  <Field label="Country" required>
                    <select
                      value={value.sender_country || "GB"}
                      onChange={e => onChange({ sender_country: e.target.value })}
                      className="w-full h-11 px-3 rounded-xl bg-secondary border border-border text-sm"
                    >
                      {SENDER_COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
                    </select>
                  </Field>
                </div>
                <Field label="Phone" required error={fieldErr("sender_phone")}>
                  <Input value={value.sender_phone} onChange={e => onChange({ sender_phone: e.target.value })} placeholder="+44 20 1234 5678" className="h-11 bg-secondary border-border rounded-xl" />
                </Field>
              </>
            )}

            {step === 4 && (
              <>
                {/* Collection at store */}
                <div className="rounded-2xl border border-border bg-secondary/40 p-4">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Store size={16} className="text-primary" />
                      <span className="text-sm font-medium text-foreground">Offer collection at store</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={value.offers_collection}
                      onChange={e => onChange({ offers_collection: e.target.checked })}
                      className="accent-primary h-4 w-4"
                    />
                  </label>
                  <p className="text-xs text-muted-foreground mt-1">Let buyers pick up their order and waive shipping.</p>

                  {value.offers_collection && (
                    <div className="mt-5 space-y-5 animate-fade-in">
                      {/* A) STORE ADDRESS */}
                      <Section title="Store address">
                        <Field label="Business name" optional>
                          <Input
                            value={value.collection_address.business_name}
                            onChange={e => collectionAddrPatch({ business_name: e.target.value })}
                            placeholder="Smith Auto Parts Ltd"
                            className="h-11 bg-secondary border-border rounded-xl"
                          />
                        </Field>
                        <Field label="Postcode lookup">
                          <PostcodeLookup
                            value={value.collection_address.postcode}
                            country={value.collection_address.country || "GB"}
                            onChange={(v) => collectionAddrPatch({ postcode: v })}
                            onSelect={(s) => collectionAddrPatch({
                              street1: s.street1 || value.collection_address.street1,
                              city: s.city || value.collection_address.city,
                              county: s.county || value.collection_address.county,
                              postcode: s.postcode || value.collection_address.postcode,
                              country: s.country || value.collection_address.country,
                            })}
                          />
                        </Field>
                        <Field label="Street address" required error={fieldErr("col_street1")}>
                          <Input
                            value={value.collection_address.street1}
                            onChange={e => collectionAddrPatch({ street1: e.target.value })}
                            placeholder="123 High Street"
                            className="h-11 bg-secondary border-border rounded-xl"
                          />
                        </Field>
                        <Field label="Street line 2" optional>
                          <Input
                            value={value.collection_address.street2}
                            onChange={e => collectionAddrPatch({ street2: e.target.value })}
                            placeholder="Unit 4B"
                            className="h-11 bg-secondary border-border rounded-xl"
                          />
                        </Field>
                        <div className="grid grid-cols-2 gap-3">
                          <Field label="City" required error={fieldErr("col_city")}>
                            <Input
                              value={value.collection_address.city}
                              onChange={e => collectionAddrPatch({ city: e.target.value })}
                              placeholder="London"
                              className="h-11 bg-secondary border-border rounded-xl"
                            />
                          </Field>
                          <Field label="County / State" optional>
                            <Input
                              value={value.collection_address.county}
                              onChange={e => collectionAddrPatch({ county: e.target.value })}
                              placeholder="Greater London"
                              className="h-11 bg-secondary border-border rounded-xl"
                            />
                          </Field>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <Field label="Postcode" required error={fieldErr("col_postcode")}>
                            <Input
                              value={value.collection_address.postcode}
                              onChange={e => collectionAddrPatch({ postcode: e.target.value })}
                              placeholder="SW1A 1AA"
                              className="h-11 bg-secondary border-border rounded-xl"
                            />
                          </Field>
                          <Field label="Country" required error={fieldErr("col_country")}>
                            <select
                              value={value.collection_address.country || "GB"}
                              onChange={e => collectionAddrPatch({ country: e.target.value })}
                              className="w-full h-11 px-3 rounded-xl bg-secondary border border-border text-sm"
                            >
                              {SENDER_COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
                            </select>
                          </Field>
                        </div>
                      </Section>

                      {/* B) OPENING HOURS */}
                      <Section title="Opening hours" action={
                        <button
                          type="button"
                          onClick={applyMonFriToAll}
                          className="text-[11px] text-primary hover:underline"
                        >
                          Apply Mon hours to all weekdays
                        </button>
                      }>
                        <div className="space-y-1.5">
                          {DAYS.map(d => {
                            const day = value.opening_hours[d.key];
                            return (
                              <div key={d.key} className="flex items-center gap-2 text-xs">
                                <div className="w-20 text-foreground/80">{d.label}</div>
                                <button
                                  type="button"
                                  onClick={() => setOpeningHour(d.key, { open: !day.open })}
                                  className={`h-7 px-2 rounded-md text-[11px] font-medium transition-colors ${
                                    day.open
                                      ? "bg-primary/10 text-primary"
                                      : "bg-secondary text-muted-foreground"
                                  }`}
                                >
                                  {day.open ? "● Open" : "○ Closed"}
                                </button>
                                {day.open ? (
                                  <>
                                    <select
                                      value={day.from}
                                      onChange={e => setOpeningHour(d.key, { from: e.target.value })}
                                      className="h-8 px-1.5 rounded-md bg-secondary border border-border text-xs flex-1 min-w-0"
                                    >
                                      {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                    <span className="text-muted-foreground">to</span>
                                    <select
                                      value={day.to}
                                      onChange={e => setOpeningHour(d.key, { to: e.target.value })}
                                      className="h-8 px-1.5 rounded-md bg-secondary border border-border text-xs flex-1 min-w-0"
                                    >
                                      {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                  </>
                                ) : (
                                  <span className="flex-1 text-muted-foreground italic">Closed</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </Section>

                      {/* C) COLLECTION INSTRUCTIONS */}
                      <Section title="Collection instructions">
                        <Textarea
                          value={value.collection_instructions}
                          onChange={e => onChange({ collection_instructions: e.target.value.slice(0, 300) })}
                          rows={3}
                          maxLength={300}
                          placeholder="e.g. Use the side entrance, ask for John at reception, bring your order confirmation email"
                          className="bg-secondary border-border rounded-xl resize-none"
                        />
                        <p className="text-[10px] text-muted-foreground mt-1 text-right">
                          {value.collection_instructions.length}/300
                        </p>
                      </Section>

                      {/* D) COLLECTION WINDOW */}
                      <Section title="Collection window">
                        <p className="text-[11px] text-muted-foreground mb-1">How much notice do you need?</p>
                        <select
                          value={value.collection_window}
                          onChange={e => onChange({ collection_window: e.target.value })}
                          className="w-full h-11 px-3 rounded-xl bg-secondary border border-border text-sm"
                        >
                          <option value="Same day">Same day (order before closing time)</option>
                          <option value="1 business day">1 business day notice</option>
                          <option value="2 business days">2 business days notice</option>
                          <option value="By appointment">By appointment only</option>
                        </select>
                      </Section>

                      {/* E) CONTACT FOR COLLECTION */}
                      <Section title="Contact for collection">
                        <div className="grid grid-cols-2 gap-3">
                          <Field label="Contact name" optional>
                            <Input
                              value={value.collection_contact_name}
                              onChange={e => onChange({ collection_contact_name: e.target.value })}
                              placeholder="John"
                              className="h-11 bg-secondary border-border rounded-xl"
                            />
                          </Field>
                          <Field label="Contact phone" optional>
                            <Input
                              value={value.collection_contact_phone}
                              onChange={e => onChange({ collection_contact_phone: e.target.value })}
                              placeholder="07XXXXXXXXX"
                              className="h-11 bg-secondary border-border rounded-xl"
                            />
                          </Field>
                        </div>
                      </Section>

                      {/* F) PREVIEW */}
                      <CollectionPreview value={value} />
                    </div>
                  )}
                </div>

                {/* Payment */}
                <div className="rounded-2xl border border-border bg-secondary/40 p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Lock size={14} className="text-muted-foreground" />
                    <h3 className="text-sm font-medium text-foreground">Payment Details <span className="text-muted-foreground/60 text-xs">(optional)</span></h3>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">How buyers can pay you directly.</p>

                  <Tabs value={bankTab} onValueChange={(v) => setBankTab(v as any)}>
                    <TabsList className="grid grid-cols-2 w-full bg-secondary">
                      <TabsTrigger value="bank">Bank Transfer</TabsTrigger>
                      <TabsTrigger value="paypal">PayPal</TabsTrigger>
                    </TabsList>
                    <TabsContent value="bank" className="mt-3 space-y-3">
                      <Field label="Account holder name">
                        <Input value={value.bank_account_name} onChange={e => onChange({ bank_account_name: e.target.value })} placeholder="John Smith" className="h-11 bg-secondary border-border rounded-xl" />
                      </Field>
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Sort code">
                          <Input value={value.bank_sort_code} onChange={e => onChange({ bank_sort_code: e.target.value })} placeholder="XX-XX-XX" maxLength={8} className="h-11 bg-secondary border-border rounded-xl" />
                        </Field>
                        <Field label="Account number">
                          <Input value={value.bank_account_number} onChange={e => onChange({ bank_account_number: e.target.value })} placeholder="12345678" maxLength={8} className="h-11 bg-secondary border-border rounded-xl" />
                        </Field>
                      </div>
                    </TabsContent>
                    <TabsContent value="paypal" className="mt-3">
                      <Field label="PayPal email">
                        <Input type="email" value={value.bank_paypal_email} onChange={e => onChange({ bank_paypal_email: e.target.value })} placeholder="you@email.com" className="h-11 bg-secondary border-border rounded-xl" />
                      </Field>
                    </TabsContent>
                  </Tabs>

                  <p className="text-[10px] text-muted-foreground mt-3">🔒 Your payment details are stored securely.</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-card flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={back}
            disabled={step === 1}
            className="rounded-xl gap-2"
          >
            <ArrowLeft size={16} /> Back
          </Button>
          {step < STEPS.length ? (
            <Button onClick={next} className="rounded-xl gap-2 px-6">
              Next <ArrowRight size={16} />
            </Button>
          ) : (
            <Button onClick={save} disabled={saving} className="rounded-xl gap-2 px-6">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Save & Close
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ---------------- Sub-components ----------------

function Field({
  label, required, optional, error, children,
}: { label: string; required?: boolean; optional?: boolean; error?: string | false; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium text-foreground/80 block mb-1.5">
        {label}
        {required && <span className="text-primary ml-0.5">*</span>}
        {optional && <span className="text-muted-foreground/60 ml-1 font-normal">(optional)</span>}
      </label>
      {children}
      {error && <p className="text-[11px] text-destructive mt-1">{error}</p>}
    </div>
  );
}

function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h4>
        {action}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function CountryShipsToSelector({
  value, onChange, onToggle, error,
}: { value: string[]; onChange: (codes: string[]) => void; onToggle: (code: string) => void; error?: string | false }) {
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return COUNTRY_LIST;
    return COUNTRY_LIST.filter(c =>
      c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
    );
  }, [search]);

  return (
    <div>
      <p className="text-sm font-medium text-foreground mb-2">Ships to <span className="text-primary">*</span></p>
      <div className="rounded-xl border border-border bg-secondary/40 p-3 space-y-3">
        {/* Quick selects */}
        <div className="flex flex-wrap gap-1.5">
          <button type="button" onClick={() => onChange(["GB"])}
            className="text-[11px] px-2.5 py-1 rounded-md bg-card hover:bg-primary hover:text-primary-foreground border border-border transition-colors">
            🇬🇧 UK Only
          </button>
          <button type="button" onClick={() => onChange([...EU_CODES])}
            className="text-[11px] px-2.5 py-1 rounded-md bg-card hover:bg-primary hover:text-primary-foreground border border-border transition-colors">
            🇪🇺 Europe
          </button>
          <button type="button" onClick={() => onChange([...ALL_CODES])}
            className="text-[11px] px-2.5 py-1 rounded-md bg-card hover:bg-primary hover:text-primary-foreground border border-border transition-colors">
            🌍 Worldwide
          </button>
          <button type="button" onClick={() => onChange([])}
            className="text-[11px] px-2.5 py-1 rounded-md bg-card hover:bg-destructive hover:text-destructive-foreground border border-border transition-colors">
            Clear all
          </button>
        </div>

        {/* Selected chips */}
        {value.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {value.slice(0, 60).map(code => {
              const c = getCountry(code);
              if (!c) return null;
              return (
                <span key={code} className="inline-flex items-center gap-1 text-[11px] bg-primary/10 text-primary px-2 py-0.5 rounded-md">
                  {c.flag} {c.name}
                  <button type="button" onClick={() => onToggle(code)} className="hover:opacity-70" aria-label={`Remove ${c.name}`}>
                    <X size={10} />
                  </button>
                </span>
              );
            })}
            {value.length > 60 && (
              <span className="text-[11px] text-muted-foreground px-1 py-0.5">+{value.length - 60} more</span>
            )}
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search countries..."
            className="h-9 pl-8 bg-card border-border rounded-lg text-sm"
          />
        </div>

        {/* List */}
        <div className="max-h-64 overflow-y-auto rounded-lg border border-border bg-card divide-y divide-border">
          {filtered.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-6">No countries match "{search}"</p>
          )}
          {filtered.map(c => {
            const checked = value.includes(c.code);
            const isPopular = POPULAR_CODES.includes(c.code);
            return (
              <label
                key={c.code}
                className="flex items-center gap-2.5 px-3 py-2 text-xs cursor-pointer hover:bg-secondary/60"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggle(c.code)}
                  className="accent-primary h-3.5 w-3.5"
                />
                <span className="text-base leading-none">{c.flag}</span>
                <span className="flex-1 text-foreground">{c.name}</span>
                {isPopular && <span className="text-[9px] uppercase text-muted-foreground/60">Popular</span>}
                {checked && <Check size={12} className="text-primary" />}
              </label>
            );
          })}
        </div>

        <p className="text-[10px] text-muted-foreground">
          {value.length} {value.length === 1 ? "country" : "countries"} selected
        </p>
      </div>
      {error && <p className="text-[11px] text-destructive mt-1">{error}</p>}
    </div>
  );
}

function CollectionPreview({ value }: { value: ProfileForm }) {
  const a = value.collection_address;
  const addrLine = [a.street1, a.street2, a.city, a.postcode].filter(Boolean).join(", ");
  const openDays = DAYS.filter(d => value.opening_hours[d.key].open);
  const allWeekday = ["mon","tue","wed","thu","fri"].every(k => value.opening_hours[k as keyof OpeningHours].open);
  const sameWeekday = allWeekday && ["tue","wed","thu","fri"].every(k => {
    const m = value.opening_hours.mon;
    const d = value.opening_hours[k as keyof OpeningHours];
    return d.from === m.from && d.to === m.to;
  });
  const hoursSummary = (() => {
    if (openDays.length === 0) return "Closed";
    if (sameWeekday && !value.opening_hours.sat.open && !value.opening_hours.sun.open) {
      return `Mon-Fri ${value.opening_hours.mon.from}-${value.opening_hours.mon.to}`;
    }
    return openDays.map(d => `${d.label.slice(0,3)} ${value.opening_hours[d.key].from}-${value.opening_hours[d.key].to}`).join(", ");
  })();

  return (
    <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-3">
      <p className="text-[10px] uppercase tracking-wider text-primary/70 font-semibold mb-2">Buyer preview</p>
      <p className="text-xs text-foreground leading-relaxed">
        📍 <span className="font-medium">Collection available at:</span><br />
        {a.business_name && <>{a.business_name}<br /></>}
        {addrLine || <span className="text-muted-foreground italic">Add your store address</span>}<br />
        <span className="text-muted-foreground">Opening hours: {hoursSummary}</span><br />
        <span className="text-muted-foreground">Collection window: {value.collection_window || "Same day"}</span>
        {(value.collection_contact_name || value.collection_contact_phone) && (
          <><br /><span className="text-muted-foreground">
            Contact: {value.collection_contact_name}{value.collection_contact_phone ? ` - ${value.collection_contact_phone}` : ""}
          </span></>
        )}
      </p>
    </div>
  );
}
