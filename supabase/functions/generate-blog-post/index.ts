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
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableApiKey) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user-initiated or automated
    const authHeader = req.headers.get("Authorization");
    let authorName = "PARTARA Team";
    let isAutomated = false;
    let batchCount = 1;

    try {
      const body = await req.json();
      if (body?.batch) batchCount = Math.min(body.batch, 5);
      if (body?.automated) isAutomated = true;
    } catch {
      // No body — single post mode
    }

    if (!isAutomated && authHeader) {
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

      const { data: profileData } = await adminClient
        .from("profiles")
        .select("display_name")
        .eq("user_id", user.id)
        .single();
      if (profileData?.display_name) authorName = profileData.display_name;

      // Enforce 2 manual posts per day
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const { count: todayCount } = await adminClient
        .from("blog_posts")
        .select("*", { count: "exact", head: true })
        .eq("author", authorName)
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

      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content: `You are an expert automotive journalist writing for a UK car parts comparison website called PARTARA (gopartara.com). Write detailed, SEO-optimised blog posts. Always write in British English. Be helpful, practical, and specific. Include real part names, common car models, and practical advice. End every post with a CTA mentioning PARTARA. Today's date is ${today}.`,
            },
            {
              role: "user",
              content: `Write a comprehensive, SEO-optimised blog post about: "${chosen.topic}".
Format as JSON with these exact fields:
- title (compelling SEO title, under 60 chars)
- slug (URL-friendly, lowercase letters numbers and hyphens only)
- content (full HTML blog post, minimum 800 words, include h2/h3 subheadings, bullet points, practical tips. Use proper HTML tags like <h2>, <h3>, <p>, <ul>, <li>, <strong>.)
- excerpt (meta description, 150-160 chars)
- category (one of: Buying Guide, Maintenance, Education, Comparison, Tutorial, News)
- tags (array of 5 relevant tags)
- read_time (e.g. "5 min read")
Return ONLY valid JSON, no markdown code blocks.`,
            },
          ],
          response_format: { type: "json_object" },
        }),
      });

      if (!aiResponse.ok) {
        console.error("AI gateway error:", aiResponse.status);
        continue;
      }

      const aiData = await aiResponse.json();
      const content = aiData.choices?.[0]?.message?.content;
      if (!content) continue;

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
