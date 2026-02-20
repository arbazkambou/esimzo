import { Router } from "express";
import { getStats } from "../controllers/stats.controller";
import { cacheMiddleware } from "../lib/cache";

const router = Router();

// GET /api/stats
router.get("/", cacheMiddleware(), getStats);

export default router;
