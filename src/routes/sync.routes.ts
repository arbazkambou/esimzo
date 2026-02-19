import { Router } from "express";
import { syncAll, syncOne } from "../controllers/sync.controller";

const router = Router();

// POST /api/sync         — sync all providers
router.post("/", syncAll);

// POST /api/sync/:provider — sync a single provider (e.g. /api/sync/airalo)
router.post("/:provider", syncOne);

export default router;
