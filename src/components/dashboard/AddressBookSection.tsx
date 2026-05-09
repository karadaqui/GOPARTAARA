import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Star, MapPin, Loader2, Check, CreditCard } from "lucide-react";
import { toast } from "sonner";
import AddressForm, { EMPTY_ADDRESS, isAddressComplete, type AddressFormValue } from "@/components/AddressForm";

interface AddressRow {
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

const MAX = 5;

function rowToForm(r: AddressRow): AddressFormValue {
  return {
    full_name: r.full_name, phone: r.phone || "", street1: r.street1, street2: r.street2 || "",
    city: r.city, county: r.county || "", postcode: r.postcode, country: r.country,
    delivery_instructions: r.delivery_instructions || "", label: r.label,
  };
}

export default function AddressBookSection() {
  const { user } = useAuth();
  const [rows, setRows] = useState<AddressRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<AddressRow | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<AddressFormValue>(EMPTY_ADDRESS);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase.from("user_addresses").select("*").eq("user_id", user.id)
      .order("is_default", { ascending: false }).order("created_at", { ascending: false });
    setRows((data || []) as AddressRow[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const openNew = () => { setEditing(null); setForm({ ...EMPTY_ADDRESS }); setShowForm(true); };
  const openEdit = (r: AddressRow) => { setEditing(r); setForm(rowToForm(r)); setShowForm(true); };

  const save = async () => {
    if (!user) return;
    if (!isAddressComplete(form)) { toast.error("Please complete all required fields."); return; }
    setSaving(true);
    try {
      const payload = {
        label: form.label || "Home",
        full_name: form.full_name,
        phone: form.phone,
        street1: form.street1,
        street2: form.street2 || null,
        city: form.city,
        county: form.county || null,
        postcode: form.postcode,
        country: form.country,
        delivery_instructions: form.delivery_instructions || null,
      };
      if (editing) {
        const { error } = await supabase.from("user_addresses").update(payload).eq("id", editing.id);
        if (error) throw error;
        toast.success("Address updated");
      } else {
        const { error } = await supabase.from("user_addresses").insert({
          ...payload, user_id: user.id, is_default: rows.length === 0,
        });
        if (error) throw error;
        toast.success("Address added");
      }
      setShowForm(false);
      await load();
    } catch (e: any) {
      toast.error(e.message || "Could not save address");
    }
    setSaving(false);
  };

  const remove = async (id: string) => {
    setRows(prev => prev.filter(r => r.id !== id));
    await supabase.from("user_addresses").delete().eq("id", id);
    toast.success("Address removed");
  };

  const setDefault = async (id: string) => {
    setRows(prev => prev.map(r => ({ ...r, is_default: r.id === id })));
    if (!user) return;
    await supabase.from("user_addresses").update({ is_default: false }).eq("user_id", user.id).neq("id", id);
    await supabase.from("user_addresses").update({ is_default: true }).eq("id", id);
  };

  const toggleBilling = async (r: AddressRow) => {
    const next = !r.is_billing;
    setRows(prev => prev.map(x => x.id === r.id ? { ...x, is_billing: next } : x));
    if (!user) return;
    if (next) {
      await supabase.from("user_addresses").update({ is_billing: false }).eq("user_id", user.id).neq("id", r.id);
    }
    await supabase.from("user_addresses").update({ is_billing: next }).eq("id", r.id);
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-display text-lg font-semibold flex items-center gap-2">
            <span aria-hidden>📍</span> My Addresses
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Save up to {MAX} delivery addresses for faster checkout.
          </p>
        </div>
        {rows.length > 0 && (
          <Button
            onClick={openNew}
            disabled={rows.length >= MAX}
            size="sm"
            className="rounded-xl gap-1.5 h-9"
            style={{ background: "#cc1111", color: "white" }}
          >
            <Plus size={14} /> Add Address
          </Button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-8"><Loader2 size={18} className="animate-spin inline text-muted-foreground" /></div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center text-center py-10 px-4">
          <div className="text-5xl mb-3 opacity-40" aria-hidden>📍</div>
          <p className="font-display font-semibold text-base">No saved addresses yet</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs">
            Save your delivery addresses for faster checkout
          </p>
          <Button
            onClick={openNew}
            className="rounded-xl gap-2 mt-5 h-10 px-5"
            style={{ background: "#cc1111", color: "white" }}
          >
            <Plus size={16} /> Add Your First Address
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {rows.map(r => (
            <div key={r.id} className="rounded-xl border border-border bg-secondary/30 p-4 flex flex-col">
              <div className="flex items-center justify-between mb-2 gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary rounded-full px-2.5 py-1">
                  {r.label || "Address"}
                </span>
                <div className="flex gap-1">
                  {r.is_default && (
                    <span className="text-[10px] font-semibold bg-green-100 text-green-700 rounded-full px-2 py-0.5 inline-flex items-center gap-1">
                      <Star size={9} className="fill-current" /> Default
                    </span>
                  )}
                  {r.is_billing && (
                    <span className="text-[10px] font-semibold bg-amber-100 text-amber-800 rounded-full px-2 py-0.5 inline-flex items-center gap-1">
                      <CreditCard size={9} /> Billing
                    </span>
                  )}
                </div>
              </div>
              <p className="text-sm font-semibold">{r.full_name}</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                {[r.street1, r.street2, r.city, r.county, r.postcode, r.country].filter(Boolean).join(", ")}
              </p>
              {r.phone && <p className="text-xs text-muted-foreground mt-1">📞 {r.phone}</p>}
              <div className="mt-3 pt-3 border-t border-border/60 flex flex-wrap items-center gap-2">
                <Button size="sm" variant="outline" className="rounded-lg h-7 text-xs gap-1" onClick={() => openEdit(r)}>
                  <Pencil size={11} /> Edit
                </Button>
                <Button size="sm" variant="outline" className="rounded-lg h-7 text-xs gap-1 text-red-600 hover:text-red-700" onClick={() => remove(r.id)}>
                  <Trash2 size={11} /> Delete
                </Button>
                {!r.is_default && (
                  <button
                    onClick={() => setDefault(r.id)}
                    className="ml-auto text-xs font-medium text-primary hover:underline inline-flex items-center gap-1"
                  >
                    <Star size={11} /> Set as Default
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-card border-border max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">{editing ? "Edit Address" : "Add Address"}</DialogTitle>
          </DialogHeader>
          <AddressForm value={form} onChange={setForm} showLabel />
          <Button onClick={save} disabled={saving} className="rounded-xl gap-2 mt-3">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            {editing ? "Save changes" : "Add address"}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
