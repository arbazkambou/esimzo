import { Request, Response, NextFunction } from "express";

// ─── Sync Auth Middleware ────────────────────────────────────────
// Protects sync endpoints with a secret key.
// The key must be sent as: x-sync-key header.
//
// Set SYNC_SECRET_KEY in your .env file.

export const syncAuth = (req: Request, res: Response, next: NextFunction) => {
  const SYNC_SECRET = process.env.SYNC_SECRET_KEY;

  // If no secret is configured, skip auth (dev convenience)
  if (!SYNC_SECRET) {
    console.warn("⚠️ [Auth] SYNC_SECRET_KEY is not set. Sync endpoints are unprotected.");
    return next();
  }

  const provided = req.headers["x-sync-key"];

  if (provided !== SYNC_SECRET) {
    res.status(401).json({
      success: false,
      error: "Unauthorized. Provide a valid x-sync-key header.",
    });
    return;
  }

  next();
};
