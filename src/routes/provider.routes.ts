import { Router } from "express";
import { getProviders, getProviderBySlug } from "../controllers/provider.controller";
import { cacheMiddleware } from "../lib/cache";

const router = Router();

// GET /api/providers
router.get("/", cacheMiddleware(), getProviders);

// GET /api/providers/:slug
router.get("/:slug", cacheMiddleware(), getProviderBySlug);

export default router;
