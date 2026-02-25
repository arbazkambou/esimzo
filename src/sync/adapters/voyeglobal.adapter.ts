import type { ProviderAdapter, NormalizedPlan } from "../types";
import { buildPlanSlug, convertToMB, defaultPlan } from "./base.adapter";

// ─── VoyeGlobal raw API types ────────────────────────────────────

interface VoyeGlobalRawPlan {
  validity: number;
  dataCap: number;
  dataUnit: string; // "GB", "MB"
  dataCapPer: string | null; // "day" or null
  prices: Record<string, number>;
  planName: string;
  additionalInfo: string;
  coverages: Array<string | { code: string; networks?: any }>;
}

// ─── Config ──────────────────────────────────────────────────────

const PROVIDER_SLUG = "voyeglobal";
const VOYEGLOBAL_API_URL =
  process.env.VOYEGLOBAL_API_URL ||
  "https://voyeglobal.com/wp-content/uploads/json-api/custom_products_api.json";

// ─── Fetch raw plans from VoyeGlobal ─────────────────────────────

const fetchFromAPI = async (): Promise<VoyeGlobalRawPlan[]> => {
  const res = await fetch(VOYEGLOBAL_API_URL, {
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(
      `VoyeGlobal API responded with ${res.status}: ${res.statusText}`
    );
  }

  return res.json() as Promise<VoyeGlobalRawPlan[]>;
};

// ─── Normalize a single VoyeGlobal plan to our shape ─────────────

const normalize = (raw: VoyeGlobalRawPlan): NormalizedPlan => {
  const period = raw.validity || 0;
  
  // Handle daily caps (e.g., "3GB/day" usually means unlimited total data, but daily high-speed limit)
  const isDaily = raw.dataCapPer === "day";
  const capacityMB = isDaily ? 0 : convertToMB(raw.dataCap, raw.dataUnit);
  const capacityInfo = isDaily ? `${raw.dataCap}${raw.dataUnit}/day` : null;

  // Make sure we have a USD price
  const usdPrice = raw.prices?.USD || Object.values(raw.prices || {})[0] || 0;

  // Normalize Coverages
  // VoyeGlobal uses ["TH"] OR [{"code": "AN", "networks": false}]
  const coverages = (raw.coverages || []).map((c) => {
    if (typeof c === "string") {
      return { code: c.toUpperCase() };
    }
    return { code: c.code.toUpperCase() };
  });

  // Convert prices from Record<string, number> to Record<string, string> to match Prisma JSON structure
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
    slug: buildPlanSlug(PROVIDER_SLUG, raw.planName, capacityMB, period),

    usdPrice,
    prices: stringifiedPrices,
    priceInfo: null,

    // Data & Validity
    capacity: capacityMB,
    capacityInfo: capacityInfo,
    period,

    // Coverages
    coverages,
    
    // Additional Info
    additionalInfo: raw.additionalInfo || null,
  };
};

// ─── Adapter (plain object) ──────────────────────────────────────

export const voyeglobalAdapter: ProviderAdapter = {
  providerSlug: PROVIDER_SLUG,

  fetchProvider: async () => ({
    name: "VoyeGlobal",
    slug: PROVIDER_SLUG,
    info: "VoyeGlobal provides global eSIM data plans across multiple regions.",
    image: "https://wsacvimipplrlvoyawam.supabase.co/storage/v1/object/public/assets/providers-logos/voyeglobal.png",
    certified: true,
  }),

  fetchPlans: async () => {
    const rawPlans = await fetchFromAPI();
    return rawPlans.map(normalize);
  },
};
