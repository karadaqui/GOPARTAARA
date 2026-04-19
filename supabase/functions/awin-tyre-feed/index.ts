import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
const cors = {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type'}

const FEEDLIST_URL = 'https://ui.awin.com/productdata-darwin-download/publisher/2845282/f0b723c9643205a96aeb31377b805e02/1/feedList'

const HARDCODED: Record<string,{cur:string,url:string,skipFilter?:boolean}> = {
  '4118':  { cur:'£', url:'https://productdata.awin.com/datafeed/download/apikey/f0b723c9643205a96aeb31377b805e02/fid/12641/format/csv/language/en/delimiter/%2C/compression/none/adultcontent/1/columns/aw_product_id%2Cproduct_name%2Csearch_price%2Cmerchant_image_url%2Caw_deep_link%2Cbrand_name%2Cdelivery_cost' },
  '12715': { cur:'£', url:'https://productdata.awin.com/datafeed/download/apikey/f0b723c9643205a96aeb31377b805e02/fid/93988/format/csv/language/en/delimiter/%2C/compression/none/adultcontent/1/columns/aw_product_id%2Cproduct_name%2Csearch_price%2Cmerchant_image_url%2Caw_deep_link%2Cbrand_name%2Cdelivery_cost%2Cdescription' },
  '12716': { cur: '€', skipFilter: true, url: 'https://productdata.awin.com/datafeed/download/apikey/f0b723c9643205a96aeb31377b805e02/fid/93986/format/csv/language/it/delimiter/%2C/compression/none/adultcontent/1/columns/aw_product_id%2Cproduct_name%2Csearch_price%2Cmerchant_image_url%2Caw_deep_link%2Cbrand_name%2Cdelivery_cost' },

}
const CURRENCIES: Record<string,string> = {
  '10499': '€', '10747': '€', '12716': '€'
}

function csv(line:string){const r:string[]=[];let c='',q=false;for(const ch of line){if(ch==='"')q=!q;else if(ch===','&&!q){r.push(c.trim());c=''}else c+=ch}r.push(c.trim());return r}

serve(async(req)=>{
if(req.method==='OPTIONS')return new Response('ok',{headers:cors})
try{
const{width,profile,rim,advertiserId}=await req.json()

const isDebug = String(advertiserId).startsWith('debug_')
const actualId = isDebug ? String(advertiserId).replace('debug_', '') : String(advertiserId)
const useDescFilter = ['12715'].includes(String(advertiserId))
const skipFilter = HARDCODED[actualId]?.skipFilter === true || ['12715'].includes(String(advertiserId))
const applyRimFilter = ['4118','10499','10747'].includes(String(advertiserId))
const w = String(width||'')
const p = String(profile||'')
const rimNum = String(rim||'').replace(/^R/i,'')
const sizeStr = `${w}/${p} R${rimNum}`

let feedUrl = HARDCODED[actualId]?.url || ''
const currency = HARDCODED[actualId]?.cur || CURRENCIES[actualId] || '£'
console.log('FEED URL for', advertiserId, ':', feedUrl?.substring(0, 120))

// For non-hardcoded advertisers, fetch URL dynamically from feedList
if (!feedUrl) {
  console.log('Fetching feedList for advertiser:', actualId)
  const listRes = await fetch(FEEDLIST_URL)
  const listText = await listRes.text()
  const lines = listText.split('\n').filter(l => l.trim())
  
  if (lines.length > 0) {
    const headers = csv(lines[0])
    const advIdx = headers.findIndex(h => h.toLowerCase().includes('advertiser id'))
    const urlIdx = headers.findIndex(h => h.toLowerCase() === 'url')
    console.log('feedList headers:', headers, 'advIdx:', advIdx, 'urlIdx:', urlIdx)
    
    for (const line of lines.slice(1)) {
      const cols = csv(line)
      const id = cols[advIdx]?.replace(/"/g,'').trim()
      if (id === actualId) {
        feedUrl = cols[urlIdx]?.replace(/"/g,'').trim() || ''
        feedUrl = feedUrl.replace('compression/gzip','compression/none')
        console.log('Found feed URL for', actualId, ':', feedUrl)
        break
      }
    }
  }
}

if (!feedUrl) {
  return new Response(
    JSON.stringify({ products: [], error: 'No feed URL found for ' + actualId }),
    { headers: { ...cors, 'Content-Type': 'application/json' } }
  )
}

const res=await fetch(feedUrl)
if(!res.body)throw new Error('nobody')

if (String(advertiserId) === '12716') {
  const r12 = await fetch(feedUrl)
  const reader12 = r12.body!.getReader()
  const dec12 = new TextDecoder()
  let buf12 = '', lc12 = 0
  const prods12: any[] = []
  let headers12: string[] = []

  outer12: while (lc12 < 500000) {
    const { done, value } = await reader12.read()
    if (done) break
    buf12 += dec12.decode(value, { stream: true })
    const lines12 = buf12.split('\n'); buf12 = lines12.pop() || ''
    for (const line of lines12) {
      if (!line.trim()) continue; lc12++
      const cols = csv(line)
      if (lc12 === 1) {
        headers12 = cols.map(h => h.toLowerCase().replace(/[^a-z0-9]/g,''))
        continue
      }
      const ni12 = headers12.findIndex(h => h.includes('productname'))
      const pi12 = headers12.findIndex(h => h.includes('searchprice') || h.includes('price'))
      const ii12 = headers12.findIndex(h => h.includes('imageurl') || h.includes('image'))
      const ui12 = headers12.findIndex(h => h.includes('deeplink') || h.includes('awdeep'))
      const bi12 = headers12.findIndex(h => h.includes('brand'))
      const idi12 = headers12.findIndex(h => h.includes('productid') || h.includes('awproduct'))
      const descIdx12 = headers12.findIndex(h => h.includes('desc'))

      const price = parseFloat(cols[pi12] || '0')
      if (price <= 0) continue

      const img = cols[ii12] || ''
      const url = cols[ui12] || ''
      if (!url || !url.startsWith('http')) continue

      if (descIdx12 >= 0) {
        const desc = (cols[descIdx12] || '').toLowerCase().replace(/"/g, '')
        const rimNum12 = String(rim).replace(/^R/i, '')
        if (!desc.includes(String(width) + '/' + String(profile))) continue
        if (!desc.includes('r' + rimNum12)) continue
        const descText = cols[descIdx12].replace(/"/g, '').trim()
        prods12.push({
          id: cols[idi12] || String(lc12),
          title: descText,
          price: `€${price.toFixed(2)}`,
          image: img,
          url: url,
          brand: cols[bi12] || '',
          shipping: 'Free delivery',
          advertiserId: '12716',
          currency: '€',
        })
        if (prods12.length >= 24) break outer12
        continue
      }
      // If no description column, skip product entirely (can't verify size)
      continue
    }
  }
  reader12.cancel().catch(() => {})
  return new Response(
    JSON.stringify({ products: prods12 }),
    { headers: { ...cors, 'Content-Type': 'application/json' } }
  )
}

const reader = res.body.getReader()
const dec=new TextDecoder()
let buf='',hdrs:string[]=[],lc=0
const prods:any[]=[]
let ni=-1,pi=-1,ii=-1,ui=-1,bi=-1,di=-1,idi=-1,descIdx=-1

// DEBUG MODE: collect first 3 raw lines
if(isDebug){
const rawLines:string[]=[]
while(rawLines.length<3){
const{done,value}=await reader.read()
if(done)break
buf+=dec.decode(value,{stream:true})
const lines=buf.split('\n')
buf=lines.pop()||''
for(const line of lines){
if(!line.trim())continue
rawLines.push(line)
if(rawLines.length>=3)break
}
}
reader.cancel().catch(()=>{})
return new Response(JSON.stringify({rawLines,products:[],feedUrl}),{headers:{...cors,'Content-Type':'application/json'}})
}

// NORMAL MODE: process products
loop:while(lc<500000){
const{done,value}=await reader.read()
if(done)break
buf+=dec.decode(value,{stream:true})
const lines=buf.split('\n');buf=lines.pop()||''
for(const line of lines){
if(!line.trim())continue;lc++
const cols=csv(line)
if(lc===1){
// Keep raw headers (with underscores) so we can match both formats
hdrs=cols.map(h=>h.toLowerCase().trim())
const norm=(h:string)=>h.replace(/[^a-z0-9]/g,'')
ni=hdrs.findIndex(h=>h==='productname'||h==='awproductname'||h==='product_name'||h==='name'||norm(h).includes('productname'))
pi=hdrs.findIndex(h=>h==='searchprice'||h==='search_price'||h==='cost'||norm(h).includes('searchprice')||norm(h).includes('price'))
ii=hdrs.findIndex(h=>h==='merchantimageurl'||h==='awimageurl'||h==='merchant_image_url'||h==='aw_image_url'||h==='image'||norm(h).includes('imageurl')||norm(h).includes('awimage'))
ui=hdrs.findIndex(h=>h==='awdeeplink'||h==='aw_deep_link'||h==='url'||h==='link'||norm(h).includes('deeplink'))
bi=hdrs.findIndex(h=>h==='brandname'||h==='brand_name'||h==='brand'||h==='manufacturer'||norm(h).includes('brandname'))
di=hdrs.findIndex(h=>h==='deliverycost'||h==='delivery_cost'||norm(h).includes('delivery')||norm(h).includes('shipping'))
idi=hdrs.findIndex(h=>h==='awproductid'||h==='aw_product_id'||h==='id'||h==='sku'||norm(h).includes('productid'))
descIdx=hdrs.findIndex(h=>h.includes('desc'))
console.log('ADV:',actualId,'ni:',ni,'pi:',pi,'ii:',ii,'ui:',ui,'bi:',bi,'di:',di,'idi:',idi,'descIdx:',descIdx,'hdrs:',hdrs.slice(0,15))
if (String(advertiserId) === '12716') {
  console.log('12716 ni:', ni, 'pi:', pi, 'ii:', ii, 'ui:', ui)
}
continue
}
if(ni<0||pi<0)continue
if (String(advertiserId) === '12716' && lc < 5) {
  const _price = parseFloat(cols[pi]||'0')
  const _url = cols[ui]||''
  const _img = cols[ii]||''
  console.log('12716 row', lc, 'price:', _price, 'url:', _url.substring(0,30), 'img:', _img.substring(0,30))
}
const w = String(width)
const p = String(profile)
const nameL = (cols[ni]||'').toLowerCase()
if (useDescFilter) {
  const desc = (cols[descIdx]||'').toLowerCase()
  const rimN = String(rim).replace(/^R/i,'')
  if (!desc.includes(w+'/'+p) || !desc.includes('r'+rimN)) continue
} else if (!nameL.includes(w+'/'+p)) continue
if (applyRimFilter) {
  const rimNum = String(rim).replace(/^R/i,'')
  if (!nameL.includes('r'+rimNum+' ') && 
      !nameL.includes('r'+rimNum+')') && 
      !nameL.includes('r'+rimNum+',')) continue
}
const rawPrice=parseFloat(cols[pi]||'0')
if(rawPrice<=0)continue
const imgVal=cols[ii]||''
const urlVal=cols[ui]||''
const isImgUrl=(v:string)=>v.includes('.jpg')||v.includes('.png')||v.includes('.webp')||v.includes('image.')||v.includes('/tyre-p')
const actualImg=isImgUrl(imgVal)?imgVal:(isImgUrl(urlVal)?urlVal:'')
const actualUrl=(!isImgUrl(urlVal)&&urlVal.startsWith('http'))?urlVal:((!isImgUrl(imgVal)&&imgVal.startsWith('http'))?imgVal:'')
if(!actualUrl)continue
const del=cols[di]||''
    const product:any={
      id:cols[idi]||String(lc),
      title:cols[ni]||'',
      price:`${currency}${rawPrice.toFixed(2)}`,
      image:actualImg,
      url:actualUrl,
      brand:cols[bi]||'',
      shipping:!del||del==='0'?'Free delivery':`${currency}${parseFloat(del).toFixed(2)} delivery`,
      advertiserId:actualId,
      currency,
    }
    
// Use description as display title for suppliers without size in product names
    if (['12715'].includes(actualId)) {
      product.title = (cols[descIdx]||cols[ni]||'').replace(/"/g,'').trim()
    }
    
    prods.push(product)
if(prods.length>=24)break loop
}}
reader.cancel().catch(()=>{})
return new Response(JSON.stringify({products:prods}),{headers:{...cors,'Content-Type':'application/json'}})
}catch(e:any){return new Response(JSON.stringify({products:[],error:e.message}),{status:500,headers:{...cors,'Content-Type':'application/json'}})}
})
