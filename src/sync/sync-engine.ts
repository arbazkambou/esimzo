import { prisma } from "../lib/prisma";
import { invalidateCache } from "../lib/cache";
import type { ProviderAdapter, SyncResult } from "./types";

// ─── Deduplicate slugs ───────────────────────────────────────────

const deduplicateSlugs = (
  plans: Array<{ slug: string }>
): void => {
  const seen = new Set<string>();

  for (const plan of plans) {
    let originalSlug = plan.slug;
    let count = 1;

    while (seen.has(plan.slug)) {
      count++;
      plan.slug = `${originalSlug}-${count}`;
    }

    seen.add(plan.slug);
  }
};

// ─── Sync a single provider ──────────────────────────────────────

export const syncOne = async (
  adapter: ProviderAdapter
): Promise<SyncResult> => {
  const start = Date.now();

  try {
    // 1. Fetch provider info + plans in parallel
    const [providerData, plans] = await Promise.all([
      adapter.fetchProvider(),
      adapter.fetchPlans(),
    ]);

    // 2. Upsert provider
    const provider = await prisma.provider.upsert({
      where: { slug: providerData.slug },
      update: {
        name: providerData.name,
        info: providerData.info,
        image: providerData.image,
        certified: providerData.certified,
      },
      create: {
        name: providerData.name,
        slug: providerData.slug,
        info: providerData.info,
        image: providerData.image,
        certified: providerData.certified,
      },
    });

    // 3. Transaction: delete → dedupe slugs → insert → update count
    const result = await prisma.$transaction(
      async (tx) => {
        const deleted = await tx.plan.deleteMany({
          where: { providerId: provider.id },
        });

        deduplicateSlugs(plans);

        // Map raw data to Prisma shape
        const rawDataPayloads = plans.map((plan) => ({
          name: plan.name,
          slug: plan.slug,
          usdPrice: plan.usdPrice,
          prices: plan.prices as any,
          priceInfo: plan.priceInfo,
          capacity: plan.capacity,
          capacityInfo: plan.capacityInfo,
          period: plan.period,
          validityInfo: plan.validityInfo,
          speedLimit: plan.speedLimit,
          reducedSpeed: plan.reducedSpeed,
          possibleThrottling: plan.possibleThrottling,
          isLowLatency: plan.isLowLatency,
          has5G: plan.has5G,
          tethering: plan.tethering,
          canTopUp: plan.canTopUp,
          phoneNumber: plan.phoneNumber,
          subscription: plan.subscription,
          subscriptionPeriod: plan.subscriptionPeriod,
          payAsYouGo: plan.payAsYouGo,
          newUserOnly: plan.newUserOnly,
          isConsecutive: plan.isConsecutive,
          eKYC: plan.eKYC,
          telephony: plan.telephony as any,
          coverages: plan.coverages as any,
          coverageCount: Array.isArray(plan.coverages) ? plan.coverages.length : 0,
          internetBreakouts: plan.internetBreakouts as any,
          additionalInfo: plan.additionalInfo,
          providerId: provider.id,
        }));

        // Batch inserts in chunks of 1000 to prevent OOM errors on small servers (i.e. Render 512MB RAM)
        let insertedCount = 0;
        const chunkSize = 1000;
        for (let i = 0; i < rawDataPayloads.length; i += chunkSize) {
          const chunk = rawDataPayloads.slice(i, i + chunkSize);
          const createdChunk = await tx.plan.createMany({ data: chunk });
          insertedCount += createdChunk.count;
        }

        await tx.provider.update({
          where: { id: provider.id },
          data: { planCount: insertedCount },
        });

        return { deleted: deleted.count, inserted: insertedCount };
      },
      { timeout: 300_000 } // 5 minutes for large plan sets
    );

    console.log(
      `✅ [${adapter.providerSlug}] Synced: ${result.deleted} deleted, ${result.inserted} inserted (${Date.now() - start}ms)`
    );

    return {
      provider: adapter.providerSlug,
      plansInserted: result.inserted,
      plansDeleted: result.deleted,
      durationMs: Date.now() - start,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`❌ [${adapter.providerSlug}] Sync failed: ${message}`);

    return {
      provider: adapter.providerSlug,
      plansInserted: 0,
      plansDeleted: 0,
      durationMs: Date.now() - start,
      error: message,
    };
  }
};

// ─── Sync all registered adapters ────────────────────────────────

export const syncAll = async (
  adapters: ProviderAdapter[]
): Promise<SyncResult[]> => {
  const results: SyncResult[] = [];

  for (const adapter of adapters) {
    const result = await syncOne(adapter);
    results.push(result);
  }

  // Flush cache so fresh data is served
  invalidateCache();

  return results;
};
