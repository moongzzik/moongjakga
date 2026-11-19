// 뭉작가 서비스워커 — 고칠 때마다 VERSION을 1씩 올리세요
const VERSION = 'moongjakga-v12';
const CORE = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) {
    // 글꼴 등 외부 파일: 캐시 우선, 없으면 네트워크 후 저장
    e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => {
      if (res && (res.ok || res.type === 'opaque')) { const cp = res.clone(); caches.open(VERSION).then(c => c.put(req, cp)); }
      return res;
    }).catch(() => r)));
    return;
  }
  if (url.pathname.endsWith('/manifest.webmanifest') && url.searchParams.has('n')) {
    // 홈 화면 이름: 첫 화면에 적은 이름 + '작가'
    const pen = (url.searchParams.get('n') || '').replace(/\s+/g, '').replace(/작가$/, '').slice(0, 4) || '뭉';
    const name = pen + '작가';
    e.respondWith(caches.match('./manifest.webmanifest').then(r => r || fetch('./manifest.webmanifest')).then(r => r.json()).then(m => {
      m.id = './'; m.name = name + ' — 나만의 문체를 짓는 글쓰기 앱'; m.short_name = name;
      return new Response(JSON.stringify(m), { headers: { 'Content-Type': 'application/manifest+json; charset=utf-8' } });
    }));
    return;
  }
  if (req.mode === 'navigate') {
    // 앱 화면: 네트워크 우선(최신), 오프라인이면 캐시
    e.respondWith(fetch(req).then(res => { const cp = res.clone(); caches.open(VERSION).then(c => c.put('./index.html', cp)); return res; })
      .catch(() => caches.match('./index.html')));
    return;
  }
  e.respondWith(caches.match(req).then(r => r || fetch(req)));
});
