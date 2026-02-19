import { Request, Response, NextFunction } from "express";

/**
 * Shared TypeScript types & interfaces.
 */

// ─── API Response Envelope ───────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

// ─── Async Handler Wrapper ───────────────────────────────────────

/**
 * Wraps an async route handler so thrown errors are forwarded to
 * the Express error-handling middleware automatically.
 */
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
