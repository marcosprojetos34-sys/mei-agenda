// MEI Agenda — Service Worker
// Sobe esse número toda vez que publicar uma atualização importante,
// senão o celular do usuário pode continuar servindo a versão antiga do cache.
const CACHE_VERSION = 'mei-agenda-v1';

const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  'icon-192.png',
  'icon-512.png',
  'apple-touch-icon.png'
];

// Instala e guarda o "esqueleto" do app em cache
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache => cache.addAll(APP_SHELL))
  );
});

// Ativa e limpa caches de versões antigas
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Estratégia: network-first pro HTML (sempre tenta buscar versão nova),
// cache-first pro resto (ícones, manifest) — equilíbrio entre "sempre
// atualizado" e "funciona offline"
self.addEventListener('fetch', event => {
  const req = event.request;
  const isHTML = req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html');

  if (isHTML) {
    event.respondWith(
      fetch(req)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_VERSION).then(cache => cache.put(req, clone));
          return res;
        })
        .catch(() => caches.match(req).then(r => r || caches.match('/index.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(cached => cached || fetch(req))
  );
});
