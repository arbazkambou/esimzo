import { Request, Response, NextFunction } from "express";
import { ZodObject, ZodRawShape, ZodError } from "zod";

/**
 * Generic Zod validation middleware.
 * Pass a schema and it validates `req.body`, `req.query`, and `req.params`.
 */
export const validate =
  (schema: ZodObject<ZodRawShape>) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next({
          status: 400,
          message: "Validation failed",
          errors: error.issues.map((e) => ({
            path: e.path.join("."),
            message: e.message,
          })),
        });
      } else {
        next(error);
      }
    }
  };
