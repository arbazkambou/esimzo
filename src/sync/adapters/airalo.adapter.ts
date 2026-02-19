import type { ProviderAdapter, NormalizedPlan } from "../types";
import {
  buildPlanSlug,
  convertToMB,
  defaultPlan,
  has5GInCoverages,
} from "./base.adapter";

// ─── Airalo raw API types ────────────────────────────────────────

interface AiraloRawPlan {
  planName: string;
  period: number;
  capacity: number;
  capacityUnit: string;
  price: number;
  currency: string;
  prices: Record<string, string | number>;
  newUserOnly: boolean;
  capacityInfo: string | null;
  coverages: Array<{
    name: string;
    code: string;
    networks: Array<{ name: string; types: string[] }>;
  }>;
  info: string[] | null;
  billingType: string;
  isKycVerify: boolean;
  rechargeability: boolean;
  phoneNumber: boolean;
  reducedSpeed: number | null;
  telephony: {
    dialingCode: string;
    voice: { inbound: boolean; outbound: boolean };
    sms: { inbound: boolean; outbound: boolean };
  } | null;
}

// ─── Config ──────────────────────────────────────────────────────

const PROVIDER_SLUG = "airalo";
const AIRALO_API_URL =
  process.env.AIRALO_API_URL || "https://www.airalo.com/api/plans";

// ─── Fetch raw plans from Airalo ─────────────────────────────────

const fetchFromAPI = async (): Promise<AiraloRawPlan[]> => {
  const res = await fetch(AIRALO_API_URL, {
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(
      `Airalo API responded with ${res.status}: ${res.statusText}`
    );
  }

  return res.json() as Promise<AiraloRawPlan[]>;
};

// ─── Normalize a single Airalo plan to our shape ─────────────────

const normalize = (raw: AiraloRawPlan): NormalizedPlan => {
  const capacityMB = convertToMB(raw.capacity, raw.capacityUnit);

  return {
    ...defaultPlan(),

    name: raw.planName,
    slug: buildPlanSlug(PROVIDER_SLUG, raw.planName, capacityMB, raw.period),

    // Pricing
    usdPrice: raw.price,
    prices: { USD: raw.price, ...raw.prices },

    // Data & Validity
    capacity: capacityMB,
    capacityInfo: raw.capacityInfo,
    period: raw.period,

    // Speed
    reducedSpeed: raw.reducedSpeed,

    // Features
    has5G: has5GInCoverages(raw.coverages),
    tethering: true,
    canTopUp: raw.rechargeability,
    phoneNumber: raw.phoneNumber,
    subscription: raw.billingType === "subscription",
    newUserOnly: raw.newUserOnly,
    eKYC: raw.isKycVerify,

    // Complex / Nested
    telephony: raw.telephony,
    coverages: raw.coverages,

    // Meta
    additionalInfo: raw.info ? raw.info.join("\n") : null,
  };
};

// ─── Adapter (plain object) ──────────────────────────────────────

export const airaloAdapter: ProviderAdapter = {
  providerSlug: PROVIDER_SLUG,

  fetchProvider: async () => ({
    name: "Airalo",
    slug: PROVIDER_SLUG,
    info: "Airalo offers affordable eSIMs for 200+ countries and regions worldwide.",
    image: null,
    certified: true,
  }),

  fetchPlans: async () => {
    const rawPlans = await fetchFromAPI();
    return rawPlans.map(normalize);
  },
};
