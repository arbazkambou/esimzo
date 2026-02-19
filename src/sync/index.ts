import { AiraloAdapter } from "./adapters/airalo.adapter";
import { SyncEngine } from "./sync-engine";
import type { ProviderAdapter } from "./types";

// ─── Adapter Registry ────────────────────────────────────────────
// Add new adapters here as you build them.

const adapters: ProviderAdapter[] = [
  new AiraloAdapter(),
  // new YesimAdapter(),
];

// ─── Export a ready-to-use engine ────────────────────────────────

export const syncEngine = new SyncEngine(adapters);

// Re-export types
export type { SyncResult, ProviderAdapter } from "./types";
