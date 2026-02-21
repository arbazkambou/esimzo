import { Router, Request, Response } from "express";
import userRoutes from "./user.routes";
import countryRoutes from "./country.routes";
import regionRoutes from "./region.routes";
import syncRoutes from "./sync.routes";
import planRoutes from "./plan.routes";
import providerRoutes from "./provider.routes";
import statsRoutes from "./stats.routes";
import { prisma } from "../lib/prisma";
import { asyncHandler, ApiResponse } from "../types";
import { cacheMiddleware } from "../lib/cache";

const router = Router();

// ─── Health Check ────────────────────────────────────────────────

router.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─── Mount Sub-Routers ──────────────────────────────────────────

router.use("/users", userRoutes);
router.use("/countries", countryRoutes);
router.use("/regions", regionRoutes);
router.use("/sync", syncRoutes);
router.use("/plans", planRoutes);
router.use("/providers", providerRoutes);
router.use("/stats", statsRoutes);

// ─── GET /api/countries/:codeOrSlug/plans ──────────────────────────────

router.get(
  "/countries/:codeOrSlug/plans",
  cacheMiddleware(),
  asyncHandler(async (req: Request, res: Response) => {
    const param = req.params.codeOrSlug as string;

    const country = await prisma.country.findFirst({
      where: {
        OR: [{ code: param.toUpperCase() }, { slug: param.toLowerCase() }],
      },
      select: { code: true },
    });

    if (!country) {
      const response: ApiResponse = {
        success: false,
        error: `Country "${param}" not found`,
      };
      res.status(404).json(response);
      return;
    }

    const code = country.code;

    const plans = await prisma.plan.findMany({
      where: {
        coverages: {
          array_contains: [{ code }],
        },
      },
      orderBy: { usdPrice: "asc" },
      include: {
        provider: {
          select: { name: true, slug: true, image: true },
        },
      },
    });

    const response: ApiResponse = {
      success: true,
      data: plans,
      meta: { total: plans.length },
    };

    res.json(response);
  })
);

// ─── GET /api/regions/:slugOrCode/plans ────────────────────────────────
// Returns multi-country plans that cover a region.
// A plan counts as a "region plan" if its coverages include at
// least half of the region's countries (e.g. 22/44 for Europe).

router.get(
  "/regions/:slugOrCode/plans",
  cacheMiddleware(),
  asyncHandler(async (req: Request, res: Response) => {
    const param = req.params.slugOrCode as string;

    // 1. Find region + all its country codes
    const region = await prisma.region.findFirst({
      where: {
        OR: [{ slug: param.toLowerCase() }, { code: param.toUpperCase() }],
      },
      include: {
        countries: { select: { code: true } },
      },
    });

    if (!region) {
      const response: ApiResponse = {
        success: false,
        error: `Region "${param}" not found`,
      };
      res.status(404).json(response);
      return;
    }

    const regionCodes = new Set(
      region.countries.map((c) => c.code.toUpperCase())
    );
    const threshold = Math.ceil(regionCodes.size / 2); // 50%+

    // 2. Fetch plans that cover at least ONE country in this region
    const candidates = await prisma.plan.findMany({
      where: {
        OR: Array.from(regionCodes).slice(0, 5).map((code) => ({
          coverages: { array_contains: [{ code }] },
        })),
      },
      include: {
        provider: {
          select: { name: true, slug: true, image: true },
        },
      },
    });

    // 3. Keep only plans that cover 50%+ of the region's countries
    const plans = candidates
      .filter((plan) => {
        const planCodes = (plan.coverages as Array<{ code: string }>).map(
          (c) => c.code.toUpperCase()
        );
        const overlap = planCodes.filter((c) => regionCodes.has(c)).length;
        return overlap >= threshold;
      })
      .sort((a, b) => a.usdPrice - b.usdPrice);

    const response: ApiResponse = {
      success: true,
      data: plans,
      meta: {
        total: plans.length,
      },
    };

    res.json(response);
  })
);

export default router;
