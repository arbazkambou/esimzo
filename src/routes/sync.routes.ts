import { Router } from "express";
import { handleSyncAll, handleSyncOne } from "../controllers/sync.controller";
import { syncAuth } from "../middleware/sync-auth";
import { syncLimiter } from "../middleware/rate-limiter";

const router = Router();

// POST /api/sync         — sync all providers
router.post("/", syncLimiter, syncAuth, handleSyncAll);

// POST /api/sync/:provider — sync a single provider (e.g. /api/sync/airalo)
router.post("/:provider", syncLimiter, syncAuth, handleSyncOne);

export default router;
