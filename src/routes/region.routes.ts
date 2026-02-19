import { Router } from "express";
import { getRegions } from "../controllers/region.controller";

const router = Router();

// GET /api/regions
router.get("/", getRegions);

export default router;
