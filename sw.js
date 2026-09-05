// EduQuiz Local - Service Worker para PWA (Microsoft Edge & Chrome)
const CACHE_NAME = 'eduquiz-local-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/host.html',
  '/index.html',
  '/editor.html',
  '/css/style.css',
  '/js/audio.js',
  '/js/confetti.js',
  '/js/host.js',
  '/js/player.js',
  '/js/editor.js',
  '/icons/icon.svg',
  '/manifest.webmanifest'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('⚡ EduQuiz Local: Arquivos em cache para funcionamento offline.');
      return cache.addAll(ASSETS_TO_CACHE);
    }).catch(err => console.log('Aviso cache:', err))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Ignorar chamadas da API e websockets socket.io para sempre ir à rede
  if (event.request.url.includes('/api/') || event.request.url.includes('/socket.io/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).catch(() => {
        // Fallback offline se necessário
      });
    })
  );
});
