const CACHE_NAME = 'root-dict-v2.3';
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './enhanced_api.js',
  './enhanced_root_analyzer.js',
  './dictionary.json',
  './icon.png',
  './manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting()) // 立即激活新版本
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName); // 删除旧缓存
          }
        })
      );
    }).then(() => self.clients.claim()) // 立即控制所有页面
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // 对于HTML、JS、CSS文件，总是从网络获取最新版本
        if (event.request.url.includes('.html') || 
            event.request.url.includes('.js') || 
            event.request.url.includes('.css')) {
          return fetch(event.request).catch(() => response);
        }
        return response || fetch(event.request);
      })
  );
});
