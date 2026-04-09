import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const log = (step: string, details?: any) => {
  const d = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[MODERATE-LISTING] ${step}${d}`);
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      log("No auth header");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use anon key + user's token to validate the JWT
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false } }
    );

    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData?.user) {
      log("Auth failed", { error: userError?.message });
      return new Response(JSON.stringify({ error: "Auth failed" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    log("User authenticated", { userId: userData.user.id });

    // Service role client for DB operations
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    const { listing_id } = await req.json();
    if (!listing_id) {
      return new Response(JSON.stringify({ error: "Missing listing_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    log("Moderating listing", { listing_id });

    // Fetch listing
    const { data: listing, error: listingErr } = await supabase
      .from("seller_listings")
      .select("*, seller_profiles(id, business_name, contact_email, approved, user_id)")
      .eq("id", listing_id)
      .single();

    if (listingErr || !listing) {
      log("Listing not found", { listingErr });
      return new Response(JSON.stringify({ error: "Listing not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify ownership
    if (listing.seller_profiles?.user_id !== userData.user.id) {
      return new Response(JSON.stringify({ error: "Not your listing" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Call AI for moderation
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      log("LOVABLE_API_KEY not configured, defaulting to pending");
      return new Response(JSON.stringify({ status: "pending", reason: "Moderation unavailable" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const moderationPrompt = `You are a content moderator for PARTARA, a UK car parts marketplace. Evaluate this listing and decide if it should be auto-approved or flagged for manual review.

LISTING:
- Title: ${listing.title}
- Description: ${listing.description}
- Price: ${listing.price ? `£${listing.price}` : "Not set"}
- Category: ${listing.category || "Not set"}
- Compatible Vehicles: ${listing.compatible_vehicles?.join(", ") || "None"}
- Tags: ${listing.tags?.join(", ") || "None"}
- Has Photos: ${listing.photos?.length > 0 ? "Yes" : "No"}

RULES FOR APPROVAL:
1. Must be a legitimate car/vehicle part or accessory
2. No spam, offensive content, or misleading descriptions
3. Price should be reasonable (not suspiciously low like £0.01 or absurdly high for common parts)
4. Title and description should match and be coherent
5. No prohibited items (weapons, stolen goods indicators, counterfeit claims)
6. No contact information or external links in the description meant to circumvent the platform

RESPOND WITH EXACTLY ONE OF:
APPROVED - if the listing passes all checks
FLAGGED: [reason] - if the listing needs manual review, with a brief reason`;

    log("Calling AI gateway");
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: "You are a strict but fair content moderator. Respond concisely with APPROVED or FLAGGED: [reason]." },
          { role: "user", content: moderationPrompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      log("AI gateway error", { status: aiResponse.status, body: errText });
      return new Response(JSON.stringify({ status: "pending", reason: "Moderation temporarily unavailable" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const aiDecision = aiData.choices?.[0]?.message?.content?.trim() || "";
    log("AI decision", { decision: aiDecision });

    if (aiDecision.startsWith("APPROVED")) {
      // Auto-approve listing
      await supabase
        .from("seller_listings")
        .update({ approval_status: "approved" })
        .eq("id", listing_id);

      // Also auto-approve seller profile if not yet approved
      if (!listing.seller_profiles?.approved) {
        await supabase
          .from("seller_profiles")
          .update({ approved: true })
          .eq("id", listing.seller_profiles.id);
        log("Auto-approved seller profile", { seller_id: listing.seller_profiles.id });
      }

      log("Listing auto-approved", { listing_id });
      return new Response(JSON.stringify({ status: "approved" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else {
      // Flagged - keep as pending
      const reason = aiDecision.replace(/^FLAGGED:\s*/i, "").trim() || "Content flagged for manual review";

      // Send notification email to admin
      try {
        await supabase.functions.invoke("send-transactional-email", {
          body: {
            templateName: "contact-notification",
            recipientEmail: "info@gopartara.com",
            idempotencyKey: `moderation-flag-${listing_id}-${Date.now()}`,
            templateData: {
              name: listing.seller_profiles?.business_name || "Unknown Seller",
              email: listing.seller_profiles?.contact_email || "",
              message: `Moderation Flag for listing "${listing.title}":\n\nReason: ${reason}\n\nPlease review at /admin`,
            },
          },
        });
      } catch (emailErr) {
        log("Email notification failed", { emailErr });
      }

      log("Listing flagged", { listing_id, reason });
      return new Response(JSON.stringify({ status: "pending", reason }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    log("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
