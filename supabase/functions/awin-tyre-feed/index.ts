import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24h

const FEED_TO_SUPPLIER: Record<string, string> = {
  '4118': 'mytyres.co.uk',
  '12715': 'Tyres UK',
  '12716': 'neumaticos-online.es',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const body = await req.json().catch(() => ({}))

    // Warmup ping — return immediately to keep function hot
    if (body && body.warmup === true) {
      return new Response(
        JSON.stringify({ products: [], warmup: true }),
        { headers: { ...cors, 'Content-Type': 'application/json' } }
      )
    }

    const { width, profile, rim, advertiserId } = body

    const rimNum = String(rim || '').replace(/^R/i, '')
    const tyreSize = `${width}/${profile} R${rimNum}`

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })

    // Helper: fire-and-forget background refresh
    const triggerRefresh = () => {
      fetch(`${supabaseUrl}/functions/v1/refresh-tyre-cache`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
        },
        body: '{}',
      }).catch((err) => console.error('Background refresh failed:', err))
    }

    // Helper: query cache and shape response (optionally filter by advertiserId/feed_id)
    const queryCache = async () => {
      const cols = 'feed_id, supplier_name, product_name, price, currency, url, brand, category, image_url, cached_at'

      let rows: any[] = []
      const t0 = Date.now()

      if (advertiserId) {
        const actualId = String(advertiserId).replace('debug_', '')
        const { data, error } = await supabase
          .from('tyre_products_cache')
          .select(cols)
          .eq('tyre_size', tyreSize)
          .eq('feed_id', actualId)
        if (error) console.error('Cache query error:', error)
        rows = data || []
      } else {
        const feedIds = ['12641', '4118', '12715', '66605', '93986_pneumatici', '23179', '93988', '93986', '10499']
        console.log(`Querying ${feedIds.length} hardcoded feed_ids for ${tyreSize}`)

        const results = await Promise.all(
          feedIds.map((fid) =>
            supabase
              .from('tyre_products_cache')
              .select(cols)
              .eq('tyre_size', tyreSize)
              .eq('feed_id', fid)
              .limit(500)
          )
        )
        for (const { data, error } of results) {
          if (error) console.error('Cache query error:', error)
          if (data) rows.push(...data)
        }
      }
      console.log(`Cache query took ${Date.now() - t0}ms, rows=${rows.length}`)
      let oldest = Date.now()
      for (const r of rows) {
        const t = new Date(r.cached_at).getTime()
        if (t < oldest) oldest = t
      }
      return { rows, oldest }
    }

    // 1) Check cache
    let { rows, oldest } = await queryCache()

    // 2) If empty, check if whole cache is empty -> warming response, trigger background refresh
    if (rows.length === 0) {
      const { count } = await supabase
        .from('tyre_products_cache')
        .select('*', { count: 'exact', head: true })

      if (!count || count === 0) {
        console.log('Cache empty, triggering background refresh and returning warming flag')
        triggerRefresh()
        return new Response(
          JSON.stringify({ products: [], suppliers: [], cached: false, warming: true }),
          { headers: { ...cors, 'Content-Type': 'application/json' } }
        )
      }
    } else if (oldest && Date.now() - oldest > CACHE_TTL_MS) {
      // 3) Stale cache: serve stale, refresh in background
      console.log('Cache stale, triggering background refresh')
      triggerRefresh()
    }

    // Map to expected response shape
    const products = rows.map((r) => ({
      id: `${r.feed_id}-${r.product_name?.slice(0, 24)}`,
      name: r.product_name,
      title: r.product_name,
      price: typeof r.price === 'number' ? `${r.currency}${r.price.toFixed(2)}` : `${r.currency}${r.price}`,
      currency: r.currency,
      url: r.url,
      supplier_name: r.supplier_name,
      brand: r.brand || '',
      category: (r as any).category || '',
      shipping: 'Free delivery',
      advertiserId: r.feed_id,
      image_url: r.image_url || r.image || '',
    }))

    const suppliers = Array.from(new Set(products.map((p) => p.supplier_name)))

    return new Response(
      JSON.stringify({ products, suppliers, cached: true }),
      { headers: { ...cors, 'Content-Type': 'application/json' } }
    )
  } catch (e: any) {
    console.error('awin-tyre-feed error:', e)
    return new Response(
      JSON.stringify({ products: [], suppliers: [], error: e.message }),
      { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } }
    )
  }
})
