self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(
  Promise.all([
    self.clients.claim(),
    caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k)))),
  ])
));
