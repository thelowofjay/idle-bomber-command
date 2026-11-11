const CACHE = "idle-bomber-command-v20";
const SHELL = [
  "./",
  "./index.html",
  "./styles.css",
  "./core.js",
  "./game.js",
  "./manifest.webmanifest",
  "./icon.svg",
  "./icon-192.png",
  "./icon-512.png",
  "./assets/game/battlefield-airfield-v3.webp",
  "./assets/game/canvas-biplane-topdown.webp",
  "./assets/game/bomber-lineup-main-menu.webp",
  "./assets/game/hardened-bunker-topdown.webp",
  "./assets/game/soft-emplacement-topdown.webp",
  "./fonts/barlow-condensed-400.ttf",
  "./fonts/barlow-condensed-600.ttf",
  "./fonts/barlow-condensed-700.ttf",
  "./fonts/barlow-condensed-800.ttf"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  if (event.request.mode === "navigate") {
    event.respondWith(fetch(event.request).catch(() => caches.match("./index.html")));
    return;
  }
  if (new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(caches.match(event.request).then((cached) => {
    const refresh = fetch(event.request).then((response) => {
      const copy = response.clone();
      caches.open(CACHE).then((cache) => cache.put(event.request, copy));
      return response;
    });
    return cached || refresh;
  }));
});
