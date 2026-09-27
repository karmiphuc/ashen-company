const CACHE = 'ashen-company-v3';
const ASSETS = ['./','./index.html','./src/style.css','./src/app.js','./src/engine.js','./src/map.js','./src/portraits.js','./manifest.webmanifest','./assets/icon.svg','./assets/icon-192.png','./assets/icon-512.png'];
const urls=ASSETS.map(path=>new URL(path,self.registration.scope).href);
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(urls)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
  const keys=await caches.keys();
  await Promise.all(keys.filter(key=>key.startsWith('ashen-company-')&&key!==CACHE).map(key=>caches.delete(key)));
  await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET'||!event.request.url.startsWith(self.registration.scope)) return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    const cached=await cache.match(event.request,{ignoreSearch:true});
    if(cached) return cached;
    try {return await fetch(event.request);} catch {
      if(event.request.mode==='navigate')return (await cache.match(new URL('./index.html',self.registration.scope).href));
      return Response.error();
    }
  })());
});
self.addEventListener('message',event=>{
  if(event.data?.type==='CHECK_OFFLINE')event.waitUntil((async()=>{
    const cache=await caches.open(CACHE);
    const ready=(await Promise.all(urls.map(url=>cache.match(url)))).every(Boolean);
    event.ports[0]?.postMessage({ready});
  })());
});
