"use client";

import * as React from "react";

interface UseDebouncedSearchOptions<T> {
  /** Debounce delay before firing the request, in ms. Default 350. */
  delayMs?: number;
  /** Minimum trimmed query length before searching at all. Default 2. */
  minLength?: number;
  /** Value to reset `data` to when the query is below `minLength`. */
  emptyValue: T;
}

/**
 * Debounces a search query and fetches results, guarding against the classic
 * race condition where a slow earlier response resolves after a faster later
 * one and overwrites it with stale data — each request is tagged with a
 * sequence number and only the latest one is allowed to commit state.
 */
export function useDebouncedSearch<T>(
  query: string,
  fetcher: (query: string) => Promise<T>,
  options: UseDebouncedSearchOptions<T>,
) {
  const { delayMs = 350, minLength = 2 } = options;
  const [data, setData] = React.useState<T>(options.emptyValue);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const requestIdRef = React.useRef(0);
  const fetcherRef = React.useRef(fetcher);
  fetcherRef.current = fetcher;
  const emptyValueRef = React.useRef(options.emptyValue);
  emptyValueRef.current = options.emptyValue;

  React.useEffect(() => {
    const trimmed = query.trim();
    const requestId = ++requestIdRef.current;

    if (trimmed.length < minLength) {
      setData(emptyValueRef.current);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const timeout = setTimeout(async () => {
      try {
        const result = await fetcherRef.current(trimmed);
        if (requestIdRef.current !== requestId) return; // a newer search superseded this one
        setData(result);
        setLoading(false);
      } catch (err) {
        if (requestIdRef.current !== requestId) return;
        setError(err instanceof Error ? err.message : "Search failed. Try again.");
        setLoading(false);
      }
    }, delayMs);

    return () => clearTimeout(timeout);
  }, [query, minLength, delayMs]);

  return { data, loading, error };
}
