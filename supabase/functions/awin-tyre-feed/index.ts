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
    const feedIdFilter: string | undefined = body.feed_id ? String(body.feed_id) : undefined
    const seasonFilter: string | undefined = body.season && body.season !== 'all' ? String(body.season) : undefined
    const brandFilter: string | undefined = body.brand && body.brand !== 'all' ? String(body.brand) : undefined
    const minPriceFilter: number | undefined = body.min_price !== undefined && body.min_price !== '' ? Number(body.min_price) : undefined
    const maxPriceFilter: number | undefined = body.max_price !== undefined && body.max_price !== '' ? Number(body.max_price) : undefined
    const page = Math.max(1, parseInt(body.page) || 1)
    const PAGE_SIZE = 500

    // Map season → product_name ilike pattern
    const seasonPattern = (() => {
      if (!seasonFilter) return undefined
      if (seasonFilter === 'winter') return '%winter%'
      if (seasonFilter === 'allseason') return '%all%season%'
      if (seasonFilter === 'summer') return '%summer%'
      return `%${seasonFilter}%`
    })()

    const rimNum = String(rim || '').replace(/^R/i, '')
    const tyreSize = `${width}/${profile} R${rimNum}`
    // Format variants — different feeds store the size with different separators.
    // We compare normalised by including all common spellings.
    const tyreSizeVariants = Array.from(new Set([
      `${width}/${profile} R${rimNum}`,
      `${width}/${profile}R${rimNum}`,
      `${width}/${profile} ${rimNum}`,
      `${width}/${profile}-${rimNum}`,
      `${width}/${profile}-R${rimNum}`,
      `${width}-${profile}-R${rimNum}`,
      `${width}-${profile}-${rimNum}`,
      `${width} ${profile} R${rimNum}`,
      `${width} ${profile} ${rimNum}`,
      `${width}${profile}R${rimNum}`,
    ]))

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

    // Fetch up to 500 rows per feed_id (cap to keep response under 3s)
    const cols = 'feed_id, supplier_name, product_name, price, currency, url, brand, category, image_url, cached_at'
    const PER_FEED_LIMIT = 500

    const queryCache = async () => {
      let rows: any[] = []
      const t0 = Date.now()

      // Real total count across all feeds for this tyre size (any variant)
      const { count: totalCount } = await supabase
        .from('tyre_products_cache')
        .select('*', { count: 'exact', head: true })
        .in('tyre_size', tyreSizeVariants)

      if (advertiserId) {
        const actualId = String(advertiserId).replace('debug_', '')
        const { data, error } = await supabase
          .from('tyre_products_cache')
          .select(cols)
          .in('tyre_size', tyreSizeVariants)
          .eq('feed_id', actualId)
          .range(0, PER_FEED_LIMIT - 1)
        if (error) console.error('Cache query error:', error)
        rows = data || []
      } else {
        const feedIds = ['12641', '12716', '4118', '12715', '66605', '23179', '93988', '93986', '10499', '22551', '38765', '22991', '32457', '26513']
        console.log(`Querying ${feedIds.length} hardcoded feed_ids for ${tyreSize} (variants=${tyreSizeVariants.length})`)
        const results = await Promise.all(
          feedIds.map((fid) =>
            supabase
              .from('tyre_products_cache')
              .select(cols)
              .in('tyre_size', tyreSizeVariants)
              .eq('feed_id', fid)
              .range(0, PER_FEED_LIMIT - 1)
          )
        )
        for (const { data, error } of results) {
          if (error) console.error('Cache query error:', error)
          if (data) rows.push(...data)
        }
      }
      console.log(`Cache query took ${Date.now() - t0}ms, rows=${rows.length}, total=${totalCount}`)
      let oldest = Date.now()
      for (const r of rows) {
        const t = new Date(r.cached_at).getTime()
        if (t < oldest) oldest = t
      }
      return { rows, oldest, totalCount: totalCount ?? rows.length }
    }

    // 1) Check cache
    let { rows, oldest, totalCount } = await queryCache()

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
    const mapped = rows.map((r) => ({
      id: `${r.feed_id}-${r.product_name?.slice(0, 24)}`,
      name: r.product_name,
      title: r.product_name,
      price: typeof r.price === 'number' ? `${r.currency}${r.price.toFixed(2)}` : `${r.currency}${r.price}`,
      currency: r.currency,
      url: r.url,
      supplier_name: r.supplier_name,
      supplier: r.supplier_name,
      merchant: r.supplier_name,
      brand: r.brand || '',
      category: (r as any).category || '',
      shipping: 'Free delivery',
      advertiserId: r.feed_id,
      image_url: r.image_url || r.image || '',
    }))

    // Deduplicate by URL
    const seen = new Set<string>()
    const deduped = mapped.filter((p) => {
      if (!p.url) return true
      if (seen.has(p.url)) return false
      seen.add(p.url)
      return true
    })

    // Supplier rotation: group by supplier, sort each by price asc,
    // then interleave PER_SUPPLIER_CHUNK at a time so users see a
    // genuine multi-supplier comparison instead of one supplier dominating.
    const PER_SUPPLIER_CHUNK = 4
    const parsePrice = (s: string) => {
      const n = parseFloat(String(s).replace(/[^0-9.,-]/g, '').replace(',', '.'))
      return Number.isFinite(n) ? n : Number.POSITIVE_INFINITY
    }
    const groups = new Map<string, typeof deduped>()
    for (const p of deduped) {
      const k = p.supplier_name || 'unknown'
      if (!groups.has(k)) groups.set(k, [])
      groups.get(k)!.push(p)
    }
    for (const arr of groups.values()) {
      arr.sort((a, b) => parsePrice(a.price) - parsePrice(b.price))
    }
    const supplierOrder = Array.from(groups.keys())
    const products: typeof deduped = []
    let remaining = true
    let offset = 0
    while (remaining) {
      remaining = false
      for (const s of supplierOrder) {
        const arr = groups.get(s)!
        const slice = arr.slice(offset, offset + PER_SUPPLIER_CHUNK)
        if (slice.length > 0) {
          products.push(...slice)
          remaining = true
        }
      }
      offset += PER_SUPPLIER_CHUNK
    }

    const suppliers = supplierOrder

    const total = totalCount
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

    return new Response(
      JSON.stringify({
        products,
        suppliers,
        total,
        page: 1,
        totalPages,
        pageSize: PAGE_SIZE,
        cached: true,
      }),
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
