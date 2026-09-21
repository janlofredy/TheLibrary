const CACHE_NAME = 'the-journal-library-v2'
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon.svg',
]

// Install: Cache app shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE)
    })
  )
  self.skipWaiting()
})

// Activate: Clean old caches and claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key)
          }
        })
      )
    })
  )
  self.clients.claim()
})

// Fetch: Stale-While-Revalidate caching with offline fallback
self.addEventListener('fetch', (event) => {
  // Pass through non-GET requests or GitHub API requests directly
  if (event.request.method !== 'GET' || event.request.url.includes('api.github.com')) {
    return
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseToCache = networkResponse.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache)
            })
          }
          return networkResponse
        })
        .catch(() => {
          // Offline fallback
          return cachedResponse || (caches.match('./index.html') as Promise<Response>)
        })

      return cachedResponse || fetchPromise
    })
  )
})

// Background Sync API: Automatically flush pending edits when internet connectivity resumes
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-journals' || event.tag === 'github-sync') {
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'TRIGGER_BACKGROUND_SYNC' })
        })
      })
    )
  }
})
