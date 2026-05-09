import { Input } from "@/components/ui/input";
import { MapPin } from "lucide-react";

// Common ISO-2 country codes used for Shippo sender address.
export const SENDER_COUNTRIES: { code: string; label: string }[] = [
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
  { code: "NO", label: "Norway" },
  { code: "DK", label: "Denmark" },
  { code: "FI", label: "Finland" },
  { code: "AT", label: "Austria" },
  { code: "CH", label: "Switzerland" },
  { code: "US", label: "United States" },
  { code: "CA", label: "Canada" },
  { code: "AU", label: "Australia" },
];

export interface SenderAddressValue {
  sender_name: string;
  sender_company: string;
  sender_street1: string;
  sender_street2: string;
  sender_city: string;
  sender_state: string;
  sender_zip: string;
  sender_country: string;
  sender_phone: string;
}

interface Props {
  value: SenderAddressValue;
  onChange: (patch: Partial<SenderAddressValue>) => void;
}

export default function SenderAddressFields({ value, onChange }: Props) {
  return (
    <div className="border border-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-1">
        <MapPin size={14} className="text-muted-foreground" />
        <h3 className="text-sm font-medium">Sender Address <span className="text-muted-foreground/50">(used for shipping labels)</span></h3>
      </div>
      <p className="text-xs text-muted-foreground mb-4">Where parcels are sent from. Required to create Shippo shipping labels.</p>
      <div className="space-y-3">
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Full name *</label>
          <Input value={value.sender_name} onChange={e => onChange({ sender_name: e.target.value })} className="bg-secondary border-border rounded-xl" placeholder="John Smith" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Company name <span className="text-muted-foreground/50">(optional)</span></label>
          <Input value={value.sender_company} onChange={e => onChange({ sender_company: e.target.value })} className="bg-secondary border-border rounded-xl" placeholder="Smith Auto Parts Ltd" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Street address *</label>
          <Input value={value.sender_street1} onChange={e => onChange({ sender_street1: e.target.value })} className="bg-secondary border-border rounded-xl" placeholder="123 High Street" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Street address line 2 <span className="text-muted-foreground/50">(optional)</span></label>
          <Input value={value.sender_street2} onChange={e => onChange({ sender_street2: e.target.value })} className="bg-secondary border-border rounded-xl" placeholder="Unit 4B" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">City *</label>
            <Input value={value.sender_city} onChange={e => onChange({ sender_city: e.target.value })} className="bg-secondary border-border rounded-xl" placeholder="London" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">County / State <span className="text-muted-foreground/50">(optional)</span></label>
            <Input value={value.sender_state} onChange={e => onChange({ sender_state: e.target.value })} className="bg-secondary border-border rounded-xl" placeholder="Greater London" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Postcode *</label>
            <Input value={value.sender_zip} onChange={e => onChange({ sender_zip: e.target.value })} className="bg-secondary border-border rounded-xl" placeholder="SW1A 1AA" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Country *</label>
            <select
              value={value.sender_country || "GB"}
              onChange={e => onChange({ sender_country: e.target.value })}
              className="w-full h-10 px-3 rounded-xl bg-secondary border border-border text-foreground text-sm"
            >
              {SENDER_COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Phone number *</label>
          <Input value={value.sender_phone} onChange={e => onChange({ sender_phone: e.target.value })} className="bg-secondary border-border rounded-xl" placeholder="+44 20 1234 5678" />
        </div>
      </div>
    </div>
  );
}
