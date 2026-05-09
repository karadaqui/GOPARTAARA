import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Truck, Loader2, MapPin, Store, Check, Plus, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AddressForm, { EMPTY_ADDRESS, isAddressComplete, type AddressFormValue } from "./AddressForm";
import type { ShippoAddress } from "@/lib/shippo";

export interface DeliveryFormData {
  buyer_name: string;
  buyer_email: string;
  address: ShippoAddress;
  billing_address?: ShippoAddress;
  fulfillment_method: "delivery" | "collection";
  delivery_instructions?: string;
  save_address?: boolean;
  saved_address_id?: string;
}

interface SellerCollection {
  offers_collection: boolean;
  collection_address?: any;
  collection_instructions?: string | null;
  collection_window?: string | null;
  business_name?: string;
}

interface OrderSummary {
  product_title: string;
  product_photo?: string | null;
  amount: number;
  shipping_fee: number;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultEmail?: string;
  loading?: boolean;
  seller?: SellerCollection | null;
  summary?: OrderSummary | null;
  onSubmit: (data: DeliveryFormData) => void;
}

interface SavedRow {
  id: string;
  label: string;
  full_name: string;
  phone: string | null;
  street1: string;
  street2: string | null;
  city: string;
  county: string | null;
  postcode: string;
  country: string;
  is_default: boolean;
  is_billing: boolean;
  delivery_instructions: string | null;
}

function rowToAddress(r: SavedRow): AddressFormValue {
  return {
    full_name: r.full_name, phone: r.phone || "", street1: r.street1, street2: r.street2 || "",
    city: r.city, county: r.county || "", postcode: r.postcode, country: r.country,
    delivery_instructions: r.delivery_instructions || "", label: r.label,
  };
}

function toShippo(a: AddressFormValue, email: string): ShippoAddress {
  return {
    name: a.full_name, street1: a.street1, street2: a.street2 || undefined,
    city: a.city, state: a.county || undefined, zip: a.postcode, country: a.country,
    phone: a.phone || undefined, email,
  };
}

export default function DeliveryAddressModal({
  open, onOpenChange, defaultEmail = "", loading, seller, summary, onSubmit,
}: Props) {
  const { user } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [saved, setSaved] = useState<SavedRow[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [useNew, setUseNew] = useState(false);
  const [address, setAddress] = useState<AddressFormValue>(EMPTY_ADDRESS);
  const [email, setEmail] = useState(defaultEmail);
  const [saveToAccount, setSaveToAccount] = useState(true);
  const [useDifferentBilling, setUseDifferentBilling] = useState(false);
  const [billing, setBilling] = useState<AddressFormValue>(EMPTY_ADDRESS);
  const [fulfillment, setFulfillment] = useState<"delivery" | "collection">("delivery");

  useEffect(() => { setEmail(defaultEmail); }, [defaultEmail]);

  useEffect(() => {
    if (!open || !user) return;
    setStep(1); setSelectedId(null); setUseNew(false); setFulfillment("delivery");
    (async () => {
      setLoadingSaved(true);
      const { data } = await supabase
        .from("user_addresses")
        .select("*")
        .eq("user_id", user.id)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false });
      const rows = (data || []) as SavedRow[];
      setSaved(rows);
      if (rows.length > 0) {
        const def = rows.find(r => r.is_default) || rows[0];
        setSelectedId(def.id);
      } else {
        setUseNew(true);
        setStep(2);
      }
      setLoadingSaved(false);
    })();
  }, [open, user]);

  if (!open) return null;

  const chosenAddress: AddressFormValue | null =
    selectedId && !useNew ? rowToAddress(saved.find(s => s.id === selectedId)!) :
    useNew ? address : null;

  const canProceedToSummary = chosenAddress && isAddressComplete(chosenAddress) && email.trim() &&
    (!useDifferentBilling || isAddressComplete(billing));

  const submit = async () => {
    if (!chosenAddress) return;
    if (useNew && saveToAccount && user && saved.length < 5) {
      try {
        await supabase.from("user_addresses").insert({
          user_id: user.id,
          label: chosenAddress.label || "Home",
          full_name: chosenAddress.full_name,
          phone: chosenAddress.phone,
          street1: chosenAddress.street1,
          street2: chosenAddress.street2 || null,
          city: chosenAddress.city,
          county: chosenAddress.county || null,
          postcode: chosenAddress.postcode,
          country: chosenAddress.country,
          is_default: saved.length === 0,
          delivery_instructions: chosenAddress.delivery_instructions || null,
        });
      } catch (e) { console.warn("Could not save address", e); }
    }

    onSubmit({
      buyer_name: chosenAddress.full_name,
      buyer_email: email.trim(),
      address: toShippo(chosenAddress, email.trim()),
      billing_address: useDifferentBilling ? toShippo(billing, email.trim()) : undefined,
      fulfillment_method: fulfillment,
      delivery_instructions: chosenAddress.delivery_instructions || undefined,
      save_address: useNew && saveToAccount,
      saved_address_id: !useNew ? (selectedId || undefined) : undefined,
    });
  };

  const offerCollection = !!seller?.offers_collection && seller?.collection_address;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Truck size={18} className="text-primary" /> Checkout — Step {step} of 3
          </DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-3">
            {loadingSaved ? (
              <div className="text-center py-6"><Loader2 size={18} className="animate-spin inline" /></div>
            ) : (
              <>
                <p className="text-xs text-muted-foreground">Choose a delivery address</p>
                {saved.map(r => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => { setSelectedId(r.id); setUseNew(false); }}
                    className={`w-full text-left rounded-xl border p-3 transition ${selectedId === r.id && !useNew ? "border-primary bg-primary/5" : "border-border bg-secondary/30 hover:border-primary/50"}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold uppercase tracking-wide text-primary">{r.label}</span>
                      {r.is_default && <span className="text-[10px] bg-primary/10 text-primary rounded-full px-2 py-0.5">Default</span>}
                    </div>
                    <p className="text-sm font-medium">{r.full_name}</p>
                    <p className="text-xs text-muted-foreground">{[r.street1, r.street2, r.city, r.postcode].filter(Boolean).join(", ")}</p>
                    {r.phone && <p className="text-xs text-muted-foreground mt-1">📞 {r.phone}</p>}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => { setUseNew(true); setSelectedId(null); setStep(2); }}
                  className="w-full text-left rounded-xl border border-dashed border-border p-3 text-sm text-muted-foreground hover:bg-secondary/30 inline-flex items-center gap-2"
                >
                  <Plus size={14} /> Use a different address
                </button>
                <Button onClick={() => setStep(3)} disabled={!selectedId} className="w-full rounded-xl gap-2">
                  Continue <ArrowRight size={16} />
                </Button>
              </>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Email *</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="flex h-10 w-full rounded-xl border border-border bg-secondary px-3 text-sm"
              />
            </div>
            <AddressForm value={address} onChange={setAddress} showLabel showInstructions />
            {user && saved.length < 5 && (
              <label className="flex items-center gap-2 text-xs">
                <input type="checkbox" checked={saveToAccount} onChange={(e) => setSaveToAccount(e.target.checked)} />
                Save this address to my account
              </label>
            )}
            <label className="flex items-center gap-2 text-xs">
              <input type="checkbox" checked={useDifferentBilling} onChange={(e) => setUseDifferentBilling(e.target.checked)} />
              Use different billing address
            </label>
            {useDifferentBilling && (
              <div className="border-t border-border pt-3">
                <p className="text-xs font-semibold mb-2">Billing address</p>
                <AddressForm value={billing} onChange={setBilling} showInstructions={false} />
              </div>
            )}
            <div className="flex gap-2">
              {saved.length > 0 && (
                <Button variant="outline" onClick={() => { setUseNew(false); setStep(1); }} className="rounded-xl flex-1">Back</Button>
              )}
              <Button onClick={() => setStep(3)} disabled={!canProceedToSummary} className="rounded-xl flex-1 gap-2">
                Review order <ArrowRight size={16} />
              </Button>
            </div>
          </div>
        )}

        {step === 3 && chosenAddress && (
          <div className="space-y-3">
            {summary && (
              <div className="flex gap-3 rounded-xl border border-border bg-secondary/30 p-3">
                {summary.product_photo && (
                  <img src={summary.product_photo} alt="" className="w-16 h-16 object-cover rounded-lg" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{summary.product_title}</p>
                  <p className="text-xs text-muted-foreground mt-1">Item £{summary.amount.toFixed(2)}</p>
                  {fulfillment === "delivery" && summary.shipping_fee > 0 && (
                    <p className="text-xs text-muted-foreground">Shipping £{summary.shipping_fee.toFixed(2)}</p>
                  )}
                  {fulfillment === "collection" && (
                    <p className="text-xs text-green-600">Shipping waived (collection)</p>
                  )}
                  <p className="text-sm font-bold mt-1">
                    Total £{(summary.amount + (fulfillment === "delivery" ? summary.shipping_fee : 0)).toFixed(2)}
                  </p>
                </div>
              </div>
            )}

            {offerCollection && (
              <div className="rounded-xl border border-border p-1 grid grid-cols-2 gap-1">
                <button type="button" onClick={() => setFulfillment("delivery")}
                  className={`px-3 py-2 text-sm rounded-lg ${fulfillment === "delivery" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
                  📦 Delivery
                </button>
                <button type="button" onClick={() => setFulfillment("collection")}
                  className={`px-3 py-2 text-sm rounded-lg ${fulfillment === "collection" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
                  🏪 Collect in store
                </button>
              </div>
            )}

            {fulfillment === "delivery" && (
              <div className="rounded-xl border border-border p-3">
                <p className="text-xs text-muted-foreground mb-1 inline-flex items-center gap-1"><MapPin size={12}/> Delivering to</p>
                <p className="text-sm font-medium">{chosenAddress.full_name}</p>
                <p className="text-xs text-muted-foreground">
                  {[chosenAddress.street1, chosenAddress.street2, chosenAddress.city, chosenAddress.postcode, chosenAddress.country].filter(Boolean).join(", ")}
                </p>
                {chosenAddress.delivery_instructions && (
                  <p className="text-[11px] text-muted-foreground mt-1">📝 {chosenAddress.delivery_instructions}</p>
                )}
              </div>
            )}

            {fulfillment === "collection" && offerCollection && (
              <div className="rounded-xl border border-border p-3">
                <p className="text-xs text-muted-foreground mb-1 inline-flex items-center gap-1"><Store size={12}/> Collect from</p>
                <p className="text-sm font-medium">{seller?.business_name || "Seller store"}</p>
                <p className="text-xs text-muted-foreground">
                  {[seller!.collection_address?.street1, seller!.collection_address?.city, seller!.collection_address?.postcode]
                    .filter(Boolean).join(", ")}
                </p>
                {seller?.collection_instructions && (
                  <p className="text-[11px] text-muted-foreground mt-1">📝 {seller.collection_instructions}</p>
                )}
                {seller?.collection_window && (
                  <p className="text-[11px] text-muted-foreground">⏱ {seller.collection_window}</p>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(useNew ? 2 : 1)} className="rounded-xl flex-1">Back</Button>
              <Button onClick={submit} disabled={loading} className="rounded-xl flex-1 gap-2">
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                Proceed to Payment →
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
