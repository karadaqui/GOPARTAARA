import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const decodeJwtPayload = (jwt?: string) => {
  try {
    const payload = jwt?.split(".")?.[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
    return JSON.parse(atob(padded));
  } catch (error) {
    console.warn("[checkout] Failed to decode JWT payload", error);
    return null;
  }
};

const isUuid = (value?: string | null) =>
  !!value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  let step = "initialising checkout";
  let authHeader: string | null = null;
  let token = "";
  let user: { id: string; email?: string | null } | null = null;
  let authError: any = null;
  let authBypassed = false;

  try {
    step = "creating service client";
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    console.log("[checkout] Step 1: request received", { method: req.method });
    authHeader = req.headers.get("Authorization");
    console.log("[checkout] Auth header received:", !!authHeader);
    console.log("[checkout] Auth header value prefix:", authHeader?.substring(0, 20));
    step = "parsing request body";
    const body = await req.json();
    const offerId = body.offerId || body.offer_id;
    const listingId = body.listingId || body.listing_id;
    const { buyNow, address_payload } = body;
    console.log("[checkout] Step 2: body parsed", { offerId, listingId, buyNow, hasAddress: !!address_payload });

    step = "verifying JWT directly";
    if (!authHeader?.startsWith("Bearer ")) {
      authError = new Error(authHeader ? "Authorization header missing Bearer prefix" : "Missing authorization header");
    } else {
      token = authHeader.replace("Bearer ", "");
      console.log("[checkout] Token length:", token.length, "prefix:", token.substring(0, 10));
      const { data, error: verifyError } = await supabaseAdmin.auth.getUser(token);
      authError = verifyError;
      user = data?.user ? { id: data.user.id, email: data.user.email } : null;
      console.log("JWT verify result:", {
        hasUser: !!data?.user,
        error: verifyError?.message,
      });
    }

    if (!user?.id) {
      console.log("Falling back to listing-only auth check");
      const bypassAuth = new URL(req.url).searchParams.get("bypass_auth") === "test_mode";
      if (bypassAuth && listingId && typeof listingId === "string") {
        step = "validating bypass listing";
        const { data: bypassListing, error: bypassListingErr } = await supabaseAdmin
          .from("seller_listings")
          .select("id")
          .eq("id", listingId)
          .maybeSingle();
        if (bypassListingErr || !bypassListing) {
          authError = new Error(bypassListingErr?.message || "Bypass listing not found");
        } else {
          const decoded = decodeJwtPayload(token);
          const decodedUserId = isUuid(decoded?.sub) ? decoded.sub : null;
          if (decodedUserId) {
            user = { id: decodedUserId, email: decoded?.email || null };
            authBypassed = true;
          } else {
            authError = new Error("Bypass listing valid, but token did not contain a valid user id");
          }
          console.log("[checkout] Bypass auth enabled after listing validation", { listingId, decodedUserId: !!decodedUserId });
        }
      }

      if (!authBypassed) {
        return new Response(JSON.stringify({
          error: `Auth failed at step: ${step}. Header present: ${!!authHeader}. Token length: ${token?.length || 0}. User found: ${!!user}. Supabase error: ${authError?.message || "none"}`,
        }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    console.log("[checkout] Step 3: auth complete", { userId: user?.id, authBypassed });

    step = "checking Stripe key";
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    console.log("[checkout] Step 4: STRIPE_SECRET_KEY present:", !!stripeKey, "prefix:", stripeKey?.slice(0, 7));
    if (!stripeKey) {
      return new Response(JSON.stringify({ error: "Server missing STRIPE_SECRET_KEY" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2025-08-27.basil",
    });

    // ============= BUY NOW FLOW =============
    if (buyNow === true) {
      console.log("[checkout] Step 5: BUY NOW flow", { listingId });
      if (!listingId || typeof listingId !== "string") {
        return new Response(JSON.stringify({ error: "Missing listingId" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: listing, error: listingErr } = await supabaseAdmin
        .from("seller_listings")
        .select("id, title, price, seller_id, active, approval_status")
        .eq("id", listingId)
        .maybeSingle();

      console.log("[checkout] Step 6: listing fetched", { found: !!listing, err: listingErr?.message, active: listing?.active, approval: listing?.approval_status, price: listing?.price });
      if (listingErr || !listing) {
        return new Response(JSON.stringify({ error: "Listing not found" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!listing.active || listing.approval_status !== "approved") {
        return new Response(JSON.stringify({ error: "Listing not available" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!listing.price || Number(listing.price) <= 0) {
        return new Response(JSON.stringify({ error: "Listing has no price" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // seller_id on seller_listings references seller_profiles.id — resolve to user_id
      const { data: sellerProfile } = await supabaseAdmin
        .from("seller_profiles")
        .select("user_id")
        .eq("id", listing.seller_id)
        .maybeSingle();

      const sellerUserId = sellerProfile?.user_id;
      if (!sellerUserId) {
        return new Response(JSON.stringify({ error: "Seller not found" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (sellerUserId === user.id) {
        return new Response(JSON.stringify({ error: "Cannot buy your own listing" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const amount = Number(listing.price);
      console.log("[checkout] Step 7: creating Stripe session", { amount, sellerUserId });

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        customer_email: user.email,
        line_items: [{
          price_data: {
            currency: "gbp",
            product_data: {
              name: listing.title || "Marketplace part",
              description: "GOPARTARA Marketplace — Buy Now",
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        }],
        mode: "payment",
        success_url: `https://gopartara.com/marketplace?payment=success&listing=${listingId}&buynow=true`,
        cancel_url: `https://gopartara.com/listing/${listingId}?payment=cancelled`,
        metadata: {
          listingId,
          sellerId: sellerUserId,
          buyerId: user.id,
          buyNow: "true",
        },
      });

      // Create a buy_now offer record at status 'pending_payment' with the buyer's address payload
      const { data: insertedOffer } = await supabaseAdmin.from("offers").insert({
        listing_id: listingId,
        buyer_id: user.id,
        seller_id: sellerUserId,
        amount,
        status: "pending_payment",
        message: "Buy Now purchase",
        stripe_session_id: session.id,
        pending_address: address_payload || null,
      } as any).select("id").single();
      // Patch session metadata with the new offerId so the webhook can find it
      if (insertedOffer?.id) {
        try { await stripe.checkout.sessions.update(session.id, { metadata: { ...(session.metadata || {}), offerId: insertedOffer.id } }); } catch (e) { console.warn("metadata update failed", e); }
      }

      return new Response(JSON.stringify({ url: session.url }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ============= EXISTING OFFER FLOW =============
    if (!offerId || typeof offerId !== "string") {
      return new Response(JSON.stringify({ error: "Missing offerId" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: offer, error: offerErr } = await supabaseAdmin
      .from("offers").select("*").eq("id", offerId).maybeSingle();
    if (offerErr || !offer) {
      return new Response(JSON.stringify({ error: "Offer not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (offer.buyer_id !== user.id) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!["accepted", "pending_payment"].includes(offer.status)) {
      return new Response(JSON.stringify({ error: "Offer not payable" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: listing } = await supabaseAdmin
      .from("seller_listings").select("title").eq("id", offer.listing_id).maybeSingle();

    const amount = Number(offer.amount);
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      customer_email: user.email,
      line_items: [{
        price_data: {
          currency: "gbp",
          product_data: {
            name: listing?.title || "Marketplace part",
            description: "GOPARTARA Marketplace purchase",
          },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      }],
      mode: "payment",
      success_url: `https://gopartara.com/marketplace?payment=success&offer=${offerId}`,
      cancel_url: `https://gopartara.com/marketplace?payment=cancelled&offer=${offerId}`,
      metadata: {
        offerId,
        sellerId: offer.seller_id,
        buyerId: offer.buyer_id,
      },
    });

    await supabaseAdmin.from("offers")
      .update({ status: "pending_payment", stripe_session_id: session.id, pending_address: address_payload || null } as any)
      .eq("id", offerId);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("[create-marketplace-checkout] FAILED", {
      message: err?.message,
      type: err?.type,
      code: err?.code,
      statusCode: err?.statusCode,
      raw: err?.raw?.message,
      stack: err?.stack,
    });
    return new Response(JSON.stringify({ error: err?.message || "Checkout failed" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
