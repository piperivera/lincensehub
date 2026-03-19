const CACHE_NAME = 'licensehub-v1';

// Archivos que se cachean al instalar
const STATIC_ASSETS = [
  '/licensehub/',
  '/licensehub/index.html',
  '/licensehub/css/styles.css',
  '/licensehub/js/search.js',
  '/licensehub/js/tables.js',
  '/licensehub/js/trm.js',
  '/licensehub/icons/icon-192.png',
  '/licensehub/icons/icon-512.png',
];

// ── INSTALL: cachea los archivos estáticos ──────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// ── ACTIVATE: elimina cachés viejos ────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ── FETCH: estrategia según tipo de archivo ────────
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // products.json → Network First (siempre trae precios frescos)
  if (url.pathname.includes('products.json')) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  // TRM API → Network Only (no tiene sentido cachear precios del dólar)
  if (url.hostname.includes('datos.gov.co')) {
    event.respondWith(fetch(event.request).catch(() => new Response('', { status: 503 })));
    return;
  }

  // Tailwind CDN y Google Fonts → Network First con fallback
  if (url.hostname.includes('cdn.tailwindcss.com') || url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  // Todo lo demás (HTML, CSS, JS) → Cache First
  event.respondWith(cacheFirst(event.request));
});

// Cache First: sirve desde caché, si no existe va a la red
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Sin conexión', { status: 503 });
  }
}

// Network First: va a la red, si falla usa caché
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response('Sin conexión', { status: 503 });
  }
}
