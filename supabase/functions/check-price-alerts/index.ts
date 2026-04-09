const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const EBAY_BROWSE_API_URL = "https://api.ebay.com/buy/browse/v1/item/";
const EBAY_OAUTH_URL = "https://api.ebay.com/identity/v1/oauth2/token";
const EBAY_AFFILIATE_CAMPID = "5339148333";
const SITE_NAME = "PARTARA";

// OAuth token cache
let oauthToken: { token: string; expiresAt: number } | null = null;

async function getOAuthToken(appId: string, certId: string): Promise<string> {
  if (oauthToken && Date.now() < oauthToken.expiresAt - 60_000) {
    return oauthToken.token;
  }
  const credentials = btoa(`${appId}:${certId}`);
  const response = await fetch(EBAY_OAUTH_URL, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials&scope=https%3A%2F%2Fapi.ebay.com%2Foauth%2Fapi_scope",
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OAuth failed: ${response.status} - ${text}`);
  }
  const data = await response.json();
  oauthToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in * 1000),
  };
  return oauthToken.token;
}

async function getItemPrice(itemId: string, token: string): Promise<{ price: number; title: string; url: string } | null> {
  try {
    const response = await fetch(`${EBAY_BROWSE_API_URL}${encodeURIComponent(itemId)}`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "X-EBAY-C-MARKETPLACE-ID": "EBAY_GB",
        "X-EBAY-C-ENDUSERCTX": `affiliateCampaignId=${EBAY_AFFILIATE_CAMPID},affiliateReferenceId=partara`,
      },
    });
    if (!response.ok) {
      console.log(`[check-alerts] Item ${itemId} fetch failed: ${response.status}`);
      return null;
    }
    const item = await response.json();
    const price = parseFloat(item.price?.value || "0");
    const title = item.title || "Car Part";
    const url = item.itemAffiliateWebUrl || item.itemWebUrl || "";
    return { price, title, url };
  } catch (e) {
    console.error(`[check-alerts] Error fetching item ${itemId}:`, e);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const json = (data: any, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const EBAY_APP_ID = Deno.env.get("EBAY_APP_ID");
    const EBAY_CERT_ID = Deno.env.get("EBAY_CERT_ID");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!EBAY_APP_ID || !EBAY_CERT_ID || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("[check-alerts] Missing environment variables");
      return json({ error: "Configuration error" }, 500);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get active, non-triggered alerts with eBay item IDs
    const { data: alerts, error: alertsError } = await supabase
      .from("price_alerts")
      .select("*")
      .eq("active", true)
      .eq("triggered", false)
      .not("ebay_item_id", "is", null);

    if (alertsError) {
      console.error("[check-alerts] DB error:", alertsError);
      return json({ error: "Database error" }, 500);
    }

    if (!alerts || alerts.length === 0) {
      console.log("[check-alerts] No active alerts to check");
      return json({ checked: 0, triggered: 0 });
    }

    console.log(`[check-alerts] Checking ${alerts.length} active alerts`);

    // Get OAuth token
    const token = await getOAuthToken(EBAY_APP_ID, EBAY_CERT_ID);

    let checked = 0;
    let triggered = 0;

    // Process alerts in batches to avoid rate limits
    for (const alert of alerts) {
      checked++;

      // Small delay between API calls
      if (checked > 1) await new Promise(r => setTimeout(r, 200));

      const itemData = await getItemPrice(alert.ebay_item_id, token);
      
      if (!itemData) {
        // Item no longer available — update last_checked_at only
        await supabase
          .from("price_alerts")
          .update({ last_checked_at: new Date().toISOString() } as any)
          .eq("id", alert.id);
        continue;
      }

      const { price: currentPrice, title, url } = itemData;

      // Update current price and last checked time
      await supabase
        .from("price_alerts")
        .update({
          current_price: currentPrice,
          last_checked_at: new Date().toISOString(),
        } as any)
        .eq("id", alert.id);

      // Check if price dropped below target
      if (currentPrice <= alert.target_price) {
        console.log(`[check-alerts] TRIGGERED: ${title} now £${currentPrice} (target: £${alert.target_price})`);

        // Send email notification
        try {
          await supabase.functions.invoke("send-transactional-email", {
            body: {
              templateName: "price-drop-buyer",
              recipientEmail: alert.email,
              idempotencyKey: `price-alert-${alert.id}-${Date.now()}`,
              templateData: {
                listingTitle: title,
                newPrice: currentPrice.toFixed(2),
                targetPrice: Number(alert.target_price).toFixed(2),
                listingUrl: url || alert.url || "https://car-part-search.lovable.app",
              },
            },
          });
          console.log(`[check-alerts] Email sent to ${alert.email}`);
        } catch (emailErr) {
          console.error(`[check-alerts] Email failed for alert ${alert.id}:`, emailErr);
          // Still mark as triggered even if email fails — we'll log it
        }

        // Also create an in-app notification
        await supabase.from("notifications").insert({
          user_id: alert.user_id,
          type: "price_drop",
          title: "Price Drop Alert! 🎉",
          message: `"${title}" is now £${currentPrice.toFixed(2)}, below your target of £${Number(alert.target_price).toFixed(2)}!`,
          link: url || alert.url,
        });

        // Mark alert as triggered
        await supabase
          .from("price_alerts")
          .update({
            triggered: true,
            triggered_at: new Date().toISOString(),
            current_price: currentPrice,
          } as any)
          .eq("id", alert.id);

        triggered++;
      }
    }

    console.log(`[check-alerts] Done: checked=${checked}, triggered=${triggered}`);
    return json({ checked, triggered });
  } catch (error) {
    console.error("[check-alerts] Unhandled error:", error);
    return json({ error: "Internal error" }, 500);
  }
});
