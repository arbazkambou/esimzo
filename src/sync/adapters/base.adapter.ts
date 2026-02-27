import { NormalizedPlan } from "../types";

// ─── Shared helpers for all adapters ─────────────────────────────

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Convert data capacity to MB.
 * e.g. convertToMB(1, "GB") → 1024
 */
export function convertToMB(
  value: number,
  unit: string
): number {
  switch (unit.toUpperCase()) {
    case "GB":
      return value * 1024;
    case "MB":
      return value;
    case "TB":
      return value * 1024 * 1024;
    default:
      return value;
  }
}

/**
 * Check if any coverage network includes 5G.
 */
export function has5GInCoverages(
  coverages: Array<{ networks?: Array<{ types?: string[] }> }>
): boolean {
  return coverages.some((c) =>
    c.networks?.some((n) => n.types?.includes("5G"))
  );
}

/**
 * Build a unique plan slug scoped to a provider.
 * e.g. "airalo-17-miles-1-gb-1024mb-3d"
 */
export function buildPlanSlug(
  providerSlug: string,
  planName: string,
  capacityMB?: number,
  periodDays?: number
): string {
  let slug = `${providerSlug}-${slugify(planName)}`;
  if (capacityMB != null) slug += `-${capacityMB}mb`;
  if (periodDays != null) slug += `-${periodDays}d`;
  return slug;
}

/**
 * Create a default empty NormalizedPlan with sensible defaults.
 * Adapters override fields as needed.
 */
export function defaultPlan(): NormalizedPlan {
  return {
    name: "",
    slug: "",
    usdPrice: 0,
    prices: {},
    priceInfo: null,
    capacity: 0,
    capacityInfo: null,
    period: 0,
    validityInfo: null,
    speedLimit: null,
    reducedSpeed: null,
    possibleThrottling: false,
    isLowLatency: false,
    has5G: false,
    tethering: false,
    canTopUp: false,
    phoneNumber: false,
    subscription: false,
    subscriptionPeriod: null,
    payAsYouGo: false,
    newUserOnly: false,
    isConsecutive: false,
    eKYC: null,
    telephony: null,
    coverages: [],
    coverageCount: 0,
    internetBreakouts: [],
    additionalInfo: null,
  };
}
