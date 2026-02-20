import { Request, Response } from "express";
import { adapters, syncAll, syncOne } from "../sync";
import { asyncHandler, ApiResponse } from "../types";
import { invalidateCache } from "../lib/cache";

// ─── POST /api/sync — run all providers ─────────────────────────

export const handleSyncAll = asyncHandler(
  async (_req: Request, res: Response) => {
    // Fire and forget to prevent Render 502 Timeout
    syncAll(adapters).catch((err) => {
      console.error("❌ Background syncAll failed:", err);
    });

    const response: ApiResponse = {
      success: true,
      data: { message: "Sync started in background. Monitor server logs for completion." },
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

    // Fire and forget to prevent Render 502 Timeout
    syncOne(adapter)
      .then(() => {
        // Clear cache since data changed
        invalidateCache();
      })
      .catch((err) => {
        console.error(`❌ Background syncOne [${provider}] failed:`, err);
      });

    const response: ApiResponse = {
      success: true,
      data: { message: `Sync for ${provider} started in background. Monitor logs for results.` },
    };

    res.json(response);
  }
);
