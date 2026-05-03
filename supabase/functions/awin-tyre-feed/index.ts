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
      let q = supabase
        .from('tyre_products_cache')
        .select('feed_id, supplier_name, product_name, price, currency, url, brand, image_url, cached_at')
        .eq('tyre_size', tyreSize)

      if (advertiserId) {
        const actualId = String(advertiserId).replace('debug_', '')
        q = q.eq('feed_id', actualId)
      }

      q = q.order('price', { ascending: true })

      const { data, error } = await q.limit(200)
      if (error) {
        console.error('Cache query error:', error)
        return { rows: [] as any[], oldest: 0 }
      }
      const rows = data || []
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
      supplier: r.supplier_name,
      brand: r.brand || '',
      shipping: 'Free delivery',
      advertiserId: r.feed_id,
      image_url: r.image_url || r.image || '',
    }))

    const suppliers = Array.from(new Set(products.map((p) => p.supplier)))

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
