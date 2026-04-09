import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false } }
    );

    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Auth failed" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    const { listing_id, action, target_price } = await req.json();
    if (!listing_id || !action) {
      return new Response(JSON.stringify({ error: "Missing listing_id or action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get listing + seller info
    const { data: listing } = await supabase
      .from("seller_listings")
      .select("title, seller_id, seller_profiles(user_id, contact_email)")
      .eq("id", listing_id)
      .single();

    if (!listing || !listing.seller_profiles) {
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sellerUserId = listing.seller_profiles.user_id;
    const sellerEmail = listing.seller_profiles.contact_email;

    // Don't notify seller about their own actions
    if (sellerUserId === userData.user.id) {
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "save") {
      // Create in-app notification
      await supabase.from("notifications").insert({
        user_id: sellerUserId,
        type: "listing_saved",
        title: "Someone saved your listing! 🔖",
        message: `Your listing "${listing.title}" was saved by a buyer.`,
        link: `/listing/${listing_id}`,
      });

      // Send email
      if (sellerEmail) {
        try {
          await supabase.functions.invoke("send-transactional-email", {
            body: {
              templateName: "listing-saved",
              recipientEmail: sellerEmail,
              idempotencyKey: `listing-saved-${listing_id}-${userData.user.id}`,
              templateData: { listingTitle: listing.title },
            },
          });
        } catch (e) {
          console.log("[NOTIFY-SELLER] Email failed", e);
        }
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
