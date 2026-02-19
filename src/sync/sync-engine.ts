import { prisma } from "../lib/prisma";
import type { Prisma } from "@prisma/client";
import type { ProviderAdapter, SyncResult } from "./types";

// ─── Sync Engine ─────────────────────────────────────────────────

export class SyncEngine {
  constructor(private adapters: ProviderAdapter[]) {}

  /**
   * Run sync for all registered adapters.
   * Returns a result for each adapter.
   */
  async runAll(): Promise<SyncResult[]> {
    const results: SyncResult[] = [];

    for (const adapter of this.adapters) {
      const result = await this.runOne(adapter);
      results.push(result);
    }

    return results;
  }

  /**
   * Run sync for a single adapter.
   * Uses a transaction: delete all old plans → insert new ones.
   */
  async runOne(adapter: ProviderAdapter): Promise<SyncResult> {
    const start = Date.now();

    try {
      // 1. Fetch provider info + plans
      const [providerData, plans] = await Promise.all([
        adapter.fetchProvider(),
        adapter.fetchPlans(),
      ]);

      // 2. Upsert provider (get or create)
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

      // 3. Transaction: delete old plans → insert new ones → update planCount
      const result = await prisma.$transaction(async (tx) => {
        // Delete all existing plans for this provider
        const deleted = await tx.plan.deleteMany({
          where: { providerId: provider.id },
        });

        // Deduplicate slugs (append -2, -3 etc. for collisions)
        const slugCounts = new Map<string, number>();
        for (const plan of plans) {
          const count = slugCounts.get(plan.slug) ?? 0;
          if (count > 0) {
            plan.slug = `${plan.slug}-${count + 1}`;
          }
          slugCounts.set(plan.slug, count + 1);
        }

        // Insert all new plans
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

        // Update provider plan count
        await tx.provider.update({
          where: { id: provider.id },
          data: { planCount: created.count },
        });

        return { deleted: deleted.count, inserted: created.count };
      });

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
  }
}
