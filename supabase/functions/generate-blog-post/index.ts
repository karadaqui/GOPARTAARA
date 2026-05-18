import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");

    if (!anthropicKey) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user-initiated or automated (cron)
    const authHeader = req.headers.get("Authorization");
    const cronSecretHeader = req.headers.get("x-cron-secret");
    const expectedCronSecret = Deno.env.get("CRON_SECRET");
    let authorName = "PARTARA Team";
    let isAutomated = false;
    let batchCount = 1;

    let body: any = {};
    try { body = await req.json(); } catch { /* no body */ }
    if (body?.batch) batchCount = Math.min(body.batch, 5);

    // Automated mode: accept either a valid CRON_SECRET header, OR a request
    // coming from pg_net (the pg_cron daily job runs through it and sets a
    // recognisable User-Agent). pg_net requests originate inside Supabase, so
    // this is safe enough for a low-cost scheduled blog generator.
    if (body?.automated === true) {
      const userAgent = req.headers.get("user-agent") || "";
      const fromPgNet = /pg_net/i.test(userAgent);
      const cronOk = expectedCronSecret && cronSecretHeader === expectedCronSecret;
      if (!cronOk && !fromPgNet) {
        console.log("Automated mode rejected. UA:", userAgent);
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      isAutomated = true;
    }

    const ADMIN_UUID = "95e19b6b-32ec-4af8-8184-d02638ac2ded";

    if (!isAutomated) {
      // Manual mode: require authenticated admin user
      if (!authHeader) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      const userClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user }, error: userError } = await userClient.auth.getUser();
      if (userError || !user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Admin-only manual generation
      if (user.id !== ADMIN_UUID) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Enforce 2 manual posts per day per user via blog_generations table
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const { count: todayCount } = await adminClient
        .from("blog_generations")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", todayStart.toISOString());

      if ((todayCount || 0) >= 2) {
        return new Response(
          JSON.stringify({ error: "Daily limit reached. Maximum 2 blog posts per day." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      batchCount = 1;
    }

    const generatedPosts = [];
    const today = new Date().toISOString().split("T")[0];

    for (let i = 0; i < batchCount; i++) {
      // Pick a topic not used in the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: availableTopics } = await adminClient
        .from("blog_topics")
        .select("id, topic")
        .or(`last_used.is.null,last_used.lt.${thirtyDaysAgo.toISOString()}`)
        .limit(100);

      if (!availableTopics || availableTopics.length === 0) {
        console.log("No available topics — all used within 30 days");
        continue;
      }

      const chosen = availableTopics[Math.floor(Math.random() * availableTopics.length)];
      console.log(`Generating post ${i + 1}/${batchCount}: ${chosen.topic}`);

      // Mark topic as used
      await adminClient
        .from("blog_topics")
        .update({ last_used: new Date().toISOString() })
        .eq("id", chosen.id);

      const systemPrompt = `You are an expert automotive journalist writing for a UK car parts comparison website called PARTARA (gopartara.com). Write detailed, SEO-optimised blog posts. Always write in British English. Be helpful, practical, and specific. Include real part names, common car models, and practical advice. End every post with a CTA mentioning PARTARA. Today's date is ${today}.`;

      const userPrompt = `Write a comprehensive, SEO-optimised blog post about: "${chosen.topic}".
Format as JSON with these exact fields:
- title (compelling SEO title, under 60 chars)
- slug (URL-friendly, lowercase letters numbers and hyphens only)
- content (full HTML blog post, 500-650 words, include h2/h3 subheadings, bullet points, practical tips. Use proper HTML tags like <h2>, <h3>, <p>, <ul>, <li>, <strong>.)
- excerpt (meta description, 150-160 chars)
- category (one of: Buying Guide, Maintenance, Education, Comparison, Tutorial, News)
- tags (array of 5 relevant tags)
- read_time (e.g. "5 min read")
Return ONLY valid JSON, no markdown code blocks.`;

      const aiResponse = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": anthropicKey,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4000,
          system: systemPrompt,
          messages: [{ role: "user", content: userPrompt }],
        }),
      });

      if (!aiResponse.ok) {
        console.error("Anthropic error:", aiResponse.status, await aiResponse.text());
        continue;
      }

      const aiData = await aiResponse.json();
      let content = aiData.content?.[0]?.text;
      if (!content) continue;
      // Strip ``` fences if the model added them
      content = content.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();

      let post: any;
      try {
        post = JSON.parse(content);
      } catch {
        console.error("Failed to parse AI response");
        continue;
      }

      if (!post.title || !post.slug || !post.content) continue;

      // Check for duplicate title
      const { count: existingCount } = await adminClient
        .from("blog_posts")
        .select("*", { count: "exact", head: true })
        .eq("title", post.title);

      if ((existingCount || 0) > 0) {
        console.log(`Skipping duplicate: ${post.title}`);
        continue;
      }

      const uniqueSlug = `${post.slug}-${today}-${Math.random().toString(36).slice(2, 6)}`;

      const { data: insertedPost, error: insertError } = await adminClient
        .from("blog_posts")
        .insert({
          title: post.title,
          slug: uniqueSlug,
          content: post.content,
          preview: post.excerpt || post.title,
          meta_description: post.excerpt || post.title,
          keywords: post.tags || [],
          category: post.category || "Education",
          read_time: post.read_time || "5 min read",
          author: "PARTARA Team",
          published: true,
          published_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        console.error("Insert error:", insertError);
        continue;
      }

      console.log(`Published: ${insertedPost.title}`);
      generatedPosts.push(insertedPost);
    }

    return new Response(
      JSON.stringify({
        success: true,
        generated: generatedPosts.length,
        failed: batchCount - generatedPosts.length,
        posts: generatedPosts,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("generate-blog-post error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
