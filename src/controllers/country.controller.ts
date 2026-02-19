import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { asyncHandler, ApiResponse } from "../types";

// ─── GET /api/countries ─────────────────────────────────────────

export const getCountries = asyncHandler(
  async (_req: Request, res: Response) => {
    const countries = await prisma.country.findMany({
      orderBy: { name: "asc" },
    });

    const response: ApiResponse = {
      success: true,
      data: countries,
    };

    res.json(response);
  }
);
