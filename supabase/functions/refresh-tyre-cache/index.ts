import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const FEED_LIST_URL = 'https://ui.awin.com/productdata-darwin-download/publisher/2845282/f0b723c9643205a96aeb31377b805e02/1/feedList'

const TYRE_KEYWORDS = ['tyre', 'reifen', 'pneuma', 'neumatico', 'mytyres', 'gomme', 'pneu', 'wheel']

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
  const regionIdx = idx('primaryregion')
  const langIdx = idx('language')
  const urlIdx = headers.findIndex(h => h.includes('url') || h.includes('download'))

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

    const lower = advName.toLowerCase()
    if (!TYRE_KEYWORDS.some(k => lower.includes(k))) continue

    // Ensure CSV format with required columns; downloadUrl is usually a gzip CSV.
    // We use it as-is.
    out[feedId] = {
      feedId,
      cur: detectCurrency(region, language),
      supplier: advName,
      url,
      useDesc: true,
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

  try {
    const url = new URL(req.url)
    const feedIdParam = url.searchParams.get('feedId')

    const allFeeds = await fetchFeedList()

    let feedIds: string[]
    if (feedIdParam) {
      if (!allFeeds[feedIdParam]) {
        return new Response(
          JSON.stringify({ success: false, error: `Unknown or non-tyre feedId: ${feedIdParam}`, available: Object.keys(allFeeds) }),
          { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } }
        )
      }
      feedIds = [feedIdParam]
    } else {
      feedIds = Object.keys(allFeeds)
    }

    let totalInserted = 0
    const perFeed: Record<string, number> = {}

    // Clear cache: scoped to selected feed if param given, otherwise full clear
    for (let i = 0; i < 50; i++) {
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
      if (!body) {
        console.error(`No body for feed ${feedId}`)
        continue
      }

      const reader = body.getReader()
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
            imgIdx = hdrs.findIndex(h => /image|img|photo|picture|thumb/i.test(h))
            console.log(`Feed ${feedId} headers: ni=${ni} pi=${pi} ui=${ui} bi=${bi} descIdx=${descIdx} imgIdx=${imgIdx}`)
            continue
          }
          if (ni < 0 || pi < 0 || ui < 0) continue

          const name = (cols[ni] || '').replace(/^"|"$/g, '').trim()
          const desc = descIdx >= 0 ? (cols[descIdx] || '').replace(/^"|"$/g, '').trim() : ''
          const price = parseFloat(cols[pi] || '0')
          const linkUrl = (cols[ui] || '').replace(/^"|"$/g, '').trim()
          const brand = (cols[bi] || '').replace(/^"|"$/g, '').trim()
          const imageUrl = imgIdx >= 0 ? (cols[imgIdx] || '').replace(/^"|"$/g, '').trim() : ''

          if (!linkUrl || !linkUrl.startsWith('http') || price <= 0) continue

          const size = extractSize(name) || (feed.useDesc ? extractSize(desc) : null)
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
            image_url: imageUrl,
            width: size.width,
            profile: size.profile,
            rim: size.rim,
            tyre_size: size.size,
            raw_data: { name, desc, price, url: linkUrl, brand },
          })

          if (batch.length >= 500) {
            await flush()
          }
        }
      }

      await flush()
      reader.cancel().catch(() => {})

      perFeed[feedId] = feedInserted
      totalInserted += feedInserted
      console.log(`Feed ${feedId} done: ${feedInserted} inserted`)
    }

    return new Response(
      JSON.stringify({ success: true, count: totalInserted, perFeed, discovered: Object.keys(allFeeds).length }),
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
