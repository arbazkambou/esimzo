import { airaloAdapter } from "./adapters/airalo.adapter";
import { yesimAdapter } from "./adapters/yesim.adapter";
import type { ProviderAdapter } from "./types";

// ─── Adapter Registry ────────────────────────────────────────────
// Add new adapters here as you build them.

export const adapters: ProviderAdapter[] = [
  airaloAdapter,
  yesimAdapter,
];

// Re-export
export { syncOne, syncAll } from "./sync-engine";
export type { SyncResult, ProviderAdapter } from "./types";
