import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function genOrderNumber() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `GP-${s}`;
}

async function sendEmail(templateName: string, recipientEmail: string, idempotencyKey: string, templateData: Record<string, any>) {
  try {
    const url = `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-transactional-email`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        "apikey": Deno.env.get("SUPABASE_ANON_KEY")!,
      },
      body: JSON.stringify({ templateName, recipientEmail, idempotencyKey, templateData }),
    });
    console.log("[CONFIRM-ORDER] email", templateName, res.status);
  } catch (e) {
    console.error("[CONFIRM-ORDER] email fail", templateName, e);
  }
}

async function fulfillOffer(adminClient: any, offerId: string) {
  // Idempotency check
  const { data: existing } = await adminClient
    .from("orders")
    .select("id, order_number")
    .eq("offer_id", offerId)
    .maybeSingle();
  if (existing?.id) {
    console.log("[CONFIRM-ORDER] order already exists for offer", offerId);
    return { order_number: existing.order_number, already: true };
  }

  const { data: offer } = await adminClient.from("offers").select("*").eq("id", offerId).maybeSingle();
  if (!offer) throw new Error(`Offer ${offerId} not found`);

  const payload: any = offer.pending_address || {};
  const shipping_address = payload.address || null;
  const billing_address = payload.billing_address || null;
  const fulfillment_method = payload.fulfillment_method === "collection" ? "collection" : "delivery";
  const buyer_name = payload.buyer_name || null;
  const buyer_email = payload.buyer_email || null;
  const delivery_instructions = payload.delivery_instructions || null;

  const { data: listing } = await adminClient
    .from("seller_listings")
    .select("id, title, photos, shipping_fee, free_shipping, seller_id")
    .eq("id", offer.listing_id)
    .maybeSingle();

  let sellerUserId = offer.seller_id;
  let sellerData: any = {};
  if (listing?.seller_id) {
    const { data: sp } = await adminClient
      .from("seller_profiles")
      .select("user_id, business_name, collection_address, collection_window, collection_instructions")
      .eq("id", listing.seller_id)
      .maybeSingle();
    if (sp?.user_id) sellerUserId = sp.user_id;
    sellerData = sp || {};
  }

  const isCollection = fulfillment_method === "collection";
  const shipping_fee = isCollection ? 0 : (listing?.free_shipping ? 0 : Number(listing?.shipping_fee || 0));
  const amount = Number(offer.amount || 0);
  const total_amount = amount + shipping_fee;

  let is_new_account = false;
  try {
    const { data: u } = await adminClient.auth.admin.getUserById(offer.buyer_id);
    const created = u?.user?.created_at ? new Date(u.user.created_at).getTime() : 0;
    is_new_account = created > 0 && (Date.now() - created) < 7 * 24 * 60 * 60 * 1000;
  } catch { /* ignore */ }

  const order_number = genOrderNumber();

  const { data: inserted, error: insErr } = await adminClient.from("orders").insert({
    listing_id: offer.listing_id,
    seller_id: sellerUserId,
    buyer_id: offer.buyer_id,
    offer_id: offerId,
    amount,
    shipping_fee,
    total_amount,
    status: isCollection ? "awaiting_collection" : "awaiting_shipment",
    buyer_name,
    buyer_email,
    shipping_address,
    billing_address,
    fulfillment_method,
    delivery_instructions,
    order_number,
    is_new_account,
  } as any).select("id, order_number").single();

  if (insErr) throw new Error(`order insert failed: ${insErr.message}`);

  await adminClient.from("offers").update({ status: "paid" }).eq("id", offerId);

  try {
    await adminClient.from("notifications").insert([
      { user_id: sellerUserId, type: "order_received", title: `New order ${order_number}`, message: `${isCollection ? "Collection requested" : "Ready to ship"} — total £${total_amount.toFixed(2)}`, link: "/my-market" },
      { user_id: offer.buyer_id, type: "order_confirmed", title: `Order ${order_number} confirmed`, message: isCollection ? "Your item will be ready for collection." : "The seller will dispatch your part shortly.", link: "/marketplace" },
    ]);
  } catch (e) { console.error("notify fail", e); }

  let sellerEmail: string | null = null;
  try {
    const { data: sellerAuth } = await adminClient.auth.admin.getUserById(sellerUserId);
    sellerEmail = sellerAuth?.user?.email || null;
  } catch {}
  const payout = Math.round(total_amount * 0.86 * 100) / 100;

  if (buyer_email) {
    await sendEmail("order-confirmation-buyer", buyer_email, `order-buyer-${inserted.id}`, {
      order_number, buyer_name, product_title: listing?.title || "Part",
      amount, shipping_fee, total_amount, fulfillment_method,
      shipping_address, seller_business: sellerData.business_name,
      collection_address: sellerData.collection_address,
      collection_window: sellerData.collection_window,
      collection_instructions: sellerData.collection_instructions,
    });
  }
  if (sellerEmail) {
    await sendEmail("order-received-seller", sellerEmail, `order-seller-${inserted.id}`, {
      order_number, product_title: listing?.title || "Part",
      buyer_name: buyer_name || "Buyer", buyer_email,
      total_amount, payout_amount: payout, fulfillment_method,
      shipping_address, is_new_account,
    });
  }

  return { order_number, already: false };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // ── Auth gate: require a valid user JWT ──
    const authHeader = req.headers.get("Authorization") || "";
    const bearer = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    if (!bearer) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    const { data: userData, error: userErr } = await adminClient.auth.getUser(bearer);
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const callerId = userData.user.id;

    const { session_id } = await req.json();
    if (!session_id) {
      return new Response(JSON.stringify({ error: "session_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2025-08-27.basil" });
    const session = await stripe.checkout.sessions.retrieve(session_id);

    console.log("[CONFIRM-ORDER]", session_id, "payment_status:", session.payment_status);

    if (session.payment_status !== "paid") {
      return new Response(JSON.stringify({ status: session.payment_status, paid: false }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const offerId = (session.metadata as any)?.offerId;
    if (!offerId) {
      return new Response(JSON.stringify({ error: "no offerId in session metadata", paid: true }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify caller owns the offer (buyer) before fulfilling
    const { data: offerRow } = await adminClient
      .from("offers").select("buyer_id").eq("id", offerId).maybeSingle();
    if (!offerRow || offerRow.buyer_id !== callerId) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await fulfillOffer(adminClient, offerId);

    return new Response(JSON.stringify({ paid: true, ...result }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[CONFIRM-ORDER] error", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
