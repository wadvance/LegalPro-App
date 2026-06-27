const BASE_PATH = '/LegalPro-App';
const CACHE_NAME = 'legalpro-app-v3';
const STATIC_CACHE = 'legalpro-static-v3';

const PRECACHE_URLS = [
  `${BASE_PATH}/`,
  `${BASE_PATH}/index.html`,
  `${BASE_PATH}/manifest.json`,
  `${BASE_PATH}/favicon.ico`,
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch((err) => {
        console.warn('SW pre-cache failed for some URLs:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== STATIC_CACHE)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const isSameOrigin = url.origin === self.location.origin;
  if (!isSameOrigin) return;

  const isAsset = /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff2?|ttf|eot)$/i.test(url.pathname);
  const isNavigate = event.request.mode === 'navigate';
  const isBundle = /\/_expo\/static\/js\/web\//.test(url.pathname);

  if (isNavigate) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const cache = response.clone();
          caches.open(CACHE_NAME).then((c) => c.put(event.request, cache));
          return response;
        })
        .catch(() => caches.match(`${BASE_PATH}/index.html`).then((r) => r || caches.match(event.request)))
    );
    return;
  }

  if (isAsset || isBundle) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (!response || response.status !== 200) return response;
          const clone = response.clone();
          caches.open(STATIC_CACHE).then((cache) => cache.put(event.request, clone));
          return response;
        });
      })
    );
    return;
  }

  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
