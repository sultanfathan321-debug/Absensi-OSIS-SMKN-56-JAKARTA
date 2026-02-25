// Cache version - update this when deploying new updates
const CACHE_VERSION = '1.0.0';
const CACHE_NAME = `absensi-${CACHE_VERSION}`;
const STATIC_CACHE = `absensi-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `absensi-dynamic-${CACHE_VERSION}`;

// Static assets - cache-first strategy
const staticAssets = [
  '/',
  '/style.css',
  '/app.js',
  '/admin.js',
  '/manifest.json',
  '/app-icon.svg',
  '/Logo MPK rev..png',
  '/Logo OSIS rev. (1).png'
];

// HTML files - network-first strategy (always get latest)
const htmlFiles = [
  '/index.html',
  '/admin.html'
];

// Install event - cache files
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('Static cache opened');
        return cache.addAll(staticAssets.map(url => {
          return new Request(url, { cache: 'reload' });
        })).catch(err => {
          console.log('Some static files could not be cached:', err);
        });
      }),
      caches.open(CACHE_NAME).then((cache) => {
        console.log('HTML cache opened');
        return cache.addAll(htmlFiles.map(url => {
          return new Request(url, { cache: 'reload' });
        })).catch(err => {
          console.log('Some HTML files could not be cached:', err);
        });
      })
    ])
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete old versions
          if (!cacheName.includes(CACHE_VERSION)) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - network-first for HTML, cache-first for assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip cross-origin requests (Firebase API, etc)
  if (url.origin !== location.origin) {
    return;
  }
  
  // Network-first for HTML (always get latest version)
  if (request.method === 'GET' && 
      (request.destination === 'document' || 
       url.pathname.endsWith('.html'))) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clonedResponse = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, clonedResponse);
          });
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cachedResponse) => {
            return cachedResponse || new Response('Offline - halaman tidak tersedia', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/html'
              })
            });
          });
        })
    );
    return;
  }
  
  // Cache-first for static assets
  if (request.method === 'GET') {
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          return fetch(request).then((response) => {
            const clonedResponse = response.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, clonedResponse);
            });
            return response;
          });
        })
        .catch(() => {
          return new Response('Offline - resource tidak tersedia', {
            status: 503,
            statusText: 'Service Unavailable'
          });
        })
    );
  }
});

// Push notifications support
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'Notifikasi dari Absensi OSIS',
    icon: '/app-icon.svg',
    tag: 'absensi-notification',
    requireInteraction: false
  };

  event.waitUntil(
    self.registration.showNotification('Absensi OSIS SMKN 56', options)
  );
});

// Notification click handler
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
