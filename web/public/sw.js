const CACHE_VERSION = "tajwidlens-pwa-v4";
const APP_SCOPE = self.registration.scope;
const CORE_PATHS = ["./", "./home/", "./login/", "./learn/", "./explore/", "./reading-guide/", "./android-chrome-192x192.png", "./android-chrome-512x512.png"];
const CORE_URLS = CORE_PATHS.map((path) => new URL(path, APP_SCOPE).toString());

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_VERSION).then((cache) => cache.addAll(CORE_URLS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith("tajwidlens-pwa-") && key !== CACHE_VERSION).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE_VERSION);
  try {
    const response = await fetch(request);
    if (response.ok) await cache.put(request, response.clone());
    return response;
  } catch {
    return (await cache.match(request)) || (request.mode === "navigate" ? await cache.match(new URL(request.url).pathname) : undefined) || Response.error();
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_VERSION);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) await cache.put(request, response.clone());
  return response;
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.pathname.includes('/api/') || url.pathname.includes('/profile/')) return;
  if (url.origin !== self.location.origin || !url.href.startsWith(APP_SCOPE)) return;
  const isTajweedPayload = url.pathname.includes("/data/tajweed/");
  if (request.mode === "navigate" || isTajweedPayload || url.pathname.endsWith(".txt") || request.headers.get("RSC")) {
    event.respondWith(networkFirst(request));
    return;
  }
  event.respondWith(cacheFirst(request));
});
