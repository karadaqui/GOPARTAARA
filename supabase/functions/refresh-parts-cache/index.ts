import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const FEED_URL = 'https://productdata.awin.com/datafeed/download/apikey/f0b723c9643205a96aeb31377b805e02/language/en/fid/32377/columns/aw_deep_link,product_name,search_price,brand_name,merchant_image_url,merchant_category,in_stock,merchant_name,merchant_id,currency/format/csv/delimiter/%7C/compression/zip/'

function parseLine(line: string, delim: string): string[] {
  const out: string[] = []
  let cur = ''
  let q = false
  for (const ch of line) {
    if (ch === '"') q = !q
    else if (ch === delim && !q) { out.push(cur); cur = '' }
    else cur += ch
  }
  out.push(cur)
  return out.map((s) => s.replace(/^"|"$/g, '').trim())
}

async function fetchAndDecode(url: string): Promise<string> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Feed fetch failed: ${res.status}`)
  const buf = new Uint8Array(await res.arrayBuffer())

  // ZIP file: locate first local file header, decompress raw deflate payload
  if (buf[0] === 0x50 && buf[1] === 0x4b) {
    // Find local file header signature 0x04034b50
    let i = 0
    if (!(buf[i] === 0x50 && buf[i + 1] === 0x4b && buf[i + 2] === 0x03 && buf[i + 3] === 0x04)) {
      throw new Error('Unexpected ZIP layout')
    }
    const compMethod = buf[i + 8] | (buf[i + 9] << 8)
    const compSize = buf[i + 18] | (buf[i + 19] << 8) | (buf[i + 20] << 16) | (buf[i + 21] << 24)
    const fileNameLen = buf[i + 26] | (buf[i + 27] << 8)
    const extraLen = buf[i + 28] | (buf[i + 29] << 8)
    const dataStart = i + 30 + fileNameLen + extraLen
    const dataEnd = compSize > 0 ? dataStart + compSize : buf.length
    const payload = buf.slice(dataStart, dataEnd)

    if (compMethod === 0) {
      return new TextDecoder().decode(payload)
    }
    if (compMethod === 8) {
      const ds = new DecompressionStream('deflate-raw')
      const stream = new Response(payload).body!.pipeThrough(ds)
      return await new Response(stream).text()
    }
    throw new Error(`Unsupported zip compression: ${compMethod}`)
  }

  // gzip
  if (buf[0] === 0x1f && buf[1] === 0x8b) {
    const ds = new DecompressionStream('gzip')
    const stream = new Response(buf).body!.pipeThrough(ds)
    return await new Response(stream).text()
  }

  return new TextDecoder().decode(buf)
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  )

  try {
    const csvText = await fetchAndDecode(FEED_URL)
    const lines = csvText.split('\n').filter((l) => l.trim())
    if (lines.length < 2) {
      return new Response(JSON.stringify({ success: false, error: 'Empty feed' }), {
        status: 200,
        headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }

    const delim = '|'
    const headers = parseLine(lines[0], delim).map((h) => h.toLowerCase())
    const idx = (n: string) => headers.indexOf(n)
    const iLink = idx('aw_deep_link')
    const iName = idx('product_name')
    const iPrice = idx('search_price')
    const iBrand = idx('brand_name')
    const iImg = idx('merchant_image_url')
    const iCat = idx('merchant_category')
    const iStock = idx('in_stock')
    const iMid = idx('merchant_id')

    const batch: any[] = []
    let totalUpserted = 0

    const flush = async () => {
      if (batch.length === 0) return
      const { error } = await supabase.from('parts_cache').upsert(batch, { onConflict: 'id' })
      if (error) console.error('Upsert error:', error.message)
      else totalUpserted += batch.length
      batch.length = 0
    }

    for (let i = 1; i < lines.length; i++) {
      const cols = parseLine(lines[i], delim)
      const name = cols[iName] || ''
      const link = cols[iLink] || ''
      const merchantId = cols[iMid] || ''
      if (!name || !link) continue

      const priceRaw = (cols[iPrice] || '').trim()
      const priceNum = parseFloat(priceRaw)
      const price = priceRaw && !isNaN(priceNum) ? `£${priceNum.toFixed(2)}` : priceRaw

      const stockRaw = (cols[iStock] || '').toLowerCase()
      const inStock = stockRaw === '1' || stockRaw === 'yes' || stockRaw === 'true' || stockRaw === 'in stock'

      batch.push({
        id: `${merchantId}-${name}`.slice(0, 500),
        name,
        price,
        brand: cols[iBrand] || '',
        category: cols[iCat] || '',
        image_url: cols[iImg] || '',
        url: link,
        supplier: 'Green Spark Plug Co.',
        advertiser_id: '16976',
        in_stock: inStock,
        updated_at: new Date().toISOString(),
      })

      if (batch.length >= 500) await flush()
    }
    await flush()

    return new Response(
      JSON.stringify({ success: true, count: totalUpserted }),
      { headers: { ...cors, 'Content-Type': 'application/json' } },
    )
  } catch (e: any) {
    console.error('refresh-parts-cache error:', e)
    return new Response(
      JSON.stringify({ success: false, error: e.message }),
      { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } },
    )
  }
})
