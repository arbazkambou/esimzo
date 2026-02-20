import { Router } from "express";
import { getProviders, getProviderBySlug } from "../controllers/provider.controller";

const router = Router();

// GET /api/providers
router.get("/", getProviders);

// GET /api/providers/:slug
router.get("/:slug", getProviderBySlug);

export default router;
