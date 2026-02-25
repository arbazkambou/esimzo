import type { ProviderAdapter } from "../types";
import { normalizeSharedPlan, SharedWhiteLabelRawPlan } from "./esimcard.adapter";

// ─── Config ──────────────────────────────────────────────────────

const PROVIDER_SLUG = "yaalo";

// User pasted "https://platform..com..." which was likely a typo for yaalo.com
// We'll use the environment variable or fallback to what they provided conceptually
const YAALO_API_URL =
  process.env.YAALO_API_URL ||
  "https://platform.yaalo.com/api/affiliate/data-plans?api_key=8b8f9938-39b5-445c-8f47-88ecb37addea";

// ─── Fetch raw plans ─────────────────────────────────────────────

const fetchFromAPI = async (): Promise<SharedWhiteLabelRawPlan[]> => {
  const res = await fetch(YAALO_API_URL, {
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(
      `Yaalo API responded with ${res.status}: ${res.statusText}`
    );
  }

  return res.json() as Promise<SharedWhiteLabelRawPlan[]>;
};

// ─── Adapter (plain object) ──────────────────────────────────────

export const yaaloAdapter: ProviderAdapter = {
  providerSlug: PROVIDER_SLUG,

  fetchProvider: async () => ({
    name: "Yaalo",
    slug: PROVIDER_SLUG,
    info: "Yaalo provides affordable international eSIM plans.",
    image: "https://wsacvimipplrlvoyawam.supabase.co/storage/v1/object/public/assets/providers-logos/yaalo.png",
    certified: true,
  }),

  fetchPlans: async () => {
    const rawPlans = await fetchFromAPI();
    return rawPlans.map((plan) => normalizeSharedPlan(plan, PROVIDER_SLUG));
  },
};
