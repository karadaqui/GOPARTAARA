import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user } } = await supabaseUser.auth.getUser(authHeader.replace("Bearer ", ""));
    if (!user?.email) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { offerId, listingId, buyNow } = body;

    // Service-role client for trusted reads/writes
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
      apiVersion: "2025-08-27.basil",
    });

    // ============= BUY NOW FLOW =============
    if (buyNow === true) {
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

      // Create a buy_now offer record at status 'pending_payment'
      await supabaseAdmin.from("offers").insert({
        listing_id: listingId,
        buyer_id: user.id,
        seller_id: sellerUserId,
        amount,
        status: "pending_payment",
        message: "Buy Now purchase",
        stripe_session_id: session.id,
      });

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
      .update({ status: "pending_payment", stripe_session_id: session.id })
      .eq("id", offerId);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("[create-marketplace-checkout]", err);
    return new Response(JSON.stringify({ error: err.message || "Checkout failed" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
