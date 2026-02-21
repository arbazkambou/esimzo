import { Router } from "express";
import { getCountries, getPopularCountries } from "../controllers/country.controller";

const router = Router();

// GET /api/countries/popular
router.get("/popular", getPopularCountries);

// GET /api/countries
router.get("/", getCountries);

export default router;
