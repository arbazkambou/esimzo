import { Router } from "express";
import { getPlans, getPlanBySlug, comparePlans } from "../controllers/plan.controller";

const router = Router();

// GET /api/plans/compare — must be before /:slug to avoid param catch
router.get("/compare", comparePlans);

// GET /api/plans
router.get("/", getPlans);

// GET /api/plans/:slug
router.get("/:slug", getPlanBySlug);

export default router;
