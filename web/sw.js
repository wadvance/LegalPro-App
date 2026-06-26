const CACHE_NAME = 'legalpro-app-v2';
const BASE_PATH = '/LegalPro-App';

const PRECACHE_URLS = [
  `${BASE_PATH}/favicon.ico`,
  `${BASE_PATH}/manifest.json`,
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  const isJS = url.pathname.includes('/static/js/');
  const isHTML = event.request.mode === 'navigate' || url.pathname === '/' || url.pathname.endsWith('.html');

  if (isJS || isHTML) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request).then((hit) => hit || fetch(event.request))
  );
});
