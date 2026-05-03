const CACHE_NAME = "vidyasetu-v1";

const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
];

// Install — cache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — network first for API, cache first for static
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET and API calls — always network for these
  if (event.request.method !== "GET") return;
  if (url.pathname.startsWith("/api/")) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Network failed — try cache
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          // Fallback to index.html for navigation
          if (event.request.mode === "navigate") {
            return caches.match("/index.html");
          }
        });
      })
  );
});

// Background sync — retry failed API calls when back online
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-quiz-results") {
    event.waitUntil(syncPendingResults());
  }
});

async function syncPendingResults() {
  const pending = JSON.parse(localStorage.getItem("vidyasetu_pending_sync") || "[]");
  if (!pending.length) return;
  for (const item of pending) {
    try {
      await fetch("/api/quiz/result", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${item.token}` },
        body: JSON.stringify(item.data),
      });
    } catch { break; }
  }
  localStorage.removeItem("vidyasetu_pending_sync");
}