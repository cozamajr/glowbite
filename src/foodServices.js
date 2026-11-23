import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { CapacitorBarcodeScanner, CapacitorBarcodeScannerTypeHint } from '@capacitor/barcode-scanner';

const BASE='https://world.openfoodfacts.org';
const AGENT='GlowBite/0.2 (https://github.com/cozamajr/glowbite)';
const FIELDS='code,product_name,product_name_en,brands,serving_size,serving_quantity,nutriments,image_front_small_url,image_front_url,image_url,quantity';

function quantity(value){const n=Number(value);return Number.isFinite(n)&&n>=0?Math.round(n*10)/10:null;}
function nutrient(n,k,suffix){const x=n[k+suffix];return quantity(x);}
export function fromOpenFoodFacts(p){
  const n=p?.nutriments||{};
  const hasServing=quantity(n['energy-kcal_serving'])!==null;
  const basis=hasServing?'_serving':'_100g';
  let calories=nutrient(n,'energy-kcal',basis);
  if(calories===null){
    const kj=nutrient(n,'energy-kj',basis);
    if(kj!==null)calories=Math.round(kj/4.184);
  }
  if(calories===null) return null; // Do not silently treat missing data as zero.
  const name=String(p.product_name_en||p.product_name||'').trim();
  if(!name)return null;
  const brand=String(p.brands||'').split(',')[0].trim();
  const serving=hasServing?(p.serving_size||'1 serving'):'100 g';
  return {
    id:'off-'+(p.code||Math.random().toString(36).slice(2)),
    code:String(p.code||''),name,detail:brand||'Open Food Facts',
    emoji:'🥫',calories,
    protein:nutrient(n,'proteins',basis)??0,carbs:nutrient(n,'carbohydrates',basis)??0,
    fat:nutrient(n,'fat',basis)??0,serving:String(serving),
    imageUrl:p.image_front_small_url||p.image_front_url||p.image_url||'',
    source:'Open Food Facts',verified:false
  };
}
async function getJson(url){
  if(Capacitor.isNativePlatform()){
    const resp=await CapacitorHttp.get({url,headers:{'User-Agent':AGENT,Accept:'application/json'},connectTimeout:12000,readTimeout:12000});
    if(resp.status<200||resp.status>=300)throw new Error('Food database returned '+resp.status);
    return typeof resp.data==='string'?JSON.parse(resp.data):resp.data;
  }
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),12000);
  try{
    const resp=await fetch(url,{signal:controller.signal,headers:{Accept:'application/json'}});
    if(!resp.ok)throw new Error('Food database returned '+resp.status);
    return await resp.json();
  }finally{clearTimeout(timer);}
}
export async function lookupBarcode(code){
  const cleaned=String(code||'').trim();
  if(!/^\d{8,14}$/.test(cleaned))throw new Error('Enter a valid 8–14 digit barcode');
  const data=await getJson(BASE+'/api/v2/product/'+encodeURIComponent(cleaned)+'.json?fields='+encodeURIComponent(FIELDS));
  if(!data?.product||data.status===0)return {found:false,code:cleaned};
  const result=fromOpenFoodFacts({...data.product,code:cleaned});
  return result?{found:true,food:result}:{found:false,code:cleaned,incomplete:true};
}
export async function searchOnline(term){
  const q=String(term||'').trim();
  if(q.length<2)return [];
  // The Open Food Facts legacy text endpoint remains the documented keyword-search fallback.
  const url=BASE+'/cgi/search.pl?search_terms='+encodeURIComponent(q)+'&search_simple=1&action=process&json=1&page_size=24&fields='+encodeURIComponent(FIELDS);
  const data=await getJson(url);
  return (data.products||[]).map(fromOpenFoodFacts).filter(Boolean).filter((f,i,arr)=>arr.findIndex(x=>x.id===f.id)===i).slice(0,24);
}
export async function scanBarcode(){
  const result=await CapacitorBarcodeScanner.scanBarcode({
    hint:CapacitorBarcodeScannerTypeHint.ALL,
    scanInstructions:'Point your camera at a food barcode',
    android:{scanningLibrary:'zxing'}
  });
  return String(result?.ScanResult||'').trim();
}
export async function capturePhoto(source='camera'){
  const photo=await Camera.getPhoto({
    quality:77,allowEditing:false,correctOrientation:true,
    width:1000,height:1000,
    resultType:CameraResultType.DataUrl,
    source:source==='camera'?CameraSource.Camera:CameraSource.Photos
  });
  if(!photo?.dataUrl)throw new Error('No photo selected');
  return compressPhoto(photo.dataUrl);
}
export async function fileToPhoto(file){
  if(!file||!file.type.startsWith('image/'))throw new Error('Please choose an image');
  const url=URL.createObjectURL(file);
  try{return await compressPhoto(url);}
  finally{URL.revokeObjectURL(url);}
}
function compressPhoto(url){
  return new Promise((resolve,reject)=>{
    const img=new Image();
    img.onload=()=>{
      try{
        const scale=Math.min(1,560/Math.max(img.width,img.height));
        const w=Math.max(1,Math.round(img.width*scale)),h=Math.max(1,Math.round(img.height*scale));
        const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
        canvas.getContext('2d').drawImage(img,0,0,w,h);
        resolve(canvas.toDataURL('image/jpeg',.74));
      }catch(err){reject(err);}
    };
    img.onerror=()=>reject(new Error('Could not read the photo'));
    img.src=url;
  });
}
let mediaPromise;
function openMedia(){
  if(mediaPromise)return mediaPromise;
  mediaPromise=new Promise((resolve,reject)=>{
    const req=indexedDB.open('glowbite-photos',1);
    req.onupgradeneeded=()=>req.result.createObjectStore('photos');
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error||new Error('Photo storage unavailable'));
  });
  return mediaPromise;
}
export async function savePhoto(id,data){
  const db=await openMedia();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction('photos','readwrite');tx.objectStore('photos').put(data,id);
    tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);
  });
}
export async function getPhoto(id){
  if(!id)return null;
  const db=await openMedia();
  return new Promise((resolve,reject)=>{
    const req=db.transaction('photos','readonly').objectStore('photos').get(id);
    req.onsuccess=()=>resolve(req.result||null);req.onerror=()=>reject(req.error);
  });
}
export async function getPhotoBundle(ids){
  const result={};
  for(const id of new Set(ids.filter(Boolean))){
    const image=await getPhoto(id);
    if(image)result[id]=image;
  }
  return result;
}
export async function restorePhotoBundle(bundle){
  for(const [key,value] of Object.entries(bundle||{})){
    if(/^[\w-]+$/.test(key)&&typeof value==='string'&&value.startsWith('data:image/')&&value.length<750000){
      await savePhoto(key,value);
    }
  }
}
export async function clearPhotoBundle(){
  const db=await openMedia();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction('photos','readwrite');tx.objectStore('photos').clear();
    tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);
  });
}
