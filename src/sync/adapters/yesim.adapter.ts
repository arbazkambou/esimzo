import type { ProviderAdapter, NormalizedPlan } from "../types";
import { buildPlanSlug, convertToMB, defaultPlan } from "./base.adapter";

// ─── Yesim raw API types ─────────────────────────────────────────

interface YesimRawPlan {
  planName: string;
  period: string; // "1", "30", "90"
  capacity: string; // "-1" = unlimited, "5120", etc.
  capacityUnit: string; // "MB"
  capacityInfo: string | null; // "Possible throttling" or null
  price: string; // "7", "24"
  currency: string; // "EUR"
  prices: Record<string, string>;
  priceInfo: string;
  coverages: Array<{ code: string }>;
  planType: string; // "data only"
  package_id: string | null;
  // Fields we ignore: country_code, country, url, directLink, targets, dataUnit, dataCapPer
}

// ─── Config ──────────────────────────────────────────────────────

const PROVIDER_SLUG = "yesim";
const YESIM_API_URL =
  process.env.YESIM_API_URL ||
  "https://api.yesim.app/api_v0.1/api/prices";

// ─── Fetch raw plans from Yesim ──────────────────────────────────

const fetchFromAPI = async (): Promise<YesimRawPlan[]> => {
  const res = await fetch(YESIM_API_URL, {
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(
      `Yesim API responded with ${res.status}: ${res.statusText}`
    );
  }

  return res.json() as Promise<YesimRawPlan[]>;
};

// ─── Normalize a single Yesim plan to our shape ──────────────────

const normalize = (raw: YesimRawPlan): NormalizedPlan => {
  const period = parseInt(raw.period, 10) || 0;
  const rawCapacity = parseInt(raw.capacity, 10);
  const isUnlimited = rawCapacity === -1;
  const capacityMB = isUnlimited ? 0 : convertToMB(rawCapacity, raw.capacityUnit);

  return {
    ...defaultPlan(),

    name: raw.planName,
    slug: buildPlanSlug(PROVIDER_SLUG, raw.planName, capacityMB, period),

    // Pricing (Yesim uses EUR, store raw price as-is)
    usdPrice: parseFloat(raw.price),
    prices: raw.prices,
    priceInfo: raw.priceInfo || null,

    // Data & Validity
    capacity: capacityMB,
    capacityInfo: isUnlimited
      ? "Unlimited"
      : raw.capacityInfo,
    period,

    // Speed
    possibleThrottling: raw.capacityInfo === "Possible throttling",

    // Coverages
    coverages: raw.coverages,
  };
};

// ─── Adapter (plain object) ──────────────────────────────────────

export const yesimAdapter: ProviderAdapter = {
  providerSlug: PROVIDER_SLUG,

  fetchProvider: async () => ({
    name: "Yesim",
    slug: PROVIDER_SLUG,
    info: "Yesim offers eSIM data plans for 200+ countries with simple pricing.",
    image: null,
    certified: true,
  }),

  fetchPlans: async () => {
    const rawPlans = await fetchFromAPI();
    return rawPlans.map(normalize);
  },
};
