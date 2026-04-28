import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ExternalLink, RefreshCcw, Check } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const ADMIN_EMAIL = "info@gopartara.com";
const COMMISSION_RATE = 0.05;

interface SaleRow {
  id: string;
  created_at: string;
  amount: number;
  status: string;
  payout_sent: boolean;
  payout_date: string | null;
  stripe_session_id: string | null;
  buyer_id: string;
  seller_id: string;
  listing_id: string;
  listing_title?: string;
  buyer_email?: string;
  seller_email?: string;
  seller_display_name?: string;
  payout?: {
    full_name?: string | null;
    sort_code?: string | null;
    account_number?: string | null;
    paypal_email?: string | null;
    preferred_method?: string | null;
  } | null;
}

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

const AdminSales = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<SaleRow[]>([]);
  const [refundTarget, setRefundTarget] = useState<SaleRow | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.email !== ADMIN_EMAIL) {
      navigate("/dashboard");
      return;
    }
    loadSales();
  }, [user, authLoading]);

  const loadSales = async () => {
    setLoading(true);
    try {
      const { data: offers, error } = await supabase
        .from("offers")
        .select("*")
        .in("status", ["paid", "pending_payment"])
        .order("created_at", { ascending: false });

      if (error) throw error;
      const offersList = (offers || []) as any[];

      const listingIds = [...new Set(offersList.map(o => o.listing_id))];
      const userIds = [...new Set([
        ...offersList.map(o => o.buyer_id),
        ...offersList.map(o => o.seller_id),
      ])];

      const [{ data: listings }, { data: profiles }, { data: payouts }] = await Promise.all([
        supabase.from("seller_listings").select("id, title").in("id", listingIds),
        supabase.from("profiles").select("user_id, email, display_name").in("user_id", userIds),
        supabase.from("seller_payout_info" as any).select("*").in("user_id", userIds),
      ]);

      const listingMap = new Map((listings || []).map((l: any) => [l.id, l.title]));
      const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));
      const payoutMap = new Map((payouts || []).map((p: any) => [p.user_id, p]));

      const enriched: SaleRow[] = offersList.map(o => ({
        ...o,
        listing_title: listingMap.get(o.listing_id) || "—",
        buyer_email: (profileMap.get(o.buyer_id) as any)?.email || "—",
        seller_email: (profileMap.get(o.seller_id) as any)?.email || "—",
        seller_display_name: (profileMap.get(o.seller_id) as any)?.display_name || null,
        payout: payoutMap.get(o.seller_id) || null,
      }));

      setRows(enriched);
    } catch (err: any) {
      console.error(err);
      toast({ title: "Failed to load sales", description: err.message, variant: "destructive" });
    }
    setLoading(false);
  };

  const markPayoutSent = async (offerId: string) => {
    try {
      const { error } = await supabase
        .from("offers")
        .update({ payout_sent: true, payout_date: new Date().toISOString() } as any)
        .eq("id", offerId);
      if (error) throw error;
      setRows(prev => prev.map(r => r.id === offerId ? { ...r, payout_sent: true, payout_date: new Date().toISOString() } : r));
      toast({ title: "Marked as paid out" });
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    }
  };

  const handleRefund = async () => {
    if (!refundTarget) return;
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("process-marketplace-refund", {
        body: { sessionId: refundTarget.stripe_session_id, offerId: refundTarget.id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: "Refund processed", description: `Refund ID: ${data.refundId}` });
      setRows(prev => prev.filter(r => r.id !== refundTarget.id));
    } catch (err: any) {
      toast({ title: "Refund failed", description: err.message, variant: "destructive" });
    }
    setProcessing(false);
    setRefundTarget(null);
  };

  const paidRows = rows.filter(r => r.status === "paid");
  const totalReceived = paidRows.reduce((s, r) => s + Number(r.amount), 0);
  const yourEarnings = totalReceived * COMMISSION_RATE;
  const totalToPayOut = paidRows.filter(r => !r.payout_sent).reduce((s, r) => s + Number(r.amount) * (1 - COMMISSION_RATE), 0);
  const totalSales = paidRows.length;
  const avgSale = totalSales > 0 ? totalReceived / totalSales : 0;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-24 flex justify-center">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Sales Dashboard | GOPARTARA Admin" description="Admin sales dashboard" path="/admin/sales" />
      <Navbar />

      <div className="container max-w-7xl py-20 px-4">
        <h1 className="font-display text-3xl font-bold mb-8">💰 Sales Dashboard</h1>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <StatCard label="Your Earnings (5%)" value={`£${yourEarnings.toFixed(2)}`} valueColor="#22c55e" />
          <StatCard label="Total To Send" value={`£${totalToPayOut.toFixed(2)}`} valueColor="#f59e0b" subtitle="unpaid payouts" />
          <StatCard label="Total Received" value={`£${totalReceived.toFixed(2)}`} subtitle="gross sales" />
          <StatCard label="Avg Sale Value" value={`£${avgSale.toFixed(2)}`} />
        </div>

        {/* Table */}
        <div className="rounded-xl border border-border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="text-left p-3">Date</th>
                <th className="text-left p-3">Part</th>
                <th className="text-left p-3">Buyer</th>
                <th className="text-left p-3">Seller</th>
                <th className="text-left p-3">Sale Price</th>
                <th className="text-left p-3">Your Cut (5%)</th>
                <th className="text-left p-3">Send to Seller</th>
                <th className="text-left p-3">Stripe</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Payout</th>
                <th className="text-left p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={11} className="p-8 text-center text-muted-foreground">No sales yet</td></tr>
              )}
              {rows.map(r => (
                <tr key={r.id} className="border-t border-border align-top">
                  <td className="p-3 whitespace-nowrap">{fmtDate(r.created_at)}</td>
                  <td className="p-3 max-w-[200px] truncate" title={r.listing_title}>{r.listing_title}</td>
                  <td className="p-3 text-xs">{r.buyer_email}</td>
                  <td className="p-3 text-xs">
                    <div>{r.seller_email}</div>
                    {r.payout && (r.payout.paypal_email || r.payout.account_number) ? (
                      <div className="mt-1 text-[11px] text-muted-foreground leading-tight">
                        {r.payout.preferred_method === "paypal" || (!r.payout.account_number && r.payout.paypal_email) ? (
                          <div>💙 PayPal: {r.payout.paypal_email}</div>
                        ) : (
                          <>
                            <div>🏦 Sort: {r.payout.sort_code} | Acc: {r.payout.account_number}</div>
                            {r.payout.full_name && <div>Name: {r.payout.full_name}</div>}
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="mt-1 text-[11px] text-destructive font-medium">⚠️ No payout info</div>
                    )}
                  </td>
                  <td className="p-3 font-semibold whitespace-nowrap text-foreground">£{Number(r.amount).toFixed(2)}</td>
                  <td className="p-3 whitespace-nowrap">
                    <div className="font-semibold" style={{ color: '#22c55e' }}>£{(Number(r.amount) * COMMISSION_RATE).toFixed(2)}</div>
                    <div className="text-[12px] text-muted-foreground">platform fee</div>
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    <div style={{ color: '#cc1111', fontWeight: 700, fontSize: '16px' }}>
                      £{(Number(r.amount) * (1 - COMMISSION_RATE)).toFixed(2)}
                    </div>
                    {r.payout && (r.payout.paypal_email || r.payout.account_number) ? (
                      <div className="mt-0.5 text-[11px] text-muted-foreground leading-tight">
                        {r.payout.preferred_method === "paypal" || (!r.payout.account_number && r.payout.paypal_email) ? (
                          <>💙 {r.payout.paypal_email}</>
                        ) : (
                          <>🏦 {r.payout.sort_code} / {r.payout.account_number}</>
                        )}
                      </div>
                    ) : (
                      <div className="mt-0.5 text-[11px] text-destructive font-medium">⚠️ No payout info!</div>
                    )}
                  </td>
                  <td className="p-3">
                    {r.stripe_session_id ? (
                      <a
                        href={`https://dashboard.stripe.com/payments/${r.stripe_session_id}`}
                        target="_blank" rel="noopener noreferrer"
                        className="text-primary hover:underline inline-flex items-center gap-1 text-xs"
                      >
                        View <ExternalLink size={11} />
                      </a>
                    ) : <span className="text-muted-foreground text-xs">—</span>}
                  </td>
                  <td className="p-3">
                    {r.status === "paid" ? (
                      <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30">Paid</Badge>
                    ) : (
                      <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30">Pending</Badge>
                    )}
                  </td>
                  <td className="p-3">
                    {r.payout_sent ? (
                      <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30">Sent ✓</Badge>
                    ) : (
                      <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30">Pending ⏳</Badge>
                    )}
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    <div className="flex flex-col gap-1.5">
                      {!r.payout_sent && r.status === "paid" && (
                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => markPayoutSent(r.id)}>
                          <Check size={12} /> Mark Payout Sent
                        </Button>
                      )}
                      {r.status === "paid" && r.stripe_session_id && (
                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => setRefundTarget(r)}>
                          <RefreshCcw size={12} /> Refund
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AlertDialog open={!!refundTarget} onOpenChange={(o) => !o && setRefundTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm refund</AlertDialogTitle>
            <AlertDialogDescription>
              Refund £{refundTarget ? Number(refundTarget.amount).toFixed(2) : "0.00"} to buyer? This will be processed through Stripe.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRefund} disabled={processing}>
              {processing ? "Processing..." : "Confirm Refund"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Footer />
    </div>
  );
};

const StatCard = ({ label, value, valueColor, subtitle }: { label: string; value: string; valueColor?: string; subtitle?: string }) => (
  <div className="rounded-xl border border-border bg-card p-4">
    <div className="text-xs uppercase text-muted-foreground tracking-wide">{label}</div>
    <div className="font-display text-2xl font-bold mt-1" style={valueColor ? { color: valueColor } : undefined}>{value}</div>
    {subtitle && <div className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</div>}
  </div>
);

export default AdminSales;
