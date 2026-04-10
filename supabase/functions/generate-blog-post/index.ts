import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TOPICS = [
  "Most searched car parts this week and why demand is surging",
  "Popular car models and their most commonly replaced parts",
  "Essential car maintenance tips to save money on repairs",
  "Price comparison guide: OEM vs aftermarket car parts",
  "Seasonal car maintenance checklist and parts you should stock up on",
  "How to identify counterfeit car parts and protect your vehicle",
  "Top 10 car parts that fail most often and how to spot early signs",
  "Electric vehicle parts: what's different and what you need to know",
  "DIY car repairs: parts you can replace yourself to save hundreds",
  "Understanding car part compatibility across different makes and models",
  "Best budget car parts brands that deliver OEM quality",
  "How to save money on brake pads and discs without compromising safety",
  "Complete guide to car battery replacement and maintenance",
  "Turbo vs naturally aspirated: parts costs and reliability compared",
  "Common MOT failure parts and how to prepare your car",
  "Winter car parts: everything you need for cold weather driving",
  "The rise of remanufactured car parts: are they worth it?",
  "Car part warranties explained: what you need to know before buying",
  "How technology is changing the car parts industry in 2026",
  "The most expensive car repairs and how to prevent them",
];

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

    // Check if this is an automated (cron) call or a user-initiated call
    const authHeader = req.headers.get("Authorization");
    let authorName = "PARTARA Team";
    let isAutomated = false;

    // Try to parse request body for batch count
    let batchCount = 1;
    try {
      const body = await req.json();
      if (body?.batch) batchCount = Math.min(body.batch, 5);
      if (body?.automated) isAutomated = true;
    } catch {
      // No body or invalid JSON — single post mode
    }

    if (!isAutomated && authHeader) {
      // User-initiated: verify user and get display name
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
      if (profileData?.display_name) {
        authorName = profileData.display_name;
      }

      // Enforce 2 manual posts per day limit
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
      batchCount = 1; // Users can only generate 1 at a time
    }

    const generatedPosts = [];
    const today = new Date().toISOString().split("T")[0];

    for (let i = 0; i < batchCount; i++) {
      const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)];
      console.log(`Generating blog post ${i + 1}/${batchCount} about: ${topic}`);

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
              content: `You are an expert automotive content writer for PARTARA, a car parts search engine. Write SEO-optimized blog posts that are informative, engaging, and helpful for car owners and mechanics. Always include practical advice and mention specific car parts. Today's date is ${today}.`,
            },
            {
              role: "user",
              content: `Write a blog post about: "${topic}". Return a JSON object with these exact fields: title (SEO-optimized, 50-60 chars), slug (URL-friendly, lowercase letters numbers and hyphens only), content (full markdown blog post 800-1200 words with ## subheadings), preview (2-3 sentence excerpt under 200 chars), meta_description (SEO meta under 160 chars), keywords (array of 5-8 relevant keywords). Return ONLY valid JSON, no markdown code blocks.`,
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
        console.log(`Skipping duplicate title: ${post.title}`);
        continue;
      }

      const uniqueSlug = `${post.slug}-${today}-${Math.random().toString(36).slice(2, 6)}`;

      const { data: insertedPost, error: insertError } = await adminClient
        .from("blog_posts")
        .insert({
          title: post.title,
          slug: uniqueSlug,
          content: post.content,
          preview: post.preview || post.title,
          meta_description: post.meta_description || post.preview || post.title,
          keywords: post.keywords || [],
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
