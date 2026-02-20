import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { asyncHandler, ApiResponse } from "../types";

// ─── GET /api/providers — list all providers ─────────────────────

export const getProviders = asyncHandler(
  async (_req: Request, res: Response) => {
    const providers = await prisma.provider.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        info: true,
        image: true,
        certified: true,
        popularity: true,
        planCount: true,
      },
    });

    const response: ApiResponse = {
      success: true,
      data: providers,
    };

    res.json(response);
  }
);

// ─── GET /api/providers/:slug — provider detail + plans ──────────

export const getProviderBySlug = asyncHandler(
  async (req: Request, res: Response) => {
    const slug = req.params.slug as string;

    const provider = await prisma.provider.findUnique({
      where: { slug },
      include: {
        plans: {
          orderBy: { usdPrice: "asc" },
          take: 50,
        },
      },
    });

    if (!provider) {
      const response: ApiResponse = {
        success: false,
        error: `Provider "${slug}" not found`,
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse = {
      success: true,
      data: provider,
    };

    res.json(response);
  }
);
