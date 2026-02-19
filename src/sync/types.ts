// ─── Normalized shapes (what adapters output) ────────────────────

export interface NormalizedProvider {
  name: string;
  slug: string;
  info: string | null;
  image: string | null;
  certified: boolean;
}

export interface NormalizedPlan {
  name: string;
  slug: string;

  // Pricing
  usdPrice: number;
  prices: Record<string, unknown>;
  priceInfo: string | null;

  // Data & Validity
  capacity: number; // in MB
  capacityInfo: string | null;
  period: number; // in days
  validityInfo: string | null;

  // Speed
  speedLimit: number | null;
  reducedSpeed: number | null;
  possibleThrottling: boolean;
  isLowLatency: boolean;

  // Features
  has5G: boolean;
  tethering: boolean;
  canTopUp: boolean;
  phoneNumber: boolean;
  subscription: boolean;
  subscriptionPeriod: number | null;
  payAsYouGo: boolean;
  newUserOnly: boolean;
  isConsecutive: boolean;
  eKYC: boolean | null;

  // Complex / Nested
  telephony: unknown | null;
  coverages: unknown[];
  internetBreakouts: unknown[];

  // Meta
  additionalInfo: string | null;
}

// ─── Adapter interface ───────────────────────────────────────────

export interface ProviderAdapter {
  /** Unique slug for this provider (e.g. "airalo") */
  providerSlug: string;

  /** Fetch and return normalized provider info */
  fetchProvider(): Promise<NormalizedProvider>;

  /** Fetch all plans and return them normalized */
  fetchPlans(): Promise<NormalizedPlan[]>;
}

// ─── Sync result (returned by SyncEngine) ────────────────────────

export interface SyncResult {
  provider: string;
  plansInserted: number;
  plansDeleted: number;
  durationMs: number;
  error?: string;
}
