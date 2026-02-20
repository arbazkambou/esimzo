import type { ProviderAdapter, NormalizedPlan } from "../types";
import { buildPlanSlug, convertToMB, defaultPlan, has5GInCoverages } from "./base.adapter";

// ─── eSIM Card / Yaalo shared raw API types ───────────────

export interface SharedWhiteLabelRawPlan {
  id: string;
  validity: number;
  dataCap: number;
  dataUnit: string; // "GB", "MB", etc.
  dataCapPer: string | null; // "day" or null
  speedLimit: number;
  reducedSpeed?: number;
  planName: string;
  prices: Record<string, number>;
  validityInfo: string;
  phoneNumber: boolean;
  subscription: boolean;
  canTopUp: boolean;
  eKYC: boolean;
  tethering: boolean;
  hasAds: boolean;
  payAsYouGo: boolean;
  promoEnabled: boolean;
  packageType: string;
  coverages: Array<{
    code: string;
    networks: Array<{
      name: string;
      types: string[];
    }>;
  }>;
}

// ─── Config ──────────────────────────────────────────────────────

const PROVIDER_SLUG = "esim-card";

// Using an environment variable for the full URL with the API key
// Defaulting to the URL provided by the user
const ESIMCARD_API_URL =
  process.env.ESIMCARD_API_URL ||
  "https://esimcard.com/api/affiliate/data-plans?api_key=8b8f9938-39b5-445c-8f47-88ecb37addea";

// ─── Fetch raw plans ─────────────────────────────────────────────

const fetchFromAPI = async (): Promise<SharedWhiteLabelRawPlan[]> => {
  const res = await fetch(ESIMCARD_API_URL, {
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(
      `eSIM Card API responded with ${res.status}: ${res.statusText}`
    );
  }

  return res.json() as Promise<SharedWhiteLabelRawPlan[]>;
};

// ─── Normalize ───────────────────────────────────────────────────

export const normalizeSharedPlan = (
  raw: SharedWhiteLabelRawPlan,
  providerSlug: string
): NormalizedPlan => {
  // Gracefully handle strings with text (e.g. "3Day", "5 GB")
  const parseNum = (val: any): number => {
    if (!val) return 0;
    const match = String(val).match(/\d+(\.\d+)?/);
    return match ? parseFloat(match[0]) : 0;
  };

  const period = parseNum(raw.validity);
  
  // Handle daily caps (e.g., Unlimited with 1GB/day high speed)
  const isDaily = raw.dataCapPer === "day" || raw.dataCapPer === "daily";
  // The user's example says "Unlimited eSIM Data... 1GB/day" so usually it's unlimited data overall
  const isUnlimited = raw.planName.toLowerCase().includes("unlimited");
  
  let capacityMB = 0;
  if (!isUnlimited) {
    capacityMB = convertToMB(parseNum(raw.dataCap), raw.dataUnit);
  }

  // If there's a daily cap, the capacity is usually referring to the high-speed data amount
  let capacityInfo = null;
  if (isDaily) {
    capacityInfo = `${raw.dataCap}${raw.dataUnit}/day`;
  } else if (isUnlimited) {
    capacityInfo = "Unlimited";
  }

  const usdPrice = raw.prices?.USD || Object.values(raw.prices || {})[0] || 0;

  // Has 5G?
  const has5g = has5GInCoverages(raw.coverages || []);

  // Convert prices
  const stringifiedPrices = Object.entries(raw.prices || {}).reduce(
    (acc, [currency, value]) => {
      acc[currency] = value.toString();
      return acc;
    },
    {} as Record<string, string>
  );

  return {
    ...defaultPlan(),

    name: raw.planName,
    slug: buildPlanSlug(providerSlug, raw.planName, capacityMB, period),

    usdPrice,
    prices: stringifiedPrices,
    priceInfo: null,

    // Data & Validity
    capacity: capacityMB,
    capacityInfo: capacityInfo,
    period,
    validityInfo: raw.validityInfo || null,

    // Speed
    speedLimit: raw.speedLimit || null,
    reducedSpeed: raw.reducedSpeed || null,
    has5G: has5g,

    // Features
    tethering: raw.tethering || false,
    canTopUp: raw.canTopUp || false,
    phoneNumber: raw.phoneNumber || false,
    subscription: raw.subscription || false,
    payAsYouGo: raw.payAsYouGo || false,

    // Coverages
    coverages: raw.coverages || [],
  };
};

// ─── Adapter (plain object) ──────────────────────────────────────

export const esimcardAdapter: ProviderAdapter = {
  providerSlug: PROVIDER_SLUG,

  fetchProvider: async () => ({
    name: "eSIM Card",
    slug: PROVIDER_SLUG,
    info: "eSIM Card offers global connectivity with flexible data plans.",
    image: null,
    certified: true,
  }),

  fetchPlans: async () => {
    const rawPlans = await fetchFromAPI();
    return rawPlans.map((plan) => normalizeSharedPlan(plan, PROVIDER_SLUG));
  },
};
