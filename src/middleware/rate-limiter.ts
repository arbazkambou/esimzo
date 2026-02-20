import rateLimit from "express-rate-limit";

// ─── Public API Limiter ──────────────────────────────────────────
// 100 requests per minute per IP — generous for browsing.

export const publicLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  standardHeaders: true, // Returns rate limit info in headers
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many requests. Please try again in a minute.",
  },
});

// ─── Sync Limiter ────────────────────────────────────────────────
// 5 requests per minute — sync is expensive, prevent abuse.

export const syncLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many sync requests. Please wait before trying again.",
  },
});
