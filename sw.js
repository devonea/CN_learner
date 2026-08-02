const CACHE_NAME = 'cn-learner-cache-v2';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
];

// 설치 시 앱 셸을 미리 캐싱
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// 활성화 시 이전 버전 캐시 정리
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// 캐시 우선(즉시 응답, 데이터 소모 없음) + 온라인이면 백그라운드로 최신화
// 오프라인/비행기모드에서도 캐시가 있으면 네트워크 시도 자체를 하지 않아 즉시 실행됨
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkUpdate = fetch(event.request)
        .then((response) => {
          if (response && response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached); // 네트워크 실패 시 캐시로 대체 (캐시도 없으면 undefined)

      // 캐시가 있으면 즉시 반환(오프라인/저속 네트워크에서도 대기 없음)
      // 캐시가 없으면(최초 방문) 네트워크 응답을 기다림
      return cached || networkUpdate;
    })
  );
});
