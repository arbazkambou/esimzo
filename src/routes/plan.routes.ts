import { Router } from "express";
import {
  getPlans,
  getCountryPlans,
  getRegionPlans,
  getProviderPlans,
  getGlobalPlans,
  getPlanBySlug,
  comparePlans,
} from "../controllers/plan.controller";
import { cacheMiddleware } from "../lib/cache";

const router = Router();

// ─── Specific routes (must be before /:slug) ─────────────────────

// Compare plans
router.get("/compare", cacheMiddleware(), comparePlans);

// Country plans (with optional provider)
router.get("/country/:countrySlug", cacheMiddleware(), getCountryPlans);
router.get("/country/:countrySlug/provider/:providerSlug", cacheMiddleware(), getCountryPlans);

// Region plans (with optional provider)
router.get("/region/:regionSlug", cacheMiddleware(), getRegionPlans);
router.get("/region/:regionSlug/provider/:providerSlug", cacheMiddleware(), getRegionPlans);

// Global plans (with optional provider)
router.get("/global", cacheMiddleware(), getGlobalPlans);
router.get("/global/provider/:providerSlug", cacheMiddleware(), getGlobalPlans);

// Provider plans
router.get("/provider/:providerSlug", cacheMiddleware(), getProviderPlans);

// ─── Generic routes ──────────────────────────────────────────────

// All plans
router.get("/", cacheMiddleware(), getPlans);

// Single plan detail
router.get("/:slug", cacheMiddleware(), getPlanBySlug);

export default router;
