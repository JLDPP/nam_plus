const version = "__BUILD_VERSION__";
const appCache = `nam-plus-app-${version}`;
const imageCache = "nam-plus-reward-images-v1";
const assets = __PRECACHE_ASSETS__;

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(appCache).then((cache) =>
    cache.addAll(assets.map((asset) => new Request(asset, { cache: "reload" })))
  ));
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith("nam-plus-app-") && key !== appCache) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});

async function loadPage(request) {
  try {
    const response = await fetch(request);
    if (response.status < 500) return response;
  } catch {
    // Se usa la página de la compilación instalada cuando no hay red.
  }
  return (await caches.open(appCache)).match("/index.html");
}

async function loadRewardImage(request) {
  const cache = await caches.open(imageCache);
  try {
    const response = await fetch(request);
    if (response.ok || response.type === "opaque") {
      await cache.put(request, response.clone()).catch(() => {});
      const keys = await cache.keys();
      if (keys.length > 60) await cache.delete(keys[0]);
    }
    return response;
  } catch {
    return (await cache.match(request)) || Response.error();
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  if (request.destination === "image" && /^\/api\/rewards\/images\//.test(url.pathname)) {
    event.respondWith(loadRewardImage(request));
    return;
  }
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith(loadPage(request));
  } else if (assets.includes(url.pathname)) {
    event.respondWith(caches.open(appCache).then(async (cache) => (await cache.match(url.pathname)) || fetch(request)));
  }
});
