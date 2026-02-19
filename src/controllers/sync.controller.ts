import { Request, Response } from "express";
import { adapters, syncAll, syncOne } from "../sync";
import { asyncHandler, ApiResponse } from "../types";

// ─── POST /api/sync — run all providers ─────────────────────────

export const handleSyncAll = asyncHandler(
  async (_req: Request, res: Response) => {
    const results = await syncAll(adapters);

    const response: ApiResponse = {
      success: results.every((r) => !r.error),
      data: results,
    };

    res.json(response);
  }
);

// ─── POST /api/sync/:provider — run a single provider ───────────

export const handleSyncOne = asyncHandler(
  async (req: Request, res: Response) => {
    const { provider } = req.params;

    const adapter = adapters.find((a) => a.providerSlug === provider);

    if (!adapter) {
      const response: ApiResponse = {
        success: false,
        error: `Provider "${provider}" not found. Available: ${adapters.map((a) => a.providerSlug).join(", ")}`,
      };
      res.status(404).json(response);
      return;
    }

    const result = await syncOne(adapter);

    const response: ApiResponse = {
      success: !result.error,
      data: result,
    };

    res.json(response);
  }
);
