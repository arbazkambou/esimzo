import type { ProviderAdapter, NormalizedProvider, NormalizedPlan } from "../types";
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
  // Fields we ignore: url, activationPolicy, otherInfo, dataCap, dataUnit, dataCapPer, planType
}

// ─── Config ──────────────────────────────────────────────────────

const PROVIDER_SLUG = "airalo";

// TODO: Replace with real Airalo API endpoint + auth
const AIRALO_API_URL = process.env.AIRALO_API_URL || "https://www.airalo.com/api/plans";

// ─── Adapter ─────────────────────────────────────────────────────

export class AiraloAdapter implements ProviderAdapter {
  providerSlug = PROVIDER_SLUG;

  async fetchProvider(): Promise<NormalizedProvider> {
    return {
      name: "Airalo",
      slug: PROVIDER_SLUG,
      info: "Airalo offers affordable eSIMs for 200+ countries and regions worldwide.",
      image: null,
      certified: true,
    };
  }

  async fetchPlans(): Promise<NormalizedPlan[]> {
    // TODO: Replace with real API call
    // const res = await fetch(`${AIRALO_API_URL}/plans`, {
    //   headers: { Authorization: `Bearer ${AIRALO_API_TOKEN}` },
    // });
    // const rawPlans: AiraloRawPlan[] = await res.json();

    const rawPlans = await this.fetchFromAPI();

    return rawPlans.map((raw) => this.normalize(raw));
  }

  // ── Private ────────────────────────────────────────────────────

  private async fetchFromAPI(): Promise<AiraloRawPlan[]> {
    const res = await fetch(AIRALO_API_URL, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      throw new Error(`Airalo API responded with ${res.status}: ${res.statusText}`);
    }

    return res.json() as Promise<AiraloRawPlan[]>;
  }

  private normalize(raw: AiraloRawPlan): NormalizedPlan {
    const plan = defaultPlan();

    plan.name = raw.planName;
    const capacityMB = convertToMB(raw.capacity, raw.capacityUnit);
    plan.slug = buildPlanSlug(PROVIDER_SLUG, raw.planName, capacityMB, raw.period);

    // Pricing
    plan.usdPrice = raw.price;
    plan.prices = { USD: raw.price, ...raw.prices };

    // Data & Validity
    plan.capacity = convertToMB(raw.capacity, raw.capacityUnit);
    plan.capacityInfo = raw.capacityInfo;
    plan.period = raw.period;

    // Speed
    plan.reducedSpeed = raw.reducedSpeed;

    // Features
    plan.has5G = has5GInCoverages(raw.coverages);
    plan.tethering = true; // Airalo allows tethering by default
    plan.canTopUp = raw.rechargeability;
    plan.phoneNumber = raw.phoneNumber;
    plan.subscription = raw.billingType === "subscription";
    plan.newUserOnly = raw.newUserOnly;
    plan.eKYC = raw.isKycVerify;

    // Complex / Nested
    plan.telephony = raw.telephony;
    plan.coverages = raw.coverages;

    // Meta
    plan.additionalInfo = raw.info ? raw.info.join("\n") : null;

    return plan;
  }
}
