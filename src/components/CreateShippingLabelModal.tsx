import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Truck, AlertTriangle, Download, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { shippoGetRates, shippoPurchaseLabel, type ShippoAddress, type ShippoRate } from "@/lib/shippo";
import { isEUCountry, isUKCountry } from "@/lib/hsCodes";

export interface ShippingOrder {
  id: string;
  listing_id: string;
  category?: string | null;
  buyer_address: ShippoAddress;
  amount?: number;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: ShippingOrder | null;
  sender: ShippoAddress | null;
  onPurchased?: (info: { order_id: string; label_url: string; tracking_number: string; carrier: string }) => void;
}

const CARRIERS = ["Any", "Royal Mail", "DPD", "DHL"];

export default function CreateShippingLabelModal({ open, onOpenChange, order, sender, onPurchased }: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [weight, setWeight] = useState("0.5");
  const [length, setLength] = useState("20");
  const [width, setWidth] = useState("15");
  const [height, setHeight] = useState("10");
  const [carrier, setCarrier] = useState("Any");
  const [loading, setLoading] = useState(false);
  const [rates, setRates] = useState<ShippoRate[]>([]);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [labelUrl, setLabelUrl] = useState<string | null>(null);
  const [trackingNumber, setTrackingNumber] = useState<string | null>(null);

  const reset = () => {
    setStep(1); setRates([]); setLabelUrl(null); setTrackingNumber(null); setPurchasing(null);
  };

  const handleClose = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  if (!order) return null;

  const senderMissing = !sender || !sender.street1 || !sender.city || !sender.zip;
  const showBrexitWarning = sender && isUKCountry(sender.country) && isEUCountry(order.buyer_address.country);

  const fetchRates = async () => {
    if (!sender) { toast.error("Add your sender address in Edit Profile first."); return; }
    const w = parseFloat(weight), l = parseFloat(length), wd = parseFloat(width), h = parseFloat(height);
    if ([w, l, wd, h].some(n => !Number.isFinite(n) || n <= 0)) {
      toast.error("Enter valid weight and dimensions."); return;
    }
    setLoading(true);
    try {
      const result = await shippoGetRates({
        address_from: sender,
        address_to: order.buyer_address,
        parcel: { length: l, width: wd, height: h, weight: w },
        category: order.category,
        carrier_preference: carrier,
      });
      setRates(result.rates || []);
      setStep(2);
      if ((result.rates || []).length === 0) toast.warning("No rates returned for this shipment.");
    } catch (e: any) {
      toast.error(e.message || "Failed to fetch rates");
    } finally {
      setLoading(false);
    }
  };

  const buyLabel = async (rate: ShippoRate) => {
    setPurchasing(rate.object_id);
    try {
      const r = await shippoPurchaseLabel({ rate_id: rate.object_id, order_id: order.id });
      setLabelUrl(r.label_url);
      setTrackingNumber(r.tracking_number);
      setStep(3);
      toast.success("Label purchased! Order marked as shipped.");
      onPurchased?.({ order_id: order.id, label_url: r.label_url, tracking_number: r.tracking_number, carrier: r.carrier });
    } catch (e: any) {
      toast.error(e.message || "Failed to purchase label");
    } finally {
      setPurchasing(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Truck size={18} className="text-primary" /> Create Shipping Label
          </DialogTitle>
        </DialogHeader>

        {senderMissing && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">
            Add your full sender address in <span className="font-semibold">Edit Profile → Sender Address</span> before creating a label.
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-xl border border-border p-3">
                <p className="text-[10px] uppercase text-muted-foreground mb-1">From</p>
                {sender ? (
                  <>
                    <p className="text-sm font-medium">{sender.name}</p>
                    <p className="text-xs text-muted-foreground">{sender.street1}{sender.street2 ? `, ${sender.street2}` : ""}</p>
                    <p className="text-xs text-muted-foreground">{sender.city} {sender.zip}, {sender.country}</p>
                  </>
                ) : <p className="text-xs text-muted-foreground">No sender address saved.</p>}
              </div>
              <div className="rounded-xl border border-border p-3">
                <p className="text-[10px] uppercase text-muted-foreground mb-1">To</p>
                <p className="text-sm font-medium">{order.buyer_address.name}</p>
                <p className="text-xs text-muted-foreground">{order.buyer_address.street1}{order.buyer_address.street2 ? `, ${order.buyer_address.street2}` : ""}</p>
                <p className="text-xs text-muted-foreground">{order.buyer_address.city} {order.buyer_address.zip}, {order.buyer_address.country}</p>
              </div>
            </div>

            {showBrexitWarning && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300 flex gap-2">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                <span>
                  <strong>International shipment:</strong> The recipient may be subject to import duties and taxes upon delivery. For EU orders under £135, VAT may apply. The buyer is responsible for any customs charges.
                </span>
              </div>
            )}

            <div>
              <label className="text-xs text-muted-foreground block mb-1">Package weight (kg) *</label>
              <Input type="number" step="0.01" value={weight} onChange={e => setWeight(e.target.value)} className="bg-secondary border-border rounded-xl" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Length (cm)</label>
                <Input type="number" value={length} onChange={e => setLength(e.target.value)} className="bg-secondary border-border rounded-xl" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Width (cm)</label>
                <Input type="number" value={width} onChange={e => setWidth(e.target.value)} className="bg-secondary border-border rounded-xl" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Height (cm)</label>
                <Input type="number" value={height} onChange={e => setHeight(e.target.value)} className="bg-secondary border-border rounded-xl" />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Carrier preference</label>
              <select value={carrier} onChange={e => setCarrier(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-secondary border border-border text-sm">
                {CARRIERS.map(c => <option key={c} value={c}>{c === "Any" ? "Any (best price)" : c}</option>)}
              </select>
            </div>

            <Button onClick={fetchRates} disabled={loading || senderMissing} className="w-full rounded-xl gap-2">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Truck size={16} />}
              Get Shipping Rates →
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <Button variant="ghost" size="sm" onClick={() => setStep(1)} className="text-xs">← Back</Button>
            {rates.length === 0 ? (
              <p className="text-sm text-muted-foreground">No rates available.</p>
            ) : (
              rates.map(r => (
                <div key={r.object_id} className="border border-border rounded-xl p-3 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{r.provider} <span className="text-muted-foreground font-normal">— {r.servicelevel?.name}</span></p>
                    <p className="text-xs text-muted-foreground">
                      {r.estimated_days ? `${r.estimated_days} day${r.estimated_days === 1 ? "" : "s"} estimated` : (r.duration_terms || "Estimated delivery varies")}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-display font-bold text-primary">£{parseFloat(r.amount).toFixed(2)}</p>
                    <Button size="sm" className="rounded-xl mt-1 h-8 text-xs" disabled={!!purchasing} onClick={() => buyLabel(r)}>
                      {purchasing === r.object_id ? <Loader2 size={12} className="animate-spin" /> : "Purchase Label →"}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3 text-center py-2">
            <div className="text-3xl">📦✅</div>
            <p className="font-display font-bold">Label created!</p>
            {trackingNumber && <p className="text-sm text-muted-foreground">Tracking: <span className="font-mono">{trackingNumber}</span></p>}
            {labelUrl && (
              <a href={labelUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold">
                <Download size={14} /> Download Label (PDF)
              </a>
            )}
            <p className="text-xs text-muted-foreground">The buyer has been notified by email.</p>
            <Button variant="outline" className="rounded-xl" onClick={() => handleClose(false)}>Close</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
