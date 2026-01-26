// =========================================================
// CONFIGURAÇÕES DO SERVICE WORKER (sw.js)
// Focado na estrutura real das suas pastas: assets, mods, paginas
// =========================================================

const CACHE_NAME = 'mix-sa-mods-v1';

// Lista baseada nos seus prints do GitHub
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/manifest.json',
    '/404.html',
    // Imagens do Sistema (assets/img)
    '/assets/img/banner.jpg',
    '/assets/img/logo-icon.png',
    // Páginas Secundárias (paginas/)
    '/paginas/comunidade.html',
    '/paginas/sobre.html',
    // Mod de Exemplo (mods/)
    '/mods/mod-gasolina.html',
    '/mods/img/mod-gasolina.png'
];

// Instalação: Salva os arquivos no celular
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('SW: Cache de arquivos do GitHub realizado!');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// Ativação: Limpa lixo de versões antigas
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
});

// Estratégia de Busca: Cache primeiro, depois Internet
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});