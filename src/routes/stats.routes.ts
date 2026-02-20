import { Router } from "express";
import { getStats } from "../controllers/stats.controller";

const router = Router();

// GET /api/stats
router.get("/", getStats);

export default router;
