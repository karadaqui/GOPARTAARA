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
      console.log("[NOTIFY-SELLER] Listing or seller not found", { listing_id });
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sellerUserId = listing.seller_profiles.user_id;
    const sellerEmail = listing.seller_profiles.contact_email;

    // Don't notify seller about their own actions (except price_drop which notifies buyers)
    if (sellerUserId === userData.user.id && action !== "price_drop") {
      console.log("[NOTIFY-SELLER] Skipping self-notification");
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Helper to send email via direct HTTP call (more reliable than supabase.functions.invoke between edge functions)
    const sendEmail = async (templateName: string, recipientEmail: string, idempotencyKey: string, templateData: Record<string, any>) => {
      console.log("[NOTIFY-SELLER] Sending email", { templateName, recipientEmail });
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
      const result = await res.text();
      console.log("[NOTIFY-SELLER] Email response:", res.status, result);
    };

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
        await sendEmail(
          "listing-saved",
          sellerEmail,
          `listing-saved-${listing_id}-${userData.user.id}`,
          { listingTitle: listing.title }
        );
      }
    }

    if (action === "price_alert" && target_price) {
      await supabase.from("notifications").insert({
        user_id: sellerUserId,
        type: "price_alert_set",
        title: "Price alert set on your listing 🔔",
        message: `Someone set a price alert of £${parseFloat(target_price).toFixed(2)} on your listing "${listing.title}".`,
        link: `/listing/${listing_id}`,
      });

      if (sellerEmail) {
        await sendEmail(
          "price-alert-seller",
          sellerEmail,
          `price-alert-seller-${listing_id}-${userData.user.id}-${Date.now()}`,
          { listingTitle: listing.title, targetPrice: parseFloat(target_price).toFixed(2) }
        );
      }
    }

    if (action === "price_drop") {
      // Notify buyers whose price alerts are now met
      const newPrice = parseFloat(target_price);
      if (isNaN(newPrice)) {
        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Find active price alerts for this listing's title/seller where target >= new price
      const { data: alerts } = await supabase
        .from("price_alerts")
        .select("*")
        .eq("part_name", listing.title)
        .eq("active", true)
        .gte("target_price", newPrice);

      console.log("[NOTIFY-SELLER] Price drop alerts found:", alerts?.length || 0);

      if (alerts && alerts.length > 0) {
        for (const alert of alerts) {
          // In-app notification for buyer
          await supabase.from("notifications").insert({
            user_id: alert.user_id,
            type: "price_drop",
            title: "Price drop on your alert! 🎉",
            message: `Good news! "${listing.title}" is now available at £${newPrice.toFixed(2)}, which meets your price alert of £${parseFloat(alert.target_price).toFixed(2)}.`,
            link: `/listing/${listing_id}`,
          });

          // Send email to buyer
          await sendEmail(
            "price-drop-buyer",
            alert.email,
            `price-drop-${listing_id}-${alert.id}-${Date.now()}`,
            {
              listingTitle: listing.title,
              newPrice: newPrice.toFixed(2),
              targetPrice: parseFloat(alert.target_price).toFixed(2),
              listingUrl: `https://car-part-search.lovable.app/listing/${listing_id}`,
            }
          );

          // Deactivate the alert since it's been triggered
          await supabase.from("price_alerts").update({ active: false }).eq("id", alert.id);
        }
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[NOTIFY-SELLER] Error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
