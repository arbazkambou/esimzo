import { Router, Request, Response } from "express";
import userRoutes from "./user.routes";
import countryRoutes from "./country.routes";

const router = Router();

// ─── Health Check ────────────────────────────────────────────────

router.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─── Mount Sub-Routers ──────────────────────────────────────────

router.use("/users", userRoutes);
router.use("/countries", countryRoutes);

export default router;
