import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { asyncHandler, ApiResponse } from "../types";

// ─── GET /api/plans — browse / filter / sort ─────────────────────
//
// Query params:
//   ?country=pk          — filter by country code in coverages
//   ?provider=airalo     — filter by provider slug
//   ?minData=1024        — minimum capacity in MB
//   ?maxData=10240       — maximum capacity in MB
//   ?minPrice=5          — minimum USD price
//   ?maxPrice=30         — maximum USD price
//   ?minDays=7           — minimum validity in days
//   ?maxDays=30          — maximum validity in days
//   ?has5g=true          — only 5G plans
//   ?unlimited=true      — only unlimited plans (capacity = 0)
//   ?sort=price|data|period  (default: price)
//   ?order=asc|desc         (default: asc)
//   ?page=1              — pagination
//   ?limit=20            — items per page (max 100)

export const getPlans = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      country,
      provider,
      minData,
      maxData,
      minPrice,
      maxPrice,
      minDays,
      maxDays,
      has5g,
      unlimited,
      sort = "price",
      order = "asc",
      page = "1",
      limit = "20",
    } = req.query as Record<string, string | undefined>;

    // Pagination
    const pageNum = Math.max(1, parseInt(page || "1", 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit || "20", 10)));
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {};

    // Provider filter
    if (provider) {
      const found = await prisma.provider.findUnique({
        where: { slug: provider },
        select: { id: true },
      });
      if (found) where.providerId = found.id;
    }

    // Price filter
    if (minPrice) where.usdPrice = { ...where.usdPrice, gte: parseFloat(minPrice) };
    if (maxPrice) where.usdPrice = { ...where.usdPrice, lte: parseFloat(maxPrice) };

    // Capacity filter
    if (unlimited === "true") {
      where.capacity = 0;
    } else {
      if (minData) where.capacity = { ...where.capacity, gte: parseInt(minData, 10) };
      if (maxData) where.capacity = { ...where.capacity, lte: parseInt(maxData, 10) };
    }

    // Duration filter
    if (minDays) where.period = { ...where.period, gte: parseInt(minDays, 10) };
    if (maxDays) where.period = { ...where.period, lte: parseInt(maxDays, 10) };

    // Feature filters
    if (has5g === "true") where.has5G = true;

    // Country filter (search inside coverages JSON array)
    if (country) {
      where.coverages = {
        array_contains: [{ code: country.toUpperCase() }],
      };
    }

    // Sort mapping
    const sortMap: Record<string, any> = {
      price: { usdPrice: order },
      data: { capacity: order },
      period: { period: order },
    };
    const orderBy = sortMap[sort || "price"] || { usdPrice: "asc" };

    // Query plans + count in parallel
    const [plans, total] = await Promise.all([
      prisma.plan.findMany({
        where,
        orderBy,
        skip,
        take: limitNum,
        include: {
          provider: {
            select: { name: true, slug: true, image: true },
          },
        },
      }),
      prisma.plan.count({ where }),
    ]);

    const response: ApiResponse = {
      success: true,
      data: plans,
      meta: {
        page: pageNum,
        limit: limitNum,
        total,
      },
    };

    res.json(response);
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
      include: {
        provider: {
          select: { name: true, slug: true, image: true },
        },
      },
    });

    const response: ApiResponse = {
      success: true,
      data: plans,
    };

    res.json(response);
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

    const response: ApiResponse = {
      success: true,
      data: plan,
    };

    res.json(response);
  }
);
