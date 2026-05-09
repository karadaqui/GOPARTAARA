import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Package, MapPin, ArrowRight, ShoppingBag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SafeImage from "@/components/SafeImage";

interface OrderInfo {
  order_number: string;
  total_amount: number;
  shipping_address: any;
  fulfillment_method: string;
  listing: { title: string; photos?: string[] | null } | null;
}

export default function OrderConfirmation() {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const [order, setOrder] = useState<OrderInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;

    // Trigger confirm-order to fulfill the order without depending on the webhook
    if (sessionId) {
      supabase.functions
        .invoke("confirm-order", { body: { session_id: sessionId } })
        .then(({ data, error }) => {
          if (error) console.warn("confirm-order failed", error);
          else console.log("confirm-order result", data);
        })
        .catch((e) => console.warn("confirm-order threw", e));
    }

    const poll = async () => {
      if (cancelled || !sessionId) return;
      attempts++;

      try {
        const { data: offer } = await supabase
          .from("offers")
          .select("id, listing_id")
          .eq("stripe_session_id", sessionId)
          .maybeSingle();

        if (offer?.id) {
          const { data: orderRow } = await supabase
            .from("orders")
            .select("order_number, total_amount, shipping_address, fulfillment_method, listing_id")
            .eq("offer_id", offer.id)
            .maybeSingle();

          if (orderRow) {
            const { data: listing } = await supabase
              .from("seller_listings")
              .select("title, photos")
              .eq("id", orderRow.listing_id)
              .maybeSingle();

            if (!cancelled) {
              setOrder({
                order_number: orderRow.order_number,
                total_amount: Number(orderRow.total_amount),
                shipping_address: orderRow.shipping_address,
                fulfillment_method: orderRow.fulfillment_method,
                listing: listing as any,
              });
              setLoading(false);
            }
            return;
          }
        }
      } catch (e) {
        console.warn("order lookup failed", e);
      }

      if (attempts < 15 && !cancelled) {
        setTimeout(poll, 2000);
      } else if (!cancelled) {
        setLoading(false);
      }
    };

    poll();
    return () => { cancelled = true; };
  }, [sessionId]);

  const addr = order?.shipping_address;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success/10 mb-4">
            <CheckCircle2 className="w-10 h-10 text-success" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Payment Successful!</h1>
          <p className="text-muted-foreground">Thank you for your purchase.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Order Details</span>
              {order && (
                <span className="text-sm font-mono text-primary">{order.order_number}</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading && (
              <p className="text-sm text-muted-foreground">Confirming your order…</p>
            )}

            {order && (
              <>
                <div className="flex gap-4 items-start">
                  {order.listing?.photos?.[0] && (
                    <SafeImage
                      src={order.listing.photos[0]}
                      alt={order.listing.title}
                      className="w-20 h-20 object-cover rounded border border-border"
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Package className="w-4 h-4" />
                      <span>Item</span>
                    </div>
                    <p className="font-medium">{order.listing?.title || "Marketplace part"}</p>
                    <p className="text-lg font-semibold mt-1">£{order.total_amount.toFixed(2)}</p>
                  </div>
                </div>

                {addr && order.fulfillment_method !== "collection" && (
                  <div className="border-t border-border pt-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <MapPin className="w-4 h-4" />
                      <span>Delivery address</span>
                    </div>
                    <p className="text-sm">
                      {[addr.line1, addr.line2, addr.city, addr.postcode, addr.country]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  </div>
                )}
              </>
            )}

            {!loading && !order && (
              <p className="text-sm text-muted-foreground">
                Your payment was received. Order details will appear in your dashboard shortly.
              </p>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
          <Button asChild className="btn-navy">
            <Link to="/dashboard">
              View My Orders <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/search">
              <ShoppingBag className="w-4 h-4 mr-2" /> Continue Shopping
            </Link>
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
}
