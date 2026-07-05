"use client";

import { useEffect } from "react";

/** Înregistrează service worker-ul (/sw.js) pentru PWA, după încărcarea paginii. */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const onLoad = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // înregistrarea a eșuat (ex. dev peste http) — ignorăm în tăcere
      });
    };
    window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);

  return null;
}
