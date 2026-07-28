/* ==========================================================================
   SERVICE WORKER - GESTIONE CACHE & OFFLINE
   ========================================================================== */

const CACHE_NAME = 'compilatore-verbali-v2';

// Elenco delle risorse fondamentali da salvare in cache per l'uso offline
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './emblem.png',
  './manifest.webmanifest',
  './js/auth.js',
  './js/generators.js',
  './js/storage.js',
  './js/app.js',
  // Librerie esterne CDN
  'https://cdn.jsdelivr.net/npm/html-docx-js@0.3.1/dist/html-docx.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js'
];

// 1. Installazione del Service Worker e pre-caching delle risorse
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Salvataggio risorse in cache...');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// 2. Attivazione e pulizia delle vecchie cache
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[SW] Rimozione vecchia cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Intercettazione delle richieste di rete (Strategia: Cache First, fallback a Network)
self.addEventListener('fetch', (event) => {
  // Ignora le richieste non-GET
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        // Se la risposta è valida, la salviamo dinamicamente in cache
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Fallback in caso di mancanza completa di rete per le pagine HTML
        if (event.request.headers.get('accept').includes('text/html')) {
          return caches.match('./index.html');
        }
      });
    })
  );
});