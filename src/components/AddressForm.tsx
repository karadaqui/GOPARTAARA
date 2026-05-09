import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import PostcodeLookup from "./PostcodeLookup";
import { isValidPhone, isValidPostcode } from "@/lib/addressValidation";

export interface AddressFormValue {
  full_name: string;
  phone: string;
  street1: string;
  street2: string;
  city: string;
  county: string;
  postcode: string;
  country: string;        // ISO-2
  delivery_instructions: string;
  label?: string;
}

const COUNTRIES: { code: string; label: string }[] = [
  { code: "GB", label: "United Kingdom" },
  { code: "IE", label: "Ireland" },
  { code: "FR", label: "France" },
  { code: "DE", label: "Germany" },
  { code: "ES", label: "Spain" },
  { code: "IT", label: "Italy" },
  { code: "NL", label: "Netherlands" },
  { code: "BE", label: "Belgium" },
  { code: "PT", label: "Portugal" },
  { code: "PL", label: "Poland" },
  { code: "SE", label: "Sweden" },
  { code: "DK", label: "Denmark" },
  { code: "US", label: "United States" },
];

interface Props {
  value: AddressFormValue;
  onChange: (v: AddressFormValue) => void;
  showInstructions?: boolean;
  showLabel?: boolean;
}

export const EMPTY_ADDRESS: AddressFormValue = {
  full_name: "", phone: "", street1: "", street2: "", city: "", county: "",
  postcode: "", country: "GB", delivery_instructions: "", label: "Home",
};

export function isAddressComplete(a: AddressFormValue): boolean {
  return Boolean(
    a.full_name.trim() && a.phone.trim() && a.street1.trim() &&
    a.city.trim() && a.postcode.trim() && a.country.trim() &&
    isValidPostcode(a.postcode, a.country) &&
    isValidPhone(a.phone, a.country)
  );
}

export default function AddressForm({ value, onChange, showInstructions = true, showLabel = false }: Props) {
  const [verified, setVerified] = useState(false);
  const set = (patch: Partial<AddressFormValue>) => onChange({ ...value, ...patch });
  useEffect(() => { setVerified(false); }, [value.postcode, value.country]);

  const phoneOk = !value.phone.trim() || isValidPhone(value.phone, value.country);
  const postcodeOk = !value.postcode.trim() || isValidPostcode(value.postcode, value.country);

  return (
    <div className="space-y-3">
      {showLabel && (
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Address label</label>
          <Input
            value={value.label || ""}
            onChange={(e) => set({ label: e.target.value })}
            placeholder="Home, Work, Other…"
            className="bg-secondary border-border rounded-xl"
          />
        </div>
      )}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Full name *</label>
          <Input value={value.full_name} onChange={(e) => set({ full_name: e.target.value })} className="bg-secondary border-border rounded-xl" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Phone *</label>
          <Input value={value.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="+44 7… or 07…" className="bg-secondary border-border rounded-xl" />
          {!phoneOk && <p className="text-[11px] text-red-500 mt-1">Enter a valid phone number.</p>}
        </div>
      </div>
      <div>
        <label className="text-xs text-muted-foreground block mb-1">Postcode lookup</label>
        <PostcodeLookup
          value={value.postcode}
          country={value.country}
          onChange={(v) => set({ postcode: v })}
          verified={verified}
          onSelect={(s) => {
            set({
              street1: s.street1 || value.street1,
              city: s.city || value.city,
              county: s.county || value.county,
              postcode: s.postcode || value.postcode,
              country: s.country || value.country,
            });
            setVerified(true);
          }}
        />
        {!postcodeOk && <p className="text-[11px] text-red-500 mt-1">Postcode format looks wrong.</p>}
      </div>
      <div>
        <label className="text-xs text-muted-foreground block mb-1">Street address *</label>
        <Input value={value.street1} onChange={(e) => set({ street1: e.target.value })} className="bg-secondary border-border rounded-xl" />
      </div>
      <div>
        <label className="text-xs text-muted-foreground block mb-1">Apartment / suite</label>
        <Input value={value.street2} onChange={(e) => set({ street2: e.target.value })} className="bg-secondary border-border rounded-xl" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-muted-foreground block mb-1">City *</label>
          <Input value={value.city} onChange={(e) => set({ city: e.target.value })} className="bg-secondary border-border rounded-xl" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">County / State</label>
          <Input value={value.county} onChange={(e) => set({ county: e.target.value })} className="bg-secondary border-border rounded-xl" />
        </div>
      </div>
      <div>
        <label className="text-xs text-muted-foreground block mb-1">Country *</label>
        <select
          value={value.country}
          onChange={(e) => set({ country: e.target.value })}
          className="w-full h-10 px-3 rounded-xl bg-secondary border border-border text-sm"
        >
          {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
        </select>
      </div>
      {showInstructions && (
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Delivery instructions (optional)</label>
          <Textarea
            value={value.delivery_instructions}
            onChange={(e) => set({ delivery_instructions: e.target.value })}
            placeholder="e.g. Leave at door, Ring bell, Call on arrival, Safe place: side gate"
            rows={2}
            className="bg-secondary border-border rounded-xl"
          />
        </div>
      )}
    </div>
  );
}
