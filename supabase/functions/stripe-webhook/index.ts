import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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
    console.log("[STRIPE-WEBHOOK] email", templateName, res.status);
  } catch (e) {
    console.error("[STRIPE-WEBHOOK] email fail", templateName, e);
  }
}

async function handleMarketplaceCheckout(adminClient: any, offerId: string) {
  // Idempotency
  const { data: existing } = await adminClient.from("orders").select("id, order_number").eq("offer_id", offerId).maybeSingle();
  if (existing?.id) {
    console.log("[STRIPE-WEBHOOK] order already exists for offer", offerId);
    return;
  }

  const { data: offer } = await adminClient.from("offers").select("*").eq("id", offerId).maybeSingle();
  if (!offer) { console.error("[STRIPE-WEBHOOK] offer not found", offerId); return; }

  const payload: any = offer.pending_address || {};
  const shipping_address = payload.address || null;
  const billing_address = payload.billing_address || null;
  const fulfillment_method = payload.fulfillment_method === "collection" ? "collection" : "delivery";
  const buyer_name = payload.buyer_name || null;
  const buyer_email = payload.buyer_email || null;
  const delivery_instructions = payload.delivery_instructions || null;

  const { data: listing } = await adminClient.from("seller_listings")
    .select("id, title, photos, shipping_fee, free_shipping, seller_id").eq("id", offer.listing_id).maybeSingle();

  // Resolve seller user id
  let sellerUserId = offer.seller_id;
  if (listing?.seller_id) {
    const { data: sp } = await adminClient.from("seller_profiles").select("user_id, business_name, collection_address, collection_window, collection_instructions").eq("id", listing.seller_id).maybeSingle();
    if (sp?.user_id) sellerUserId = sp.user_id;
    payload._seller = sp;
  }

  const isCollection = fulfillment_method === "collection";
  const shipping_fee = isCollection ? 0 : (listing?.free_shipping ? 0 : Number(listing?.shipping_fee || 0));
  const amount = Number(offer.amount || 0);
  const total_amount = amount + shipping_fee;

  // is_new_account flag
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

  if (insErr) { console.error("[STRIPE-WEBHOOK] order insert failed", insErr); return; }

  // Mark offer as paid
  await adminClient.from("offers").update({ status: "paid" }).eq("id", offerId);

  // In-app notifications
  try {
    await adminClient.from("notifications").insert([
      { user_id: sellerUserId, type: "order_received", title: `New order ${order_number}`, message: `${isCollection ? "Collection requested" : "Ready to ship"} — total £${total_amount.toFixed(2)}`, link: "/my-market" },
      { user_id: offer.buyer_id, type: "order_confirmed", title: `Order ${order_number} confirmed`, message: isCollection ? "Your item will be ready for collection." : "The seller will dispatch your part shortly.", link: "/marketplace" },
    ]);
  } catch (e) { console.error("notify fail", e); }

  // Emails
  const sellerData = payload._seller || {};
  // Get seller email
  let sellerEmail: string | null = null;
  try {
    const { data: sellerAuth } = await adminClient.auth.admin.getUserById(sellerUserId);
    sellerEmail = sellerAuth?.user?.email || null;
  } catch {}
  const payout = Math.round(total_amount * 0.86 * 100) / 100; // ~14% fee

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
}

Deno.serve(async (req) => {
  console.log("[STRIPE-WEBHOOK] Request received:", req.method, new URL(req.url).pathname, "search:", new URL(req.url).search);

  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2025-08-27.basil" });
  const adminClient = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");

  // Manual replay endpoint for debugging — GET ?replay_session=cs_xxx
  const url = new URL(req.url);
  const replaySession = url.searchParams.get("replay_session");
  if (replaySession) {
    console.log("[STRIPE-WEBHOOK] MANUAL REPLAY for session:", replaySession);
    try {
      const session = await stripe.checkout.sessions.retrieve(replaySession);
      console.log("[STRIPE-WEBHOOK] replay payment_status:", session.payment_status, "metadata:", JSON.stringify(session.metadata));
      const metadata = session.metadata || {};
      if (metadata.offerId) {
        await handleMarketplaceCheckout(adminClient, metadata.offerId);
        return new Response(JSON.stringify({ replayed: true, offerId: metadata.offerId, payment_status: session.payment_status }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      return new Response(JSON.stringify({ replayed: false, reason: "no offerId in metadata", metadata }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[STRIPE-WEBHOOK] replay error", msg);
      return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
  }

  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  const signature = req.headers.get("stripe-signature");
  console.log("[STRIPE-WEBHOOK] signature present:", !!signature, "secret configured:", !!webhookSecret);
  const body = await req.text();

  let event: Stripe.Event;
  try {
    if (webhookSecret && signature) {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } else {
      event = JSON.parse(body) as Stripe.Event;
      console.warn("[STRIPE-WEBHOOK] No webhook secret — skipping verification");
    }
  } catch (err) {
    console.error("[STRIPE-WEBHOOK] sig fail", err);
    return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const adminClient = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const metadata = session.metadata || {};

      // Boost
      if (metadata.type === "boost" && metadata.listing_id) {
        const durationDays = parseInt(metadata.duration_days || "7", 10);
        const featuredUntil = new Date();
        featuredUntil.setDate(featuredUntil.getDate() + durationDays);
        await adminClient.from("seller_listings").update({
          featured: true, featured_until: featuredUntil.toISOString(), boost_package: metadata.package_name || null,
        }).eq("id", metadata.listing_id);
      }

      // Subscription handled elsewhere
      if (metadata.type === "subscription") { /* check-subscription edge fn */ }

      // Marketplace order — offerId set in metadata by create-marketplace-checkout
      if (metadata.offerId) {
        await handleMarketplaceCheckout(adminClient, metadata.offerId);
      }
    }

    return new Response(JSON.stringify({ received: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[STRIPE-WEBHOOK]", msg);
    return new Response(JSON.stringify({ error: msg }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 });
  }
});
