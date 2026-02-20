import { airaloAdapter } from "./adapters/airalo.adapter";
import { yesimAdapter } from "./adapters/yesim.adapter";
import { voyeglobalAdapter } from "./adapters/voyeglobal.adapter";
import { esimcardAdapter } from "./adapters/esimcard.adapter";
import { yaaloAdapter } from "./adapters/yaalo.adapter";
import type { ProviderAdapter } from "./types";

// ─── Adapter Registry ────────────────────────────────────────────
// Add new adapters here as you build them.

export const adapters: ProviderAdapter[] = [
  airaloAdapter,
  yesimAdapter,
  voyeglobalAdapter,
  esimcardAdapter,
  yaaloAdapter,
];

// Re-export
export { syncOne, syncAll } from "./sync-engine";
export type { SyncResult, ProviderAdapter } from "./types";
