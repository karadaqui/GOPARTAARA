// Daily cron: sends collection reminder emails for collection orders > 7 days old still awaiting collection.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function sendEmail(templateName: string, recipientEmail: string, idempotencyKey: string, templateData: Record<string, any>) {
  try {
    const url = `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-transactional-email`;
    await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        "apikey": Deno.env.get("SUPABASE_ANON_KEY")!,
      },
      body: JSON.stringify({ templateName, recipientEmail, idempotencyKey, templateData }),
    });
  } catch (e) { console.error("email fail", e); }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: orders } = await admin.from("orders")
    .select("id, order_number, buyer_id, seller_id, buyer_email, listing_id, created_at, fulfillment_method, status")
    .eq("fulfillment_method", "collection")
    .in("status", ["awaiting_collection", "awaiting_shipment"])
    .lt("created_at", sevenDaysAgo);

  if (!orders?.length) return new Response(JSON.stringify({ processed: 0 }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const listingIds = [...new Set(orders.map(o => o.listing_id))];
  const { data: listings } = await admin.from("seller_listings").select("id, title").in("id", listingIds);
  const titleMap = new Map((listings || []).map((l: any) => [l.id, l.title]));

  let count = 0;
  for (const o of orders) {
    const created_date = new Date(o.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    const product_title = titleMap.get(o.listing_id) || "Order";
    const dayBucket = Math.floor((Date.now() - new Date(o.created_at).getTime()) / (24 * 60 * 60 * 1000));
    const idemSuffix = `${o.id}-day${dayBucket}`;

    if (o.buyer_email) {
      await sendEmail("order-collection-reminder", o.buyer_email, `cr-buyer-${idemSuffix}`, {
        order_number: o.order_number, product_title, created_date, recipient_role: "buyer",
      });
    }
    try {
      const { data: sellerAuth } = await admin.auth.admin.getUserById(o.seller_id);
      const sellerEmail = sellerAuth?.user?.email;
      if (sellerEmail) {
        await sendEmail("order-collection-reminder", sellerEmail, `cr-seller-${idemSuffix}`, {
          order_number: o.order_number, product_title, created_date, recipient_role: "seller",
        });
      }
    } catch {}
    count++;
  }

  return new Response(JSON.stringify({ processed: count }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
