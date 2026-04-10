import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();
    if (!email || typeof email !== "string") {
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    const { data, error } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1,
    });

    // listUsers doesn't filter by email, so use getUserByEmail approach
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(
      "" // placeholder
    ).catch(() => ({ data: null, error: null }));

    // Better approach: use listUsers and filter, or use raw SQL via service role
    // Actually, the cleanest way is to use admin.listUsers with a workaround
    // Let's use the admin API directly
    const response = await fetch(
      `${Deno.env.get("SUPABASE_URL")}/auth/v1/admin/users?page=1&per_page=1`,
      {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          "apikey": Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
        },
      }
    );

    // This won't filter by email. Let me use the proper approach.
    // The GoTrue admin API doesn't have a direct "get by email" endpoint easily.
    // But we can use the Supabase client's admin.listUsers or rpc.

    // Simplest: query auth.users via service role SQL
    const { data: users, error: queryError } = await supabase
      .rpc("check_email_confirmed", { p_email: email });

    // Actually, let's just use the REST API properly
    // supabase.auth.admin has no getByEmail, but we can list and filter

    return new Response(JSON.stringify({ verified: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
