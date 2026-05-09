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
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-display font-bold text-lg flex items-center gap-2"><MapPin size={18} className="text-primary" /> My Addresses</h3>
          <p className="text-xs text-muted-foreground">Save up to {MAX} delivery addresses for faster checkout.</p>
        </div>
        <Button onClick={openNew} disabled={rows.length >= MAX} className="rounded-xl gap-2 h-9">
          <Plus size={14} /> Add Address
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-6"><Loader2 size={16} className="animate-spin inline" /></div>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">No addresses saved yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {rows.map(r => (
            <div key={r.id} className="rounded-xl border border-border bg-secondary/30 p-3">
              <div className="flex items-center justify-between mb-1 gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-primary">{r.label}</span>
                <div className="flex gap-1">
                  {r.is_default && <span className="text-[10px] bg-primary/10 text-primary rounded-full px-2 py-0.5 inline-flex items-center gap-1"><Star size={9} className="fill-current"/>Default</span>}
                  {r.is_billing && <span className="text-[10px] bg-amber-100 text-amber-800 rounded-full px-2 py-0.5 inline-flex items-center gap-1"><CreditCard size={9}/>Billing</span>}
                </div>
              </div>
              <p className="text-sm font-medium">{r.full_name}</p>
              <p className="text-xs text-muted-foreground">{[r.street1, r.street2, r.city, r.county, r.postcode, r.country].filter(Boolean).join(", ")}</p>
              {r.phone && <p className="text-xs text-muted-foreground mt-1">📞 {r.phone}</p>}
              <div className="mt-2 flex flex-wrap gap-1">
                <Button size="sm" variant="outline" className="rounded-lg h-7 text-xs gap-1" onClick={() => openEdit(r)}>
                  <Pencil size={11} /> Edit
                </Button>
                {!r.is_default && (
                  <Button size="sm" variant="outline" className="rounded-lg h-7 text-xs gap-1" onClick={() => setDefault(r.id)}>
                    <Star size={11} /> Set default
                  </Button>
                )}
                <Button size="sm" variant="outline" className="rounded-lg h-7 text-xs gap-1" onClick={() => toggleBilling(r)}>
                  <CreditCard size={11} /> {r.is_billing ? "Unset billing" : "Set billing"}
                </Button>
                <Button size="sm" variant="outline" className="rounded-lg h-7 text-xs gap-1 text-red-600 hover:text-red-700" onClick={() => remove(r.id)}>
                  <Trash2 size={11} /> Delete
                </Button>
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
