self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
    // Basic pass-through to satisfy PWA criteria
    if (event.request.mode === 'navigate') {
        event.respondWith(fetch(event.request));
    }
});
