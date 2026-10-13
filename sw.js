const CACHE_NAME = 'school-app-v2'; // 更新時はここを v2, v3... と変えると一発でキャッシュが更新されます

// インストール処理
self.addEventListener('install', (event) => {
  self.skipWaiting(); // 新しいService Workerを即座に有効化
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache); // 古いキャッシュを自動削除
          }
        })
      );
    })
  );
  self.clients.claim();
});

// ネットワーク優先（ネットに繋がっていれば最新を取得、オフラインならキャッシュを使用）
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // 最新データをキャッシュに更新
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => {
        // オフライン時はキャッシュから返す
        return caches.match(event.request);
      })
  );
});
