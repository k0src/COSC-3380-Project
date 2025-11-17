import { useState, useEffect, useRef } from "react";

const IS_DEV = process.env.NODE_ENV === "development";

// Key for local storage
const LOCAL_STORAGE_PREFIX = "asyncData:";

interface CachedData<T> {
  data: T;
  expired: boolean;
}

// Helper to get cached data from local storage
const getCachedData = <T>(cacheKey: string): CachedData<T> | null => {
  const raw = localStorage.getItem(LOCAL_STORAGE_PREFIX + cacheKey);
  if (!raw) return null;

  try {
    const { data, timestamp, ttl } = JSON.parse(raw) as {
      data: T;
      timestamp: number;
      ttl?: number;
    };

    const now = Date.now();

    if (ttl && now - timestamp > ttl) {
      return { data, expired: true }; // Stale cached data
    }
    return { data, expired: false }; // Fresh cached data
  } catch (error) {
    console.error("Error parsing cached data:", error);
    localStorage.removeItem(LOCAL_STORAGE_PREFIX + cacheKey);
    return null; // Invalid JSON
  }
};

// Helper to check if field is a blob URL
const isBlobUrl = (value: string): boolean => {
  return (
    typeof value === "string" &&
    value.includes("blob.core.windows.net") &&
    value.includes("?sv=")
  );
};

// Strip Azure SAS URLs
const sanitizeForCache = <T>(obj: T): T => {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === "string") {
    return (isBlobUrl(obj) ? undefined : obj) as T;
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitizeForCache).filter((v) => v !== undefined) as T;
  }
  if (typeof obj === "object") {
    const clone: any = {};
    for (const [key, value] of Object.entries(obj)) {
      const sanitized = sanitizeForCache(value);
      if (sanitized !== undefined) clone[key] = sanitized;
    }
    return clone;
  }
  return obj;
};

// Helper to set cached data in local storage
const setCachedData = <T>(cacheKey: string, data: T, ttl?: number) => {
  const sanitizedData = sanitizeForCache(data);
  localStorage.setItem(
    LOCAL_STORAGE_PREFIX + cacheKey,
    JSON.stringify({ data: sanitizedData, timestamp: Date.now(), ttl })
  );
};

interface UseAsyncDataOptions {
  cacheKey?: string;
  ttl?: number;
  resetOnDepsChange?: boolean;
  hasBlobUrl?: boolean;
  enabled?: boolean;
}

interface UseAsyncDataResult<TData extends Record<string, any>> {
  data: TData;
  loading: boolean;
  error: unknown;
  refetch: () => void;
}

/**
 * Fetches data from one or more asynchronous functions with localStorage caching support.
 * Returns cached data immediately if available, and automatically re-fetches data
 * in the background if the cache is expired to keep data fresh without blocking the UI.
 *
 * @param asyncFns - Object where each key maps to an async function returning a Promise.
 * @param dependencies - Dependency array to determine when to re-fetch the data.
 * @param options.cacheKey - Optional key to use for caching the data in localStorage.
 * @param options.ttl - Time-to-live for the cached data in milliseconds (default: 5 minutes).
 * @param options.resetOnDepsChange - Whether to reset data when dependencies change (default: false).
 * @param options.hasBlobUrl - Whether the data contains blob URLs that should not be cached (default: false).
 * @param options.enabled - Whether the data fetching is enabled (default: true).
 * @returns {UseAsyncDataResult<TData>}
 */
export function useAsyncData<
  TAsyncFns extends Record<string, () => Promise<any>>
>(
  asyncFns: TAsyncFns,
  dependencies: any[] = [],
  options: UseAsyncDataOptions = {}
): UseAsyncDataResult<{
  [K in keyof TAsyncFns]: Awaited<ReturnType<TAsyncFns[K]>>;
}> {
  type TData = { [K in keyof TAsyncFns]: Awaited<ReturnType<TAsyncFns[K]>> };

  const [data, setData] = useState<TData>({} as TData);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<unknown>(null);

  const requestIdRef = useRef(0);
  const prevDepsRef = useRef<any[]>(dependencies);

  const {
    cacheKey,
    ttl = 1000 * 60 * 5,
    resetOnDepsChange = false,
    hasBlobUrl = false,
    enabled = true,
  } = options;

  const fetchData = async (bypassCache = false) => {
    const currentRequestId = ++requestIdRef.current;

    try {
      setLoading(true);
      setError(null);

      const fns = Object.entries(asyncFns);
      const results = await Promise.all(fns.map(([_, fn]) => fn()));

      if (currentRequestId !== requestIdRef.current) return;

      const structuredData = fns.reduce((acc, [key], i) => {
        (acc as any)[key] = results[i];
        return acc;
      }, {} as TData);

      if (cacheKey && !IS_DEV && !bypassCache) {
        setCachedData(cacheKey, structuredData, ttl);
      }

      setData((prev) => ({ ...prev, ...structuredData }));
    } catch (err) {
      if (currentRequestId !== requestIdRef.current) return;
      setError(err);
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  };

  const refetch = () => {
    fetchData(true); // bypass cache when manually refetching
  };

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    const depsChanged =
      resetOnDepsChange &&
      JSON.stringify(prevDepsRef.current) !== JSON.stringify(dependencies);

    if (depsChanged) {
      setData({} as TData);
      setError(null);
    }

    if (depsChanged) {
      fetchData();
      prevDepsRef.current = dependencies;
      return;
    }

    if (cacheKey && !IS_DEV) {
      const cached = getCachedData<TData>(cacheKey);
      if (cached) {
        setData(cached.data);
        setLoading(false);

        // Refetch if cache is expired or data has blob URLs
        if (cached.expired || hasBlobUrl) {
          fetchData();
        }

        prevDepsRef.current = dependencies;
        return;
      }
    }

    fetchData();
    prevDepsRef.current = dependencies;
  }, dependencies);

  return { data, loading, error, refetch };
}
