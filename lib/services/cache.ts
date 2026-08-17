// Server-side memory caching to avoid duplicate database queries and calculations.
// This cache is strictly a performance optimization and never a source of truth.

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

// Global cache variables (instance-local on the server)
let consistencyCache: CacheEntry<any> | null = null;
let diagnosticsCache: CacheEntry<any> | null = null;

const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export function getConsistencyCache(): CacheEntry<any> | null {
  const now = Date.now();
  if (consistencyCache && now - consistencyCache.timestamp < CACHE_TTL) {
    return consistencyCache;
  }
  return null;
}

export function setConsistencyCache(data: any) {
  consistencyCache = {
    data,
    timestamp: Date.now(),
  };
}

export function invalidateConsistencyCache() {
  consistencyCache = null;
}

export function getDiagnosticsCache(): CacheEntry<any> | null {
  const now = Date.now();
  if (diagnosticsCache && now - diagnosticsCache.timestamp < CACHE_TTL) {
    return diagnosticsCache;
  }
  return null;
}

export function setDiagnosticsCache(data: any) {
  diagnosticsCache = {
    data,
    timestamp: Date.now(),
  };
}

export function invalidateDiagnosticsCache() {
  diagnosticsCache = null;
}
