import { NextResponse } from "next/server";

import { CACHE_VERSION, STATIC_ASSETS } from "@/lib/constants";

const SERVICE_WORKER_SOURCE = `const CACHE_VERSION = ${JSON.stringify(CACHE_VERSION)};
const STATIC_ASSETS = ${JSON.stringify(STATIC_ASSETS)};

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_VERSION);
      await Promise.allSettled(
        STATIC_ASSETS.map(async (asset) => {
          const response = await fetch(asset, { cache: "reload" });
          if (response.ok) {
            await cache.put(asset, response);
          }
        }),
      );
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  const isStaticAsset = STATIC_ASSETS.includes(url.pathname);
  if (!isStaticAsset) {
    return;
  }

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_VERSION);
      const cachedResponse = await cache.match(url.pathname);
      if (cachedResponse) {
        return cachedResponse;
      }

      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        await cache.put(url.pathname, networkResponse.clone());
      }
      return networkResponse;
    })(),
  );
});
`;

export async function GET() {
  return new NextResponse(SERVICE_WORKER_SOURCE, {
    headers: {
      "content-type": "application/javascript; charset=utf-8",
      "cache-control": "no-cache, no-store, must-revalidate",
    },
  });
}