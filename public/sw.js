const CACHE_NAME = 'nimvelis-aurora-v6';
const SHELL_ASSETS = [
  '/',
  '/manifest.webmanifest',
  '/nimvelis-mark.svg',
  '/wallpapers/aurora-vale.png',
];

globalThis.addEventListener('install', (event) => {
  event.waitUntil(globalThis.caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS)));
});

globalThis.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') void globalThis.skipWaiting();
});

globalThis.addEventListener('activate', (event) => {
  event.waitUntil(
    globalThis.caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE_NAME).map((key) => globalThis.caches.delete(key)),
        ),
      )
      .then(() => globalThis.clients.claim()),
  );
});

globalThis.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new globalThis.URL(request.url);
  if (url.origin !== globalThis.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      globalThis
        .fetch(request)
        .then((response) => {
          const copy = response.clone();
          void globalThis.caches.open(CACHE_NAME).then((cache) => cache.put('/', copy));
          return response;
        })
        .catch(() => globalThis.caches.match('/')),
    );
    return;
  }

  event.respondWith(
    globalThis.caches.match(request).then(
      (cached) =>
        cached ??
        globalThis.fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            void globalThis.caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        }),
    ),
  );
});
