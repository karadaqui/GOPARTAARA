// Refresh cache of products for the 5 new Awin merchants into the
// existing `parts_cache` table (filtered by `advertiser_id`).
// Mirrors the streaming pattern used by `refresh-tyre-cache` to stay
// well under the edge-function memory limit.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const PUBLISHER_ID = '2845282'

const MERCHANTS: Record<string, string> = {
  '67974': 'Dunford Inc',
  '8626': 'Autobandenmarkt',
  '16673': 'Maxpeedingrods',
  '16809': 'Kohl Automobile',
  '8794': 'Tirendo',
  '104933': 'Direnza',
}

// Simple comma-CSV line parser supporting quoted fields.
function parseLine(line: string, delim = ','): string[] {
  const out: string[] = []
  let cur = ''
  let q = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (q) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++ } else q = false
      } else cur += ch
    } else {
      if (ch === '"') q = true
      else if (ch === delim) { out.push(cur); cur = '' }
      else cur += ch
    }
  }
  out.push(cur)
  return out.map((s) => s.trim())
}

async function findFeedUrl(apiKey: string, advertiserId: string): Promise<string | null> {
  const url = `https://ui.awin.com/productdata-darwin-download/publisher/${PUBLISHER_ID}/${apiKey}/1/feedList`
  const res = await fetch(url)
  if (!res.ok) { console.error('feedList fetch failed', res.status); return null }
  const text = await res.text()
  const rows = text.split('\n').map((l) => parseLine(l))
  if (rows.length < 2) return null
  const header = rows[0].map((h) => h.toLowerCase())
  const idIdx = header.findIndex((h) => h.includes('advertiser id'))
  const urlIdx = header.findIndex((h) => h === 'url')
  if (idIdx < 0 || urlIdx < 0) return null
  for (let i = 1; i < rows.length; i++) {
    if ((rows[i][idIdx] || '').trim() === advertiserId) return (rows[i][urlIdx] || '').trim()
  }
  return null
}

async function openFeedStream(url: string): Promise<ReadableStream<Uint8Array> | null> {
  const res = await fetch(url, { redirect: 'follow' })
  if (!res.ok || !res.body) { console.error('feed fetch failed', res.status); return null }
  if (url.includes('compression/gzip') || url.endsWith('.gz')) {
    try { return res.body.pipeThrough(new DecompressionStream('gzip')) } catch { return res.body }
  }
  return res.body
}

function buildAffiliateUrl(merchantId: string, awDeep: string, merchantDeep: string): string {
  if (awDeep) {
    const fixed = awDeep.replace(/awinaffid=\d+/i, `awinaffid=${PUBLISHER_ID}`)
    return fixed.includes('awinaffid=') ? fixed : `${fixed}${fixed.includes('?') ? '&' : '?'}awinaffid=${PUBLISHER_ID}`
  }
  if (merchantDeep) {
    return `https://www.awin1.com/cread.php?awinmid=${merchantId}&awinaffid=${PUBLISHER_ID}&ued=${encodeURIComponent(merchantDeep)}`
  }
  return ''
}

async function refreshOne(supabase: any, apiKey: string, merchantId: string, supplierName: string) {
  const feedUrl = await findFeedUrl(apiKey, merchantId)
  if (!feedUrl) { console.warn(`no feed for ${merchantId}`); return { merchantId, inserted: 0, error: 'no_feed' } }

  const stream = await openFeedStream(feedUrl)
  if (!stream) return { merchantId, inserted: 0, error: 'no_stream' }

  // Wipe previous rows for this merchant (chunked)
  for (let i = 0; i < 50; i++) {
    const { data: rows, error } = await supabase
      .from('parts_cache').select('id').eq('advertiser_id', merchantId).limit(1000)
    if (error) { console.error('select for clear', error.message); break }
    if (!rows || rows.length === 0) break
    const ids = rows.map((r: any) => r.id)
    await supabase.from('parts_cache').delete().in('id', ids)
    if (rows.length < 1000) break
  }

  const reader = stream.getReader()
  const dec = new TextDecoder()
  let buf = ''
  let lc = 0
  let headers: string[] = []
  let iName = -1, iLink = -1, iAwLink = -1, iPrice = -1, iCur = -1,
      iBrand = -1, iImg = -1, iCat = -1, iStock = -1, iId = -1
  const batch: any[] = []
  const seen = new Set<string>()
  let inserted = 0

  const flush = async () => {
    if (!batch.length) return
    const { error } = await supabase.from('parts_cache').upsert(batch, { onConflict: 'id' })
    if (error) console.error(`upsert ${merchantId}`, error.message)
    else inserted += batch.length
    batch.length = 0
  }

  const handle = async (line: string) => {
    if (!line.trim()) return
    lc++
    const cols = parseLine(line)
    if (lc === 1) {
      headers = cols.map((h) => h.toLowerCase())
      const ix = (n: string) => headers.indexOf(n)
      iName = ix('product_name')
      iLink = ix('merchant_deep_link')
      iAwLink = ix('aw_deep_link')
      iPrice = ix('search_price')
      iCur = ix('currency')
      iBrand = ix('brand_name')
      iImg = headers.findIndex((h) => h === 'merchant_image_url' || h === 'aw_image_url')
      iCat = headers.findIndex((h) => h === 'merchant_category' || h === 'category_name')
      iStock = ix('in_stock')
      iId = headers.findIndex((h) => h === 'aw_product_id' || h === 'merchant_product_id')
      console.log(`[${merchantId}] headers parsed; cols=${headers.length}`)
      return
    }
    const name = cols[iName] || ''
    const aw = iAwLink >= 0 ? cols[iAwLink] : ''
    const md = iLink >= 0 ? cols[iLink] : ''
    const url = buildAffiliateUrl(merchantId, aw, md)
    if (!name || !url) return

    const rawId = (iId >= 0 ? cols[iId] : '') || `${merchantId}-${name}`
    const id = `${merchantId}-${rawId}`.slice(0, 500)
    if (seen.has(id)) return
    seen.add(id)

    const priceNum = parseFloat(cols[iPrice] || '0')
    const cur = (iCur >= 0 ? cols[iCur] : '').toUpperCase()
    const sym = cur === 'GBP' ? '£' : cur === 'EUR' ? '€' : cur === 'USD' ? '$' : cur === 'NOK' ? 'kr ' : ''
    const price = !isNaN(priceNum) && priceNum > 0 ? `${sym}${priceNum.toFixed(2)}` : (cols[iPrice] || '')

    const stockRaw = (iStock >= 0 ? cols[iStock] : '').toLowerCase()
    const inStock = !stockRaw || ['1', 'yes', 'true', 'in stock'].includes(stockRaw)

    batch.push({
      id,
      name,
      price,
      brand: iBrand >= 0 ? cols[iBrand] : '',
      category: iCat >= 0 ? cols[iCat] : '',
      image_url: iImg >= 0 ? cols[iImg] : '',
      url,
      supplier: supplierName,
      advertiser_id: merchantId,
      in_stock: inStock,
      updated_at: new Date().toISOString(),
    })

    if (batch.length >= 500) await flush()
  }

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buf += dec.decode(value, { stream: true })
    const lines = buf.split('\n')
    buf = lines.pop() || ''
    for (const line of lines) await handle(line)
  }
  if (buf.trim()) await handle(buf)
  await flush()
  reader.cancel().catch(() => {})

  console.log(`[${merchantId}] ${supplierName} done: ${inserted}`)
  return { merchantId, supplierName, inserted }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  const apiKey = Deno.env.get('AWIN_API_KEY')
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'AWIN_API_KEY missing' }),
      { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  )

  const url = new URL(req.url)
  const only = url.searchParams.get('merchantId')
  const ids = only ? [only] : Object.keys(MERCHANTS)

  const work = async () => {
    for (const id of ids) {
      try { await refreshOne(supabase, apiKey, id, MERCHANTS[id] || `Merchant ${id}`) }
      catch (e: any) { console.error(`refresh ${id} threw`, e?.message) }
    }
  }

  // @ts-ignore EdgeRuntime is provided by Supabase
  try { EdgeRuntime.waitUntil(work()) } catch { work() }

  return new Response(
    JSON.stringify({ success: true, started: true, merchants: ids }),
    { headers: { ...cors, 'Content-Type': 'application/json' } },
  )
})
