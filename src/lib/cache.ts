import NodeCache from "node-cache";
import { Request, Response, NextFunction } from "express";

// ─── Cache Instance ──────────────────────────────────────────────
// TTL = 0 means entries never expire on their own.
// Cache is only cleared when a sync completes (cron or manual).

const cache = new NodeCache({ stdTTL: 0, checkperiod: 0 });

// ─── Cache Middleware ────────────────────────────────────────────
// Caches the full JSON response by request URL.
// On cache hit, returns the cached response immediately.
// On cache miss, intercepts res.json() to store the response.

export const cacheMiddleware = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== "GET") return next();

    const key = req.originalUrl;
    const cached = cache.get<string>(key);

    if (cached) {
      console.log(`⚡ [cache] HIT: ${key}`);
      res.setHeader("X-Cache", "HIT");
      res.setHeader("Content-Type", "application/json");
      res.send(cached);
      return;
    }

    // Miss — intercept res.json to store the response
    console.log(`🔍 [cache] MISS: ${key}`);
    res.setHeader("X-Cache", "MISS");

    const originalJson = res.json.bind(res);
    res.json = (body: any) => {
      cache.set(key, JSON.stringify(body));
      return originalJson(body);
    };

    next();
  };
};

// ─── Invalidate All ──────────────────────────────────────────────
// Call after sync to clear stale data.

export const invalidateCache = () => {
  const keys = cache.keys();
  cache.flushAll();
  console.log(`🗑️  [cache] Invalidated ${keys.length} cached entries`);
};

// ─── Stats (for debugging) ───────────────────────────────────────

export const getCacheStats = () => cache.getStats();
