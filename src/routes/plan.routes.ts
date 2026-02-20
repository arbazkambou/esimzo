import { Router } from "express";
import { getPlans, getPlanBySlug, comparePlans } from "../controllers/plan.controller";
import { cacheMiddleware } from "../lib/cache";

const router = Router();

// GET /api/plans/compare — must be before /:slug to avoid param catch
router.get("/compare", cacheMiddleware(), comparePlans);

// GET /api/plans
router.get("/", cacheMiddleware(), getPlans);

// GET /api/plans/:slug
router.get("/:slug", cacheMiddleware(), getPlanBySlug);

export default router;
