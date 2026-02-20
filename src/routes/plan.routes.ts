import { Router } from "express";
import { getPlans } from "../controllers/plan.controller";

const router = Router();

// GET /api/plans
router.get("/", getPlans);

export default router;
