"use client";

import * as React from "react";

export function ServiceWorkerRegister() {
  React.useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);

  return null;
}
