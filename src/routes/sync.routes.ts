import { Router } from "express";
import { handleSyncAll, handleSyncOne } from "../controllers/sync.controller";

const router = Router();

// POST /api/sync         — sync all providers
router.post("/", handleSyncAll);

// POST /api/sync/:provider — sync a single provider (e.g. /api/sync/airalo)
router.post("/:provider", handleSyncOne);

export default router;
