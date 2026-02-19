import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { asyncHandler, ApiResponse } from "../types";

// ─── GET /api/regions ───────────────────────────────────────────

export const getRegions = asyncHandler(
  async (_req: Request, res: Response) => {
    const regions = await prisma.region.findMany({
      orderBy: { name: "asc" },
      include: { countries: { orderBy: { name: "asc" } } },
    });

    const response: ApiResponse = {
      success: true,
      data: regions,
    };

    res.json(response);
  }
);
