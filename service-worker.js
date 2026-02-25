const CACHE_NAME = 'absensi-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/admin.html',
  '/app.js',
  '/admin.js',
  '/style.css',
  '/manifest.json',
  '/Logo MPK rev..png',
  '/Logo OSIS rev. (1).png'
];

// Install event - cache files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache opened');
        return cache.addAll(urlsToCache.map(url => {
          return new Request(url, { cache: 'reload' });
        })).catch(err => {
          // Jika beberapa file gagal, lanjutkan saja
          console.log('Some files could not be cached:', err);
        });
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests (seperti Firebase API)
  if (!event.request.url.includes(location.origin) && 
      event.request.url.includes('googleapis')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version if available
        if (response) {
          return response;
        }

        return fetch(event.request).then((response) => {
          // Check if we received a valid response
          if (!response || response.status !== 200 || response.type === 'error') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          // Cache successful requests (GET only)
          if (event.request.method === 'GET') {
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
          }

          return response;
        });
      })
      .catch(() => {
        // Return offline page if available, otherwise generic offline message
        return new Response(
          '<h1>Offline</h1><p>Koneksi internet diperlukan untuk fitur ini.</p>',
          {
            headers: { 'Content-Type': 'text/html' },
            status: 503,
            statusText: 'Service Unavailable'
          }
        );
      })
  );
});

// Background sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-absensi') {
    event.waitUntil(
      // Sync logic here
      Promise.resolve()
    );
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'Notifikasi dari Absensi OSIS',
    icon: '/manifest.json',
    badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect fill="%23667eea" width="96" height="96"/></svg>',
    tag: 'absensi-notification',
    requireInteraction: false
  };

  event.waitUntil(
    self.registration.showNotification('Absensi OSIS SMKN 56', options)
  );
});

// Notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (let client of clientList) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
  );
});
