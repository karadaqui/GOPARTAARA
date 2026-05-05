import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const HARDCODED: Record<string, { cur: string; supplier: string; url: string; useDesc?: boolean }> = {
  '12641': {
    cur: '£',
    supplier: 'mytyres.co.uk',
    url: 'https://productdata.awin.com/datafeed/download/apikey/f0b723c9643205a96aeb31377b805e02/fid/12641/format/csv/language/en/delimiter/%2C/compression/none/adultcontent/1/columns/aw_product_id%2Cproduct_name%2Csearch_price%2Cmerchant_image_url%2Caw_deep_link%2Cbrand_name%2Cdelivery_cost',
  },
  '93988': {
    cur: '£',
    supplier: 'Tyres UK',
    useDesc: true,
    url: 'https://productdata.awin.com/datafeed/download/apikey/f0b723c9643205a96aeb31377b805e02/fid/93988/format/csv/language/en/delimiter/%2C/compression/none/adultcontent/1/columns/aw_product_id%2Cproduct_name%2Csearch_price%2Cmerchant_image_url%2Caw_deep_link%2Cbrand_name%2Cdelivery_cost%2Cdescription',
  },
  '93986': {
    cur: '€',
    supplier: 'neumaticos-online.es',
    useDesc: true,
    url: 'https://productdata.awin.com/datafeed/download/apikey/f0b723c9643205a96aeb31377b805e02/fid/93986/format/csv/language/es/delimiter/%2C/compression/none/adultcontent/1/columns/aw_product_id%2Cproduct_name%2Csearch_price%2Cmerchant_image_url%2Caw_deep_link%2Cbrand_name%2Cdelivery_cost%2Cdescription',
  },
  '93986_pneumatici': {
    cur: '€',
    supplier: 'Pneumatici IT',
    useDesc: true,
    url: 'https://productdata.awin.com/datafeed/download/apikey/f0b723c9643205a96aeb31377b805e02/fid/93986/format/csv/language/it/delimiter/%2C/compression/none/adultcontent/1/columns/aw_product_id%2Cproduct_name%2Csearch_price%2Cmerchant_image_url%2Caw_deep_link%2Cbrand_name%2Cdelivery_cost%2Cdescription',
  },
  '66605': {
    cur: '€',
    supplier: 'ReifenDirekt EE',
    useDesc: true,
    url: 'https://productdata.awin.com/datafeed/download/apikey/f0b723c9643205a96aeb31377b805e02/fid/66605/format/csv/language/et/delimiter/%2C/compression/none/adultcontent/1/columns/aw_product_id%2Cproduct_name%2Csearch_price%2Cmerchant_image_url%2Caw_deep_link%2Cbrand_name%2Cdelivery_cost%2Cdescription',
  },
}

function csv(line: string) {
  const r: string[] = []
  let c = '', q = false
  for (const ch of line) {
    if (ch === '"') q = !q
    else if (ch === ',' && !q) { r.push(c.trim()); c = '' }
    else c += ch
  }
  r.push(c.trim())
  return r
}

// Extract tyre size as "WWW/PP RNN" from a string (product_name or description)
function extractSize(text: string): { width: string; profile: string; rim: string; size: string } | null {
  if (!text) return null
  // Match patterns: 205/55 R16, 205/55R16, 205/55-16, 205/55 16
  const m = text.match(/(\d{3})\s*\/\s*(\d{2})\s*[ -]?\s*R?\s*(\d{2})/i)
  if (!m) return null
  return { width: m[1], profile: m[2], rim: m[3], size: `${m[1]}/${m[2]} R${m[3]}` }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } }
  )

  try {
    let totalInserted = 0
    const perFeed: Record<string, number> = {}

    // Clear cache first - delete in chunks to avoid statement timeout
    for (let i = 0; i < 50; i++) {
      const { data: rows, error: selErr } = await supabase
        .from('tyre_products_cache')
        .select('id')
        .limit(1000)
      if (selErr) { console.error('Select for clear error:', selErr); break }
      if (!rows || rows.length === 0) break
      const ids = rows.map((r: any) => r.id)
      const { error: delErr } = await supabase.from('tyre_products_cache').delete().in('id', ids)
      if (delErr) { console.error('Clear cache chunk error:', delErr); break }
      if (rows.length < 1000) break
    }

    for (const feedId of Object.keys(HARDCODED)) {
      const feed = HARDCODED[feedId]
      console.log(`Fetching feed ${feedId} (${feed.supplier})...`)

      const res = await fetch(feed.url)
      if (!res.body) {
        console.error(`No body for feed ${feedId}`)
        continue
      }

      const reader = res.body.getReader()
      const dec = new TextDecoder()
      let buf = ''
      let lc = 0
      let hdrs: string[] = []
      let ni = -1, pi = -1, ui = -1, bi = -1, descIdx = -1, imgIdx = -1
      const batch: any[] = []
      let feedInserted = 0

      const flush = async () => {
        if (batch.length === 0) return
        const { error } = await supabase.from('tyre_products_cache').insert(batch)
        if (error) console.error(`Insert error feed ${feedId}:`, error.message)
        else feedInserted += batch.length
        batch.length = 0
      }

      reading: while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += dec.decode(value, { stream: true })
        const lines = buf.split('\n')
        buf = lines.pop() || ''

        for (const line of lines) {
          if (!line.trim()) continue
          lc++
          const cols = csv(line)
          if (lc === 1) {
            hdrs = cols.map(h => h.toLowerCase().trim())
            console.log('=== CSV HEADERS FOR FEED', feedId, '===', JSON.stringify(hdrs))
            console.log('CSV HEADERS:', hdrs.join(', '))
            const norm = (h: string) => h.replace(/[^a-z0-9]/g, '')
            ni = hdrs.findIndex(h => norm(h).includes('productname'))
            pi = hdrs.findIndex(h => norm(h).includes('searchprice') || norm(h) === 'price')
            ui = hdrs.findIndex(h => norm(h).includes('deeplink'))
            bi = hdrs.findIndex(h => norm(h).includes('brandname') || norm(h) === 'brand')
            descIdx = hdrs.findIndex(h => h.includes('desc'))
            imgIdx = hdrs.findIndex(h => /image|img|photo|picture|thumb/i.test(h))
            console.log(`Feed ${feedId} headers: ni=${ni} pi=${pi} ui=${ui} bi=${bi} descIdx=${descIdx} imgIdx=${imgIdx}`)
            continue
          }
          if (ni < 0 || pi < 0 || ui < 0) continue

          const name = (cols[ni] || '').replace(/^"|"$/g, '').trim()
          const desc = descIdx >= 0 ? (cols[descIdx] || '').replace(/^"|"$/g, '').trim() : ''
          const price = parseFloat(cols[pi] || '0')
          const url = (cols[ui] || '').replace(/^"|"$/g, '').trim()
          const brand = (cols[bi] || '').replace(/^"|"$/g, '').trim()
          const imageUrl = imgIdx >= 0 ? (cols[imgIdx] || '').replace(/^"|"$/g, '').trim() : ''

          if (!url || !url.startsWith('http') || price <= 0) continue

          // Extract tyre size from name first, then description
          const size = extractSize(name) || (feed.useDesc ? extractSize(desc) : null)
          if (!size) continue

          const displayName = feed.useDesc && desc ? desc : name

          batch.push({
            feed_id: feedId,
            supplier_name: feed.supplier,
            product_name: displayName,
            price,
            currency: feed.cur,
            url,
            brand,
            image_url: imageUrl,
            width: size.width,
            profile: size.profile,
            rim: size.rim,
            tyre_size: size.size,
            raw_data: { name, desc, price, url, brand },
          })

          if (batch.length >= 500) {
            await flush()
          }
        }
      }

      // Final flush
      await flush()
      reader.cancel().catch(() => {})

      perFeed[feedId] = feedInserted
      totalInserted += feedInserted
      console.log(`Feed ${feedId} done: ${feedInserted} inserted`)
    }

    return new Response(
      JSON.stringify({ success: true, count: totalInserted, perFeed }),
      { headers: { ...cors, 'Content-Type': 'application/json' } }
    )
  } catch (e: any) {
    console.error('refresh-tyre-cache error:', e)
    return new Response(
      JSON.stringify({ success: false, error: e.message }),
      { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } }
    )
  }
})
