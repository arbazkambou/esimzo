import cron from "node-cron";
import { adapters, syncAll } from "../sync";

// ─── Sync Scheduler ──────────────────────────────────────────────
// Runs syncAll twice a day: at midnight (00:00) and noon (12:00).

const SYNC_SCHEDULE = process.env.SYNC_CRON || "0 0,12 * * *";

export const startSyncScheduler = () => {
  cron.schedule(SYNC_SCHEDULE, async () => {
    console.log(`⏰ [cron] Scheduled sync started at ${new Date().toISOString()}`);

    const results = await syncAll(adapters);

    const summary = results
      .map((r) =>
        r.error
          ? `❌ ${r.provider}: ${r.error}`
          : `✅ ${r.provider}: ${r.plansInserted} plans (${r.durationMs}ms)`
      )
      .join("\n");

    console.log(`⏰ [cron] Sync complete:\n${summary}`);
  });

  console.log(`⏰ [cron] Sync scheduler active — schedule: "${SYNC_SCHEDULE}"`);
};
