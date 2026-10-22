// ТЯГА web app · service worker: app shell works offline-tolerant, data always goes to the network.
const CACHE = 'tyaga-shell-v2';
const SHELL = ['/', '/index.html', '/manifest.webmanifest', '/vendor/supabase.js', '/vendor/fonts.css', '/icons/icon-192.png'];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;   // API calls: never cached
  if (e.request.mode === 'navigate') {                                              // the app page: fresh first
    e.respondWith(fetch(e.request).then((r) => { const c = r.clone(); caches.open(CACHE).then((x) => x.put('/index.html', c)); return r; })
      .catch(() => caches.match('/index.html')));
    return;
  }
  if (url.pathname.startsWith('/vendor/') || url.pathname.startsWith('/icons/')) {  // static assets: cache first
    e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request).then((r) => { const c = r.clone(); caches.open(CACHE).then((x) => x.put(e.request, c)); return r; })));
  }
});
