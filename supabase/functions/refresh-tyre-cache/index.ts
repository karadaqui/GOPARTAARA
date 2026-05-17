import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const FEED_LIST_URL = 'https://ui.awin.com/productdata-darwin-download/publisher/2845282/f0b723c9643205a96aeb31377b805e02/1/feedList'

const TYRE_KEYWORDS = ['tyre', 'reifen', 'pneuma', 'neumatico', 'mytyres', 'gomme', 'pneu', 'wheel', 'tirendo', 'autobandenmarkt', 'banden']

// Currency by region/language
function detectCurrency(region: string, language: string): string {
  const r = (region || '').toLowerCase()
  const l = (language || '').toLowerCase()
  if (r === 'gb' || r === 'uk' || l === 'en') return '£'
  if (r === 'us') return '$'
  return '€'
}

interface FeedMeta {
  feedId: string
  cur: string
  supplier: string
  url: string
  useDesc: boolean
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
  const m = text.match(/(\d{3})\s*\/\s*(\d{2})\s*[ -]?\s*R?\s*(\d{2})/i)
  if (!m) return null
  return { width: m[1], profile: m[2], rim: m[3], size: `${m[1]}/${m[2]} R${m[3]}` }
}

async function fetchFeedList(): Promise<Record<string, FeedMeta>> {
  const res = await fetch(FEED_LIST_URL)
  if (!res.ok) throw new Error(`feedList fetch failed: ${res.status}`)
  const text = await res.text()
  const lines = text.split('\n').filter(l => l.trim())
  if (lines.length < 2) return {}

  const headers = csv(lines[0]).map(h => h.toLowerCase().trim())
  const idx = (name: string) => headers.findIndex(h => h.replace(/[^a-z0-9]/g, '').includes(name))
  const feedIdIdx = idx('feedid')
  const advIdIdx = idx('advertiserid')
  const advNameIdx = idx('advertisername')
  const feedNameIdx = idx('feedname')
  const regionIdx = idx('primaryregion')
  const langIdx = idx('language')
  const urlIdx = headers.findIndex(h => h.includes('url') || h.includes('download'))

  // Feed-ID-specific supplier name overrides (when advertiser name differs from brand)
  const SUPPLIER_OVERRIDES: Record<string, string> = {
    '103419': 'WheelHero',
    '104208': 'WheelHero',
    '104209': 'WheelHero',
  }

  console.log('feedList headers:', headers.join(', '))
  console.log(`indices: feedId=${feedIdIdx} advName=${advNameIdx} url=${urlIdx}`)

  const out: Record<string, FeedMeta> = {}
  for (let i = 1; i < lines.length; i++) {
    const cols = csv(lines[i])
    const feedId = (cols[feedIdIdx] || '').trim()
    const advName = (cols[advNameIdx] || '').trim()
    const region = (cols[regionIdx] || '').trim()
    const language = (cols[langIdx] || '').trim()
    let url = (cols[urlIdx] || '').trim()
    if (!feedId || !advName || !url) continue

    const feedName = feedNameIdx >= 0 ? (cols[feedNameIdx] || '').trim() : ''
    const lower = advName.toLowerCase()
    const feedLower = feedName.toLowerCase()
    const matches = TYRE_KEYWORDS.some(k => lower.includes(k) || feedLower.includes(k))
      || feedLower.includes('tire')
      || SUPPLIER_OVERRIDES[feedId]
    if (!matches) continue

    // Ensure CSV format with required columns; downloadUrl is usually a gzip CSV.
    // Inject brand_name and merchant_category into the /columns/ segment if present.
    url = url.replace(/\/columns\/([^/]+)\//, (_m, cols) => {
      const list = cols.split(',').map((c: string) => c.trim()).filter(Boolean)
      if (!list.includes('brand_name')) list.push('brand_name')
      if (!list.includes('merchant_category')) list.push('merchant_category')
      return `/columns/${list.join(',')}/`
    })
    // Feeds where `name` contains the model and `desc` contains size or marketing blurb.
    // For these, use `name` as product_name (useDesc=false).
    const NAME_AS_PRODUCT_FEEDS = new Set(['12715', '93988', '93986', '93986_pneumatici', '23179', '10499', '66605', '12641', '4118', '103419', '104208', '104209'])
    out[feedId] = {
      feedId,
      cur: detectCurrency(region, language),
      supplier: SUPPLIER_OVERRIDES[feedId] || advName,
      url,
      useDesc: !NAME_AS_PRODUCT_FEEDS.has(feedId),
    }
  }
  console.log(`Matched ${Object.keys(out).length} tyre feeds:`, Object.values(out).map(f => `${f.feedId}=${f.supplier}`).join(', '))
  return out
}

async function fetchFeedBody(url: string): Promise<ReadableStream<Uint8Array> | null> {
  const res = await fetch(url)
  if (!res.body) return null
  // If gzip, decompress
  const ce = res.headers.get('content-encoding') || ''
  const isGz = url.includes('compression/gzip') || url.endsWith('.gz') || ce.includes('gzip')
  if (isGz) {
    try {
      return res.body.pipeThrough(new DecompressionStream('gzip'))
    } catch {
      return res.body
    }
  }
  return res.body
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } }
  )

  const url = new URL(req.url)
  const feedIdParam = url.searchParams.get('feedId')

  const work = async () => {
    try {
      const allFeeds = await fetchFeedList()

      let feedIds: string[]
      if (feedIdParam) {
        if (!allFeeds[feedIdParam]) {
          console.error(`Unknown feedId: ${feedIdParam}; available: ${Object.keys(allFeeds).join(',')}`)
          return
        }
        feedIds = [feedIdParam]
      } else {
        // Fan-out: self-invoke once per feed so each runs in its own
        // edge-function invocation (avoids CPU Time exceeded on bulk run).
        const allIds = Object.keys(allFeeds)
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        console.log(`Fan-out refresh for ${allIds.length} feeds: ${allIds.join(',')}`)
        for (const fid of allIds) {
          // Stagger by 2s so we don't hammer the runtime simultaneously
          await new Promise((r) => setTimeout(r, 2000))
          fetch(`${supabaseUrl}/functions/v1/refresh-tyre-cache?feedId=${fid}`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${serviceKey}`,
              'Content-Type': 'application/json',
            },
            body: '{}',
          }).catch((e) => console.error(`Fan-out invoke failed for ${fid}:`, e))
        }
        return
      }

      // Clear cache: scoped to selected feed if param given, otherwise full clear
      for (let i = 0; i < 500; i++) {
        let q = supabase.from('tyre_products_cache').select('id').limit(1000)
        if (feedIdParam) q = q.eq('feed_id', feedIdParam)
        const { data: rows, error: selErr } = await q
        if (selErr) { console.error('Select for clear error:', selErr); break }
        if (!rows || rows.length === 0) break
        const ids = rows.map((r: any) => r.id)
        const { error: delErr } = await supabase.from('tyre_products_cache').delete().in('id', ids)
        if (delErr) { console.error('Clear cache chunk error:', delErr); break }
        if (rows.length < 1000) break
      }

      for (const feedId of feedIds) {
        const feed = allFeeds[feedId]
        console.log(`Fetching feed ${feedId} (${feed.supplier})...`)

        const body = await fetchFeedBody(feed.url)
        if (!body) { console.error(`No body for feed ${feedId}`); continue }

        const reader = body.getReader()
        const dec = new TextDecoder()
        let buf = ''
        let lc = 0
          let hdrs: string[] = []
          let ni = -1, pi = -1, ui = -1, bi = -1, descIdx = -1, imgIdx = -1, imgFallbackIdx = -1, catIdx = -1
        const batch: any[] = []
        let feedInserted = 0

        const flush = async () => {
          if (batch.length === 0) return
          const { error } = await supabase.from('tyre_products_cache').insert(batch)
          if (error) console.error(`Insert error feed ${feedId}:`, error.message)
          else feedInserted += batch.length
          batch.length = 0
        }

        while (true) {
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
              const norm = (h: string) => h.replace(/[^a-z0-9]/g, '')
              ni = hdrs.findIndex(h => norm(h).includes('productname'))
              pi = hdrs.findIndex(h => norm(h).includes('searchprice') || norm(h) === 'price')
              ui = hdrs.findIndex(h => norm(h).includes('deeplink'))
              bi = hdrs.findIndex(h => norm(h).includes('brandname') || norm(h) === 'brand')
              descIdx = hdrs.findIndex(h => h.includes('desc'))
              // Image preference is feed-specific. For WheelHero (feeds 103419/104208/104209),
              // merchant_image_url gets CSV-truncated and aw_image_url returns valid
              // productserve.com URLs — so prefer aw_image_url for those. For other feeds
              // (mytyres etc.), aw_image_url often returns noimage.gif so merchant_image_url wins.
              const WHEELHERO_FEEDS = new Set(['103419', '104208', '104209'])
              const awImgI = hdrs.findIndex(h => norm(h) === 'awimageurl')
              const merchImgI = hdrs.findIndex(h => norm(h) === 'merchantimageurl')
              const genericImgI = hdrs.findIndex(h => /image|img|photo|picture|thumb/i.test(h))
              if (WHEELHERO_FEEDS.has(feedId)) {
                imgIdx = awImgI >= 0 ? awImgI : (merchImgI >= 0 ? merchImgI : genericImgI)
                imgFallbackIdx = merchImgI >= 0 && merchImgI !== imgIdx ? merchImgI : -1
              } else {
                imgIdx = merchImgI >= 0 ? merchImgI : (awImgI >= 0 ? awImgI : genericImgI)
                imgFallbackIdx = awImgI >= 0 && awImgI !== imgIdx ? awImgI : -1
              }
              catIdx = hdrs.findIndex(h => norm(h).includes('merchantcategory') || norm(h) === 'category')
              console.log(`Feed ${feedId} headers: ni=${ni} pi=${pi} ui=${ui} bi=${bi} descIdx=${descIdx} imgIdx=${imgIdx} imgFallback=${imgFallbackIdx} catIdx=${catIdx}`)
              continue
            }
            if (ni < 0 || pi < 0 || ui < 0) continue

            const name = (cols[ni] || '').replace(/^"|"$/g, '').trim()
            const desc = descIdx >= 0 ? (cols[descIdx] || '').replace(/^"|"$/g, '').trim() : ''
            const price = parseFloat(cols[pi] || '0')
            const linkUrl = (cols[ui] || '').replace(/^"|"$/g, '').trim()
            const brand = (cols[bi] || '').replace(/^"|"$/g, '').trim()
            let imageUrl = imgIdx >= 0 ? (cols[imgIdx] || '').replace(/^"|"$/g, '').trim() : ''
            if (!imageUrl && imgFallbackIdx >= 0) {
              imageUrl = (cols[imgFallbackIdx] || '').replace(/^"|"$/g, '').trim()
            }
            const category = catIdx >= 0 ? (cols[catIdx] || '').replace(/^"|"$/g, '').trim() : ''

            if (!linkUrl || !linkUrl.startsWith('http') || price <= 0) continue

            const size = extractSize(name) || extractSize(desc)
            if (!size) continue

            const displayName = feed.useDesc && desc ? desc : name

            batch.push({
              feed_id: feedId,
              supplier_name: feed.supplier,
              product_name: displayName,
              price,
              currency: feed.cur,
              url: linkUrl,
              brand,
              category,
              image_url: imageUrl,
              width: size.width,
              profile: size.profile,
              rim: size.rim,
              tyre_size: size.size,
              raw_data: { name, desc, price, url: linkUrl, brand },
            })

            if (batch.length >= 500) await flush()
          }
        }

        await flush()
        reader.cancel().catch(() => {})

        console.log(`Feed ${feedId} done: ${feedInserted} inserted`)
      }
    } catch (e: any) {
      console.error('refresh-tyre-cache background error:', e)
    }
  }

  // @ts-ignore EdgeRuntime is provided by Supabase Edge Runtime
  try { EdgeRuntime.waitUntil(work()) } catch { work() }

  return new Response(
    JSON.stringify({ success: true, started: true, feedId: feedIdParam || 'all' }),
    { headers: { ...cors, 'Content-Type': 'application/json' } }
  )
})
