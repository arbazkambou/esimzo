import { Router } from "express";
import { getCountries } from "../controllers/country.controller";

const router = Router();

// GET /api/countries
router.get("/", getCountries);

export default router;
