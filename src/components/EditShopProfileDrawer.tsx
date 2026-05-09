import { useState, useEffect, useMemo } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { X, ArrowLeft, ArrowRight, Save, Loader2, Store, Lock, MapPin, Truck, Building2 } from "lucide-react";
import { COUNTRIES } from "@/lib/countries";
import AddressForm, { type AddressFormValue } from "@/components/AddressForm";
import PostcodeLookup from "@/components/PostcodeLookup";
import { SENDER_COUNTRIES } from "@/components/SenderAddressFields";

interface ProfileForm {
  business_name: string; description: string; contact_email: string; contact_phone: string; website_url: string;
  bank_account_name: string; bank_sort_code: string; bank_account_number: string; bank_paypal_email: string;
  ships_to: string[]; country: string;
  sender_name: string; sender_company: string; sender_street1: string; sender_street2: string;
  sender_city: string; sender_state: string; sender_zip: string; sender_country: string; sender_phone: string;
  offers_collection: boolean; collection_address: AddressFormValue;
  collection_instructions: string; collection_window: string;
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
    if (step === 3) {
      if (!value.sender_name.trim()) e.sender_name = "Full name is required.";
      if (!value.sender_street1.trim()) e.sender_street1 = "Street address is required.";
      if (!value.sender_city.trim()) e.sender_city = "City is required.";
      if (!value.sender_zip.trim()) e.sender_zip = "Postcode is required.";
      if (!value.sender_phone.trim()) e.sender_phone = "Phone is required.";
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
                    s.id < step ? "bg-primary" : s.id === step ? "bg-primary" : "bg-secondary"
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
                <Field label="Website" optional>
                  <Input
                    value={value.website_url}
                    onChange={e => onChange({ website_url: e.target.value })}
                    placeholder="https://…"
                    className="h-11 bg-secondary border-border rounded-xl"
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

                <div>
                  <p className="text-sm font-medium text-foreground mb-2">Ships to</p>
                  <div className="space-y-2 rounded-xl border border-border bg-secondary/40 p-4">
                    <label className="flex items-center gap-3 text-sm opacity-80">
                      <input type="checkbox" checked readOnly className="accent-primary h-4 w-4" />
                      <span>🇬🇧 United Kingdom <span className="text-muted-foreground text-xs">(default)</span></span>
                    </label>
                    {(["EU", "Worldwide"] as const).map(region => (
                      <label key={region} className="flex items-center gap-3 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={value.ships_to.includes(region)}
                          onChange={e => onChange({
                            ships_to: e.target.checked
                              ? Array.from(new Set([...value.ships_to, region]))
                              : value.ships_to.filter(r => r !== region),
                          })}
                          className="accent-primary h-4 w-4"
                        />
                        <span>{region === "EU" ? "🇪🇺 Europe (EU countries)" : "🌍 Worldwide"}</span>
                      </label>
                    ))}
                  </div>
                </div>

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
                      <span className="text-sm font-medium text-foreground">Collection at store</span>
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
                    <div className="mt-4 space-y-3 animate-fade-in">
                      <p className="text-xs font-medium text-foreground">Collection address</p>
                      <AddressForm
                        value={value.collection_address}
                        onChange={(v) => onChange({ collection_address: v })}
                        showInstructions={false}
                      />
                      <Field label="Collection instructions">
                        <Textarea
                          value={value.collection_instructions}
                          onChange={e => onChange({ collection_instructions: e.target.value })}
                          placeholder="e.g. Mon-Fri 9am-5pm, ask for John at reception"
                          rows={2}
                          className="bg-secondary border-border rounded-xl resize-none"
                        />
                      </Field>
                      <Field label="Collection window">
                        <select
                          value={value.collection_window}
                          onChange={e => onChange({ collection_window: e.target.value })}
                          className="w-full h-11 px-3 rounded-xl bg-secondary border border-border text-sm"
                        >
                          <option value="Same day">Same day</option>
                          <option value="Next day">Next day</option>
                          <option value="2-3 days">2-3 days</option>
                          <option value="By appointment">By appointment</option>
                        </select>
                      </Field>
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
