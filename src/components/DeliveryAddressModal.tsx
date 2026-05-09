import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Truck, Loader2 } from "lucide-react";
import type { ShippoAddress } from "@/lib/shippo";

export interface DeliveryFormData {
  buyer_name: string;
  buyer_email: string;
  address: ShippoAddress;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultEmail?: string;
  loading?: boolean;
  onSubmit: (data: DeliveryFormData) => void;
}

const COUNTRY_OPTIONS: { code: string; label: string }[] = [
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

export default function DeliveryAddressModal({ open, onOpenChange, defaultEmail = "", loading, onSubmit }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState(defaultEmail);
  const [street1, setStreet1] = useState("");
  const [street2, setStreet2] = useState("");
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");
  const [country, setCountry] = useState("GB");
  const [phone, setPhone] = useState("");

  const submit = () => {
    if (!name.trim() || !email.trim() || !street1.trim() || !city.trim() || !zip.trim()) return;
    onSubmit({
      buyer_name: name.trim(),
      buyer_email: email.trim(),
      address: {
        name: name.trim(),
        street1: street1.trim(),
        street2: street2.trim() || undefined,
        city: city.trim(),
        zip: zip.trim(),
        country,
        phone: phone.trim() || undefined,
        email: email.trim(),
      },
    });
  };

  const valid = name.trim() && email.trim() && street1.trim() && city.trim() && zip.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Truck size={18} className="text-primary" /> Delivery address
          </DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground -mt-2">
          The seller needs your delivery details to ship the part. Required before payment.
        </p>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Full name *</label>
            <Input value={name} onChange={e => setName(e.target.value)} className="bg-secondary border-border rounded-xl" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Email *</label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} className="bg-secondary border-border rounded-xl" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Street address *</label>
            <Input value={street1} onChange={e => setStreet1(e.target.value)} className="bg-secondary border-border rounded-xl" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Apartment / suite</label>
            <Input value={street2} onChange={e => setStreet2(e.target.value)} className="bg-secondary border-border rounded-xl" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">City *</label>
              <Input value={city} onChange={e => setCity(e.target.value)} className="bg-secondary border-border rounded-xl" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Postcode *</label>
              <Input value={zip} onChange={e => setZip(e.target.value)} className="bg-secondary border-border rounded-xl" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Country *</label>
              <select value={country} onChange={e => setCountry(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-secondary border border-border text-sm">
                {COUNTRY_OPTIONS.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Phone</label>
              <Input value={phone} onChange={e => setPhone(e.target.value)} className="bg-secondary border-border rounded-xl" />
            </div>
          </div>
          <Button onClick={submit} disabled={!valid || loading} className="w-full rounded-xl gap-2">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Truck size={16} />}
            Continue to payment →
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
