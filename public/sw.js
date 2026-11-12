// Service worker di CimiTera: tiene sul telefono tutti i file dell'app, così si apre anche senza rete.
// Le immagini satellitari non si conservano: senza rete la mappa passa a Planimetria.
const CACHE = 'cimitera-v2';
const BASE = [
  './', './index.html', './favicon.svg', './manifest.webmanifest', './demo/salmup-demo.json',
  './icone/icona-192.png', './icone/icona-512.png',
  // file per leggere la lapide
  './ocr/worker.min.js', './ocr/ita.traineddata.gz', './ocr/tesseract-core-lstm.wasm.js',
  './ocr/tesseract-core-simd-lstm.wasm.js', './ocr/tesseract-core-relaxedsimd-lstm.wasm.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    // l'elenco dei file della build lo scrive Vite (vedi vite.config.ts)
    let build = [];
    try {
      build = await (await fetch('./precache.json', { cache: 'no-cache' })).json();
    } catch {
      /* in sviluppo non c'è */
    }
    await Promise.all([...BASE, ...build].map((u) => c.add(u).catch(() => null)));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const url = new URL(r.url);
  if (url.origin !== self.location.origin) return;
  const primaLaRete = r.mode === 'navigate' || url.pathname.endsWith('.json');
  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    if (primaLaRete) {
      try {
        const risposta = await fetch(r);
        if (risposta.ok) c.put(r, risposta.clone());
        return risposta;
      } catch {
        return (await c.match(r)) ?? (await c.match('./index.html')) ?? Response.error();
      }
    }
    const salvata = await c.match(r);
    if (salvata) return salvata;
    try {
      const risposta = await fetch(r);
      if (risposta.ok) c.put(r, risposta.clone());
      return risposta;
    } catch {
      return Response.error();
    }
  })());
});
