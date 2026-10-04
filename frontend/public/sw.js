const CACHE = 'resqchain-shell-v1'
const SHELL = ['/', '/manus-routes.json', '/manifest.webmanifest']
self.addEventListener('install', (event) => event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL))))
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
    const clone = response.clone()
    caches.open(CACHE).then((cache) => cache.put(event.request, clone))
    return response
  }).catch(() => caches.match('/'))))
})
