import { Request, Response } from "express";
import { syncEngine } from "../sync";
import { asyncHandler, ApiResponse } from "../types";

// ─── POST /api/sync — run all providers ─────────────────────────

export const syncAll = asyncHandler(
  async (_req: Request, res: Response) => {
    const results = await syncEngine.runAll();

    const response: ApiResponse = {
      success: results.every((r) => !r.error),
      data: results,
    };

    res.json(response);
  }
);

// ─── POST /api/sync/:provider — run a single provider ───────────

export const syncOne = asyncHandler(
  async (req: Request, res: Response) => {
    const { provider } = req.params;

    // Find the adapter by slug
    const adapters = (syncEngine as any).adapters as Array<{ providerSlug: string }>;
    const adapter = adapters.find((a) => a.providerSlug === provider);

    if (!adapter) {
      const response: ApiResponse = {
        success: false,
        error: `Provider "${provider}" not found. Available: ${adapters.map((a) => a.providerSlug).join(", ")}`,
      };
      res.status(404).json(response);
      return;
    }

    const result = await syncEngine.runOne(adapter as any);

    const response: ApiResponse = {
      success: !result.error,
      data: result,
    };

    res.json(response);
  }
);
