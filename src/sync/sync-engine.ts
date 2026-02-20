import { prisma } from "../lib/prisma";
import { invalidateCache } from "../lib/cache";
import type { ProviderAdapter, SyncResult } from "./types";

// ─── Deduplicate slugs ───────────────────────────────────────────

const deduplicateSlugs = (
  plans: Array<{ slug: string }>
): void => {
  const counts = new Map<string, number>();

  for (const plan of plans) {
    const count = counts.get(plan.slug) ?? 0;
    if (count > 0) {
      plan.slug = `${plan.slug}-${count + 1}`;
    }
    counts.set(plan.slug, count + 1);
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

        const created = await tx.plan.createMany({
          data: plans.map((plan) => ({
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
            internetBreakouts: plan.internetBreakouts as any,
            additionalInfo: plan.additionalInfo,
            providerId: provider.id,
          })),
        });

        await tx.provider.update({
          where: { id: provider.id },
          data: { planCount: created.count },
        });

        return { deleted: deleted.count, inserted: created.count };
      },
      { timeout: 30_000 } // 30s for large plan sets
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
