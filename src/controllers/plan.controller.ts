import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { asyncHandler, ApiResponse } from "../types";

// ─── Shared: plan SELECT columns for raw SQL queries ─────────────

const PLAN_COLUMNS = `
  p.id,
  p.name,
  p.slug,
  p.usd_price        AS "usdPrice",
  p.prices,
  p.price_info       AS "priceInfo",
  p.capacity,
  p.capacity_info    AS "capacityInfo",
  p.period,
  p.validity_info    AS "validityInfo",
  p.speed_limit      AS "speedLimit",
  p.reduced_speed    AS "reducedSpeed",
  p.possible_throttling AS "possibleThrottling",
  p.is_low_latency   AS "isLowLatency",
  p.has_5g           AS "has5G",
  p.tethering,
  p.can_top_up       AS "canTopUp",
  p.phone_number     AS "phoneNumber",
  p.subscription,
  p.subscription_period AS "subscriptionPeriod",
  p.pay_as_you_go    AS "payAsYouGo",
  p.new_user_only    AS "newUserOnly",
  p.is_consecutive   AS "isConsecutive",
  p.e_kyc            AS "eKYC",
  p.telephony,
  p.coverages,
  p.coverage_count   AS "coverageCount",
  p.internet_breakouts AS "internetBreakouts",
  p.additional_info  AS "additionalInfo",
  p.provider_id      AS "providerId",
  p.created_at       AS "createdAt",
  p.updated_at       AS "updatedAt",
  json_build_object(
    'name', pr.name,
    'slug', pr.slug,
    'image', pr.image
  ) AS provider`;

// ─── Shared: provider include for Prisma queries ─────────────────

const PROVIDER_INCLUDE = {
  provider: {
    select: { name: true, slug: true, image: true },
  },
};

// ─── Shared: resolve provider slug → id ──────────────────────────

async function resolveProviderId(slug: string): Promise<string | null> {
  const found = await prisma.provider.findUnique({
    where: { slug },
    select: { id: true },
  });
  return found?.id ?? null;
}

// ─── GET /api/plans — all plans sorted by price ──────────────────

export const getPlans = asyncHandler(
  async (_req: Request, res: Response) => {
    const plans = await prisma.plan.findMany({
      orderBy: { usdPrice: "asc" },
      include: PROVIDER_INCLUDE,
    });

    res.json({ success: true, data: plans } as ApiResponse);
  }
);

// ─── GET /api/plans/country/:countrySlug ─────────────────────────
// ─── GET /api/plans/country/:countrySlug/provider/:providerSlug ──

export const getCountryPlans = asyncHandler(
  async (req: Request, res: Response) => {
    const countrySlug = req.params.countrySlug as string;
    const providerSlug = req.params.providerSlug as string | undefined;

    const foundCountry = await prisma.country.findUnique({
      where: { slug: countrySlug },
      select: { code: true },
    });

    if (!foundCountry) {
      res.json({ success: true, data: [] } as ApiResponse);
      return;
    }

    const where: any = {
      coverages: { array_contains: [{ code: foundCountry.code }] },
    };

    if (providerSlug) {
      const providerId = await resolveProviderId(providerSlug);
      if (!providerId) {
        res.json({ success: true, data: [] } as ApiResponse);
        return;
      }
      where.providerId = providerId;
    }

    const plans = await prisma.plan.findMany({
      where,
      orderBy: { usdPrice: "asc" },
      include: PROVIDER_INCLUDE,
    });

    res.json({ success: true, data: plans } as ApiResponse);
  }
);

// ─── GET /api/plans/region/:regionSlug ───────────────────────────
// ─── GET /api/plans/region/:regionSlug/provider/:providerSlug ────

export const getRegionPlans = asyncHandler(
  async (req: Request, res: Response) => {
    const regionSlug = req.params.regionSlug as string;
    const providerSlug = req.params.providerSlug as string | undefined;

    const foundRegion = await prisma.region.findUnique({
      where: { slug: regionSlug },
      select: { countries: { select: { code: true } } },
    });

    if (!foundRegion || foundRegion.countries.length === 0) {
      res.json({ success: true, data: [] } as ApiResponse);
      return;
    }

    const regionCodes = foundRegion.countries.map((c) => c.code);
    const minMatch = Math.ceil(regionCodes.length * 0.3);

    // Optional provider filter
    let providerClause = "";
    const params: any[] = [regionCodes, minMatch];

    if (providerSlug) {
      const providerId = await resolveProviderId(providerSlug);
      if (!providerId) {
        res.json({ success: true, data: [] } as ApiResponse);
        return;
      }
      params.push(providerId);
      providerClause = `AND p.provider_id = $3`;
    }

    const plans = await prisma.$queryRawUnsafe<any[]>(
      `SELECT ${PLAN_COLUMNS}
       FROM plans p
       JOIN providers pr ON p.provider_id = pr.id
       WHERE p.coverage_count < 70
         AND (
           SELECT COUNT(*)
           FROM jsonb_array_elements(p.coverages) AS elem
           WHERE elem->>'code' = ANY($1::text[])
         ) >= $2
         ${providerClause}
       ORDER BY p.usd_price ASC`,
      ...params
    );

    res.json({ success: true, data: plans } as ApiResponse);
  }
);

// ─── GET /api/plans/provider/:providerSlug ───────────────────────

export const getProviderPlans = asyncHandler(
  async (req: Request, res: Response) => {
    const providerSlug = req.params.providerSlug as string;

    const providerId = await resolveProviderId(providerSlug);
    if (!providerId) {
      res.json({ success: true, data: [] } as ApiResponse);
      return;
    }

    const plans = await prisma.plan.findMany({
      where: { providerId },
      orderBy: { usdPrice: "asc" },
      include: PROVIDER_INCLUDE,
    });

    res.json({ success: true, data: plans } as ApiResponse);
  }
);

// ─── GET /api/plans/global ───────────────────────────────────────
// ─── GET /api/plans/global/provider/:providerSlug ────────────────

export const getGlobalPlans = asyncHandler(
  async (req: Request, res: Response) => {
    const providerSlug = req.params.providerSlug as string | undefined;

    const where: any = {
      coverageCount: { gte: 70 },
    };

    if (providerSlug) {
      const providerId = await resolveProviderId(providerSlug);
      if (!providerId) {
        res.json({ success: true, data: [] } as ApiResponse);
        return;
      }
      where.providerId = providerId;
    }

    const plans = await prisma.plan.findMany({
      where,
      orderBy: { usdPrice: "asc" },
      include: PROVIDER_INCLUDE,
    });

    res.json({ success: true, data: plans } as ApiResponse);
  }
);

// ─── GET /api/plans/compare?slugs=slug1,slug2 ───────────────────

export const comparePlans = asyncHandler(
  async (req: Request, res: Response) => {
    const slugsParam = req.query.slugs;
    const slugs = typeof slugsParam === "string" ? slugsParam : undefined;

    if (!slugs) {
      const response: ApiResponse = {
        success: false,
        error: "Provide ?slugs=slug1,slug2 (comma-separated, max 5)",
      };
      res.status(400).json(response);
      return;
    }

    const slugList = slugs.split(",").slice(0, 5);

    const plans = await prisma.plan.findMany({
      where: { slug: { in: slugList } },
      include: PROVIDER_INCLUDE,
    });

    res.json({ success: true, data: plans } as ApiResponse);
  }
);

// ─── GET /api/plans/:slug — single plan detail ──────────────────

export const getPlanBySlug = asyncHandler(
  async (req: Request, res: Response) => {
    const slug = req.params.slug as string;

    const plan = await prisma.plan.findUnique({
      where: { slug },
      include: {
        provider: {
          select: { name: true, slug: true, image: true, info: true },
        },
      },
    });

    if (!plan) {
      const response: ApiResponse = {
        success: false,
        error: `Plan "${slug}" not found`,
      };
      res.status(404).json(response);
      return;
    }

    res.json({ success: true, data: plan } as ApiResponse);
  }
);
