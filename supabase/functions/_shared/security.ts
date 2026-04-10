import { createClient } from "npm:@supabase/supabase-js@2.57.2";

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
  "https://gopartara.com",
  "https://www.gopartara.com",
  "https://gopartara.co.uk",
  "https://www.gopartara.co.uk",
  "https://car-part-search.lovable.app",
  "https://id-preview--fe1ab79e-2f0b-4c0c-9d68-62435d9b05c8.lovable.app",
];

const ALLOWED_HEADERS = "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version";

export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") || "";
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": ALLOWED_HEADERS,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

export function corsPreflightResponse(corsHeaders: Record<string, string>): Response {
  return new Response("ok", { headers: corsHeaders });
}

export function jsonResponse(data: any, status: number, corsHeaders: Record<string, string>): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Validate JWT and return user ID, or an error response
export async function validateJWT(
  req: Request,
  corsHeaders: Record<string, string>
): Promise<{ userId: string; email: string; error?: never } | { userId?: never; email?: never; error: Response }> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { error: jsonResponse({ error: "UNAUTHORIZED", message: "Authentication required." }, 401, corsHeaders) };
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );

  const token = authHeader.replace("Bearer ", "");
  const { data: claimsData, error: claimsError } = await supabaseAdmin.auth.getClaims(token);

  if (claimsError || !claimsData?.claims) {
    return { error: jsonResponse({ error: "UNAUTHORIZED", message: "Invalid or expired session." }, 401, corsHeaders) };
  }

  return {
    userId: claimsData.claims.sub as string,
    email: (claimsData.claims.email as string) || "",
  };
}

// Log security events
export async function logSecurityEvent(
  eventType: string,
  req: Request,
  userId?: string,
  functionName?: string,
  details?: Record<string, any>,
  severity = "warn"
) {
  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
    await supabaseAdmin.from("security_logs").insert({
      event_type: eventType,
      ip_address: ip,
      user_id: userId || null,
      function_name: functionName || null,
      details: details || null,
      severity,
    });
  } catch (e) {
    console.error("[security-log] Failed to log event:", e);
  }
}

// Request size limit check (default 1MB)
export function checkRequestSize(req: Request, maxBytes = 1_048_576): Response | null {
  const contentLength = req.headers.get("content-length");
  if (contentLength && parseInt(contentLength) > maxBytes) {
    return new Response(JSON.stringify({ error: "Request too large" }), { status: 413 });
  }
  return null;
}
