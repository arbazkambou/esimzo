import { Router, Request, Response } from "express";
import userRoutes from "./user.routes";
import countryRoutes from "./country.routes";
import regionRoutes from "./region.routes";
import syncRoutes from "./sync.routes";

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

export default router;
