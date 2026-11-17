const CACHE_NAME = "permata-survival-v1";

const CORE_SURVIVAL_URLS = [
  "/offline-survival",
  "/",
  "/dashboard",
  "/manifest.webmanifest",
  "/permata-logo.webp",
  "/permata.png",
  "/tokens.css",
  "/Breathing.html",
  "/game-breath",
  "/PickAndDrop.html",
  "/SiagaMinang.html",
  "/game-siagaminang",
];

async function safeCacheUrls(cache, urls) {
  const uniqueUrls = Array.from(new Set(urls)).filter(
    (u) => typeof u === "string" && u.startsWith("/")
  );
  const results = await Promise.allSettled(
    uniqueUrls.map(async (url) => {
      const response = await fetch(url, { cache: "no-cache" });
      if (response && response.ok) {
        await cache.put(url, response.clone());
      }
    })
  );
  const cachedCount = results.filter((r) => r.status === "fulfilled").length;
  return { total: uniqueUrls.length, cachedCount };
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => safeCacheUrls(cache, CORE_SURVIVAL_URLS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("permata-survival-") && key !== CACHE_NAME)
            .map((oldKey) => caches.delete(oldKey))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (!event.data || event.data.type !== "CACHE_SURVIVAL_BUNDLE") {
    return;
  }

  const extraUrls = Array.isArray(event.data.urls) ? event.data.urls : [];
  const allUrls = [...CORE_SURVIVAL_URLS, ...extraUrls];

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => safeCacheUrls(cache, allUrls))
      .then((summary) => {
        if (event.ports && event.ports[0]) {
          event.ports[0].postMessage({ ok: true, ...summary });
        }
      })
      .catch((error) => {
        if (event.ports && event.ports[0]) {
          event.ports[0].postMessage({
            ok: false,
            error: error ? String(error) : "Gagal menyimpan cache offline",
          });
        }
      })
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Never cache dynamic API or Vercel Analytics endpoints as survival content
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/_vercel/")
  ) {
    return;
  }

  // Page navigation: network first, fallback to cached route or /offline-survival
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.ok) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, copy);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          const cache = await caches.open(CACHE_NAME);
          const exactMatch = await cache.match(request, { ignoreSearch: true });
          if (exactMatch) return exactMatch;

          const pathMatch = await cache.match(url.pathname);
          if (pathMatch) return pathMatch;

          const survivalFallback = await cache.match("/offline-survival");
          if (survivalFallback) return survivalFallback;

          const rootFallback = await cache.match("/");
          if (rootFallback) return rootFallback;

          return new Response(
            "<!doctype html><html lang='id'><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'><title>PERMATA Offline</title></head><body style='font-family:sans-serif;padding:24px;background:#F7FAF8;color:#1C1917'><h1>Perangkat Sedang Offline</h1><p>Buka halaman Mode Darurat Offline saat perangkat memiliki paket cache tersimpan, atau ikuti prosedur keselamatan dasar: berlindung di tempat aman, jauhi kaca dan kabel listrik, dan hubungi 112 / 117 / 119 jika sinyal tersedia.</p></body></html>",
            {
              status: 200,
              headers: { "Content-Type": "text/html; charset=utf-8" },
            }
          );
        })
    );
    return;
  }

  // Static Next.js chunks, styles, images, fonts, and standalone HTML games
  const isStaticAsset =
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".webp") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".html") ||
    url.pathname.endsWith(".webmanifest");

  if (isStaticAsset) {
    // Development chunks reuse their URL between edits. Serving an older JS
    // or stylesheet beside fresh HTML causes hydration errors. Prefer the
    // network for executable/page assets, retaining the offline fallback.
    const preferNetwork =
      request.destination === "script" ||
      request.destination === "style" ||
      url.pathname.endsWith(".js") ||
      url.pathname.endsWith(".css") ||
      url.pathname.endsWith(".html") ||
      url.pathname.endsWith(".webmanifest");
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request);
        const networkPromise = fetch(request)
          .then(async (networkResponse) => {
            if (networkResponse && networkResponse.ok) {
              // A failed cache write must not discard a usable online response.
              await cache.put(request, networkResponse.clone()).catch(() => {});
            }
            return networkResponse;
          })
          .catch(() => null);

        if (cached && !preferNetwork) {
          return cached;
        }
        const networkResponse = await networkPromise;
        return (
          networkResponse || cached ||
          new Response("", { status: 504, statusText: "Offline" })
        );
      })
    );
  }
});
