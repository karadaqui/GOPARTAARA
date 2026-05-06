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

// Returns a streaming text reader of the decompressed CSV from a remote ZIP/gzip/plain CSV URL.
// Reads only enough bytes to parse the ZIP local file header, then pipes the rest through
// a streaming deflate-raw decompressor — never buffering the full payload in memory.
async function openCsvStream(url: string): Promise<ReadableStream<Uint8Array>> {
  const res = await fetch(url)
  if (!res.ok || !res.body) throw new Error(`Feed fetch failed: ${res.status}`)

  const reader = res.body.getReader()
  // Peek at first 4 bytes to detect format
  const first = await reader.read()
  if (first.done || !first.value) throw new Error('Empty feed body')
  let head = first.value

  // Helper: ensure we have at least n bytes accumulated in `head`
  const ensure = async (n: number) => {
    while (head.length < n) {
      const r = await reader.read()
      if (r.done) break
      const merged = new Uint8Array(head.length + r.value.length)
      merged.set(head, 0)
      merged.set(r.value, head.length)
      head = merged
    }
  }

  // ZIP
  if (head[0] === 0x50 && head[1] === 0x4b && head[2] === 0x03 && head[3] === 0x04) {
    await ensure(30)
    const compMethod = head[8] | (head[9] << 8)
    const fileNameLen = head[26] | (head[27] << 8)
    const extraLen = head[28] | (head[29] << 8)
    const headerSize = 30 + fileNameLen + extraLen
    await ensure(headerSize)
    const payloadStart = head.slice(headerSize)

    // Build a stream that emits payloadStart then continues reading remaining bytes from reader.
    const remaining = new ReadableStream<Uint8Array>({
      async start(controller) {
        if (payloadStart.length) controller.enqueue(payloadStart)
        try {
          while (true) {
            const r = await reader.read()
            if (r.done) break
            controller.enqueue(r.value)
          }
          controller.close()
        } catch (e) {
          controller.error(e)
        }
      },
      cancel() { reader.cancel().catch(() => {}) },
    })

    if (compMethod === 0) return remaining
    if (compMethod === 8) return remaining.pipeThrough(new DecompressionStream('deflate-raw'))
    throw new Error(`Unsupported zip compression: ${compMethod}`)
  }

  // gzip
  if (head[0] === 0x1f && head[1] === 0x8b) {
    const remaining = new ReadableStream<Uint8Array>({
      async start(controller) {
        controller.enqueue(head)
        try {
          while (true) {
            const r = await reader.read()
            if (r.done) break
            controller.enqueue(r.value)
          }
          controller.close()
        } catch (e) {
          controller.error(e)
        }
      },
      cancel() { reader.cancel().catch(() => {}) },
    })
    return remaining.pipeThrough(new DecompressionStream('gzip'))
  }

  // plain
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      controller.enqueue(head)
      try {
        while (true) {
          const r = await reader.read()
          if (r.done) break
          controller.enqueue(r.value)
        }
        controller.close()
      } catch (e) {
        controller.error(e)
      }
    },
    cancel() { reader.cancel().catch(() => {}) },
  })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  )

  try {
    const csvStream = await openCsvStream(FEED_URL)
    const reader = csvStream.getReader()
    const dec = new TextDecoder()

    let buf = ''
    let lc = 0
    let headers: string[] = []
    let iLink = -1, iName = -1, iPrice = -1, iBrand = -1, iImg = -1, iCat = -1, iStock = -1, iMid = -1
    const delim = '|'
    const batch: any[] = []
    let totalUpserted = 0
    const seen = new Set<string>()

    const flush = async () => {
      if (batch.length === 0) return
      const { error } = await supabase.from('parts_cache').upsert(batch, { onConflict: 'id' })
      if (error) console.error('Upsert error:', error.message)
      else totalUpserted += batch.length
      batch.length = 0
    }

    const handleLine = async (line: string) => {
      if (!line.trim()) return
      lc++
      if (lc === 1) {
        headers = parseLine(line, delim).map((h) => h.toLowerCase())
        iLink = headers.indexOf('aw_deep_link')
        iName = headers.indexOf('product_name')
        iPrice = headers.indexOf('search_price')
        iBrand = headers.indexOf('brand_name')
        iImg = headers.indexOf('merchant_image_url')
        iCat = headers.indexOf('merchant_category')
        iStock = headers.indexOf('in_stock')
        iMid = headers.indexOf('merchant_id')
        console.log('Headers:', headers.join(','))
        return
      }

      const cols = parseLine(line, delim)
      const name = cols[iName] || ''
      const link = cols[iLink] || ''
      const merchantId = cols[iMid] || ''
      if (!name || !link) return

      const id = `${merchantId}-${name}`.slice(0, 500)
      // dedupe within run to avoid "ON CONFLICT DO UPDATE command cannot affect row a second time"
      if (seen.has(id)) return
      seen.add(id)

      const priceRaw = (cols[iPrice] || '').trim()
      const priceNum = parseFloat(priceRaw)
      const price = priceRaw && !isNaN(priceNum) ? `£${priceNum.toFixed(2)}` : priceRaw

      const stockRaw = (cols[iStock] || '').toLowerCase()
      const inStock = stockRaw === '1' || stockRaw === 'yes' || stockRaw === 'true' || stockRaw === 'in stock'

      batch.push({
        id,
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

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buf += dec.decode(value, { stream: true })
      const lines = buf.split('\n')
      buf = lines.pop() || ''
      for (const line of lines) await handleLine(line)
    }
    if (buf.trim()) await handleLine(buf)
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
