"use client";

import * as React from "react";
import type { CoinToastData } from "../components/coin-toast";

export function useCoinToast(durationMs = 3500) {
  const [toast, setToast] = React.useState<CoinToastData | null>(null);

  const showToast = React.useCallback((data: CoinToastData) => setToast(data), []);

  React.useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), durationMs);
    return () => window.clearTimeout(timeout);
  }, [toast, durationMs]);

  return { toast, showToast };
}
