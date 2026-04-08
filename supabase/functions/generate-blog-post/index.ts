import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.49.4/cors";

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
];

async function generateSinglePost(
  supabaseUrl: string,
  supabaseServiceKey: string,
  lovableApiKey: string,
  topic: string,
) {
  const today = new Date().toISOString().split("T")[0];

  const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        {
          role: "system",
          content: `You are an expert automotive content writer for PARTARA, a car parts search engine. Write SEO-optimized blog posts that are informative, engaging, and helpful for car owners and mechanics. Always include practical advice and mention specific car parts. Today's date is ${today}.`,
        },
        {
          role: "user",
          content: `Write a blog post about: "${topic}"

Return a JSON object with these exact fields:
- title: SEO-optimized title (50-60 chars)
- slug: URL-friendly slug using only lowercase letters, numbers, and hyphens
- content: Full blog post in markdown format (800-1200 words). Use ## for subheadings. Include practical tips, specific car part names, and helpful information.
- preview: 2-3 sentence preview/excerpt (under 200 chars)
- meta_description: SEO meta description (under 160 chars)
- keywords: Array of 5-8 relevant keywords about car parts and maintenance

Return ONLY valid JSON, no markdown code blocks.`,
        },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "create_blog_post",
            description: "Create a structured blog post",
            parameters: {
              type: "object",
              properties: {
                title: { type: "string" },
                slug: { type: "string" },
                content: { type: "string" },
                preview: { type: "string" },
                meta_description: { type: "string" },
                keywords: { type: "array", items: { type: "string" } },
              },
              required: ["title", "slug", "content", "preview", "meta_description", "keywords"],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "create_blog_post" } },
    }),
  });

  if (!aiResponse.ok) {
    const errText = await aiResponse.text();
    console.error("AI gateway error:", aiResponse.status, errText);
    throw new Error(`AI error ${aiResponse.status}`);
  }

  const aiData = await aiResponse.json();
  const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

  if (!toolCall?.function?.arguments) {
    throw new Error("AI did not return structured data");
  }

  const post = JSON.parse(toolCall.function.arguments);
  const uniqueSlug = `${post.slug}-${today}-${Math.random().toString(36).slice(2, 6)}`;

  const adminClient = createClient(supabaseUrl, supabaseServiceKey);
  const { data: insertedPost, error: insertError } = await adminClient
    .from("blog_posts")
    .insert({
      title: post.title,
      slug: uniqueSlug,
      content: post.content,
      preview: post.preview,
      meta_description: post.meta_description,
      keywords: post.keywords,
      author: "PARTARA Team",
      published: true,
      published_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (insertError) {
    console.error("Insert error:", insertError);
    throw new Error(insertError.message);
  }

  return insertedPost;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableApiKey) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse request body for optional params
    let count = 1;
    let isCron = false;

    try {
      const body = await req.json();
      if (body.count && typeof body.count === "number" && body.count > 0 && body.count <= 10) {
        count = body.count;
      }
      if (body.cron === true) {
        isCron = true;
      }
    } catch {
      // No body or invalid JSON — defaults are fine
    }

    // If not a cron call, verify authenticated user
    if (!isCron) {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

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
    }

    // Pick unique topics for the batch
    const shuffled = [...TOPICS].sort(() => Math.random() - 0.5);
    const selectedTopics = shuffled.slice(0, count);

    const results = [];
    const errors = [];

    for (const topic of selectedTopics) {
      try {
        const post = await generateSinglePost(supabaseUrl, supabaseServiceKey, lovableApiKey, topic);
        results.push(post);
        console.log(`Generated: ${post.title}`);
      } catch (err) {
        console.error(`Failed topic "${topic}":`, err.message);
        errors.push({ topic, error: err.message });
      }
      // Small delay between posts to avoid rate limits
      if (selectedTopics.length > 1) {
        await new Promise((r) => setTimeout(r, 2000));
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        generated: results.length,
        failed: errors.length,
        posts: results,
        errors: errors.length > 0 ? errors : undefined,
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
