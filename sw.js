// =========================================================
// CONFIGURAÇÕES DO SERVICE WORKER (sw.js) - AJUSTE DE PASTAS
// =========================================================

const CACHE_NAME = 'mix-sa-mods-v3'; // Versão 3 para forçar atualização

const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './mods.js',
    './manifest.json',
    './404.html',
    // Caminhos para a pasta 'paginas'
    './paginas/sobre.html',
    './paginas/comunidade.html',
    // Imagens do Sistema
    './assets/img/banner.jpg',
    './assets/img/logo-icon.png',
    // O molde automático dentro da pasta 'mods'
    './mods/pagina-mod.html'
];

// O restante do código (install, activate, fetch) continua o mesmo...
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('SW: Cache atualizado com pastas corretas!');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) return caches.delete(cache);
                })
            );
        })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
