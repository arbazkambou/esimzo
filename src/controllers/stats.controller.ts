import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { asyncHandler, ApiResponse } from "../types";

// ─── GET /api/stats — quick overview stats ───────────────────────

export const getStats = asyncHandler(
  async (_req: Request, res: Response) => {
    const [totalPlans, totalProviders, totalCountries] = await Promise.all([
      prisma.plan.count(),
      prisma.provider.count(),
      prisma.country.count(),
    ]);

    const response: ApiResponse = {
      success: true,
      data: {
        totalPlans,
        totalProviders,
        totalCountries,
      },
    };

    res.json(response);
  }
);
