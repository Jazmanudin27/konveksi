// Service Worker sederhana untuk memenuhi kriteria instalasi PWA di Google Chrome
const CACHE_NAME = 'ruang-konveksi-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Pass-through request ke jaringan
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});