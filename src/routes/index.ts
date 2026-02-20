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

// ─── GET /api/countries/:code/plans ──────────────────────────────

router.get(
  "/countries/:code/plans",
  asyncHandler(async (req: Request, res: Response) => {
    const code = (req.params.code as string).toUpperCase();

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

export default router;
