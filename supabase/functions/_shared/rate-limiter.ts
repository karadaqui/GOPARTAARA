import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const MAX_REQUESTS_PER_MINUTE = 100;

export async function checkRateLimit(
  userId: string,
  functionName: string
): Promise<{ allowed: boolean; remaining: number }> {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );

  const windowStart = new Date();
  windowStart.setSeconds(0, 0); // Round to current minute

  // Try to upsert the counter
  const { data, error } = await supabase
    .from("rate_limits")
    .upsert(
      {
        user_id: userId,
        function_name: functionName,
        window_start: windowStart.toISOString(),
        request_count: 1,
      },
      { onConflict: "user_id,function_name,window_start" }
    )
    .select("request_count")
    .single();

  if (error) {
    // If upsert failed, try incrementing
    const { data: existing } = await supabase
      .from("rate_limits")
      .select("request_count")
      .eq("user_id", userId)
      .eq("function_name", functionName)
      .eq("window_start", windowStart.toISOString())
      .single();

    if (existing) {
      const newCount = existing.request_count + 1;
      await supabase
        .from("rate_limits")
        .update({ request_count: newCount })
        .eq("user_id", userId)
        .eq("function_name", functionName)
        .eq("window_start", windowStart.toISOString());

      return {
        allowed: newCount <= MAX_REQUESTS_PER_MINUTE,
        remaining: Math.max(0, MAX_REQUESTS_PER_MINUTE - newCount),
      };
    }

    // No record exists, allow
    return { allowed: true, remaining: MAX_REQUESTS_PER_MINUTE - 1 };
  }

  const count = data?.request_count ?? 1;
  return {
    allowed: count <= MAX_REQUESTS_PER_MINUTE,
    remaining: Math.max(0, MAX_REQUESTS_PER_MINUTE - count),
  };
}

export function rateLimitResponse(corsHeaders: Record<string, string>) {
  return new Response(
    JSON.stringify({ error: "Too many requests. Please try again in a minute." }),
    {
      status: 429,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Retry-After": "60",
      },
    }
  );
}
