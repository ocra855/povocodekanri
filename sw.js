
const CACHE_NAME = "pobovault-v1";

const APP_FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon.png"
];

// インストール時にアプリの基本ファイルを保存
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_FILES);
    })
  );

  self.skipWaiting();
});

// 古いキャッシュを削除
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    })
  );

  self.clients.claim();
});

// ページの読み込み処理
self.addEventListener("fetch", (event) => {
  const request = event.request;

  // GET以外は対象外
  if (request.method !== "GET") return;

  // ページ遷移はネットワーク優先
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          return response;
        })
        .catch(async () => {
          return (
            await caches.match("./index.html")
          ) || (await caches.match("./"));
        })
    );
    return;
  }

  // その他のファイルはキャッシュ優先
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request).then((response) => {
        if (
          response.ok &&
          new URL(request.url).origin === self.location.origin
        ) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, copy);
          });
        }

        return response;
      });
    })
  );
});
