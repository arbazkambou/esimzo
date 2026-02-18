import { Request, Response, NextFunction } from "express";

interface AppError {
  status?: number;
  message?: string;
  errors?: unknown[];
  stack?: string;
}

/**
 * Global error handling middleware.
 * Must have 4 parameters so Express recognises it as an error handler.
 */
export const errorHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const status = err.status || 500;
  const message = err.message || "Internal Server Error";

  console.error(`[ERROR] ${status} - ${message}`);
  if (process.env.NODE_ENV === "development" && err.stack) {
    console.error(err.stack);
  }

  res.status(status).json({
    success: false,
    status,
    message,
    ...(err.errors && { errors: err.errors }),
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};
