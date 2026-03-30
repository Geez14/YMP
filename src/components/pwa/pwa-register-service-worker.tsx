"use client";

import { useEffect } from "react";
import { CACHE_VERSION, STATIC_ASSETS } from "@/lib/constants";

export function PwaRegisterServiceWorker() {
  useEffect(() => {
    async function warmStaticAssetCache() {
      if (!("caches" in window)) {
        return;
      }

      const cache = await caches.open(CACHE_VERSION);
      await Promise.allSettled(
        STATIC_ASSETS.map(async (asset) => {
          const existing = await cache.match(asset);
          if (existing) {
            return;
          }

          const response = await fetch(asset, { cache: "reload" });
          if (response.ok) {
            await cache.put(asset, response);
          }
        }),
      );
    }

    void warmStaticAssetCache().catch(() => {
      // noop
    });

    if (!("serviceWorker" in navigator)) {
      return;
    }

    void navigator.serviceWorker.register("/sw.js").then(() => warmStaticAssetCache()).catch(() => {
      // noop
    });
  }, []);

  return null;
}
