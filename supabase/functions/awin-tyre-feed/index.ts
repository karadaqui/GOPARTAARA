import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
const cors = {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type'}

const FEEDLIST_URL = 'https://ui.awin.com/productdata-darwin-download/publisher/2845282/f0b723c9643205a96aeb31377b805e02/1/feedList'

const HARDCODED: Record<string,{cur:string,url:string}> = {
  '4118':  { cur:'£', url:'https://productdata.awin.com/datafeed/download/apikey/f0b723c9643205a96aeb31377b805e02/fid/12641/format/csv/language/en/delimiter/%2C/compression/none/adultcontent/1/columns/aw_product_id%2Cproduct_name%2Csearch_price%2Cmerchant_image_url%2Caw_deep_link%2Cbrand_name%2Cdelivery_cost' },
  '12715': { cur:'£', url:'https://productdata.awin.com/datafeed/download/apikey/f0b723c9643205a96aeb31377b805e02/fid/93988/format/csv/language/en/delimiter/%2C/compression/none/adultcontent/1/columns/aw_product_id%2Cproduct_name%2Csearch_price%2Cmerchant_image_url%2Caw_deep_link%2Cbrand_name%2Cdelivery_cost' },
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
const skipWidthFilter = ['12716','12715'].includes(String(advertiserId))
const applyRimFilter = ['4118','10499','10747'].includes(String(advertiserId))
const w = String(width||'')
const p = String(profile||'')
const rimNum = String(rim||'').replace(/^R/i,'')
const sizeStr = `${w}/${p} R${rimNum}`

let feedUrl = HARDCODED[actualId]?.url || ''
const currency = HARDCODED[actualId]?.cur || CURRENCIES[actualId] || '£'

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
const reader=res.body.getReader()
const dec=new TextDecoder()
let buf='',hdrs:string[]=[],lc=0
const prods:any[]=[]
let ni=-1,pi=-1,ii=-1,ui=-1,bi=-1,di=-1,idi=-1

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
console.log('ADV:',actualId,'ni:',ni,'pi:',pi,'ii:',ii,'ui:',ui,'bi:',bi,'di:',di,'idi:',idi,'hdrs:',hdrs.slice(0,15))
continue
}
if(ni<0||pi<0)continue
const w = String(width)
const p = String(profile)
const nameL = (cols[ni]||'').toLowerCase()
if (!skipWidthFilter && !nameL.includes(w+'/'+p)) continue
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
    
    // Add size prefix for suppliers whose products don't have size in names
    if (['12715','12716'].includes(actualId)) {
      product.title = `${w}/${p} R${rimNum} — ${product.title}`
    }
    
    prods.push(product)
if(prods.length>=24)break loop
}}
reader.cancel().catch(()=>{})
return new Response(JSON.stringify({products:prods}),{headers:{...cors,'Content-Type':'application/json'}})
}catch(e:any){return new Response(JSON.stringify({products:[],error:e.message}),{status:500,headers:{...cors,'Content-Type':'application/json'}})}
})
