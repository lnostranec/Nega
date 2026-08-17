import { NextRequest } from "next/server";
import { requireAdminUser } from "@/lib/admin";
import { getPrisma, isDbConfigured } from "@/lib/prisma";
import { dbUnavailableResponse } from "@/lib/auth";

function intOrUndef(value: unknown): number | undefined {
  if (value === undefined) return undefined;
  return Math.max(0, Math.floor(Number(value) || 0));
}

function percentOrUndef(value: unknown): number | undefined {
  if (value === undefined) return undefined;
  return Math.max(0, Math.min(100, Math.floor(Number(value) || 0)));
}

export async function GET() {
  if (!isDbConfigured()) return dbUnavailableResponse();
  const admin = await requireAdminUser();
  if (admin instanceof Response) return admin;

  const settings = await getPrisma().siteSettings.findUnique({
    where: { id: "default" },
  });
  return Response.json({ settings });
}

export async function PATCH(request: NextRequest) {
  if (!isDbConfigured()) return dbUnavailableResponse();
  const admin = await requireAdminUser();
  if (admin instanceof Response) return admin;

  const body = (await request.json()) as Record<string, unknown>;

  const freeDeliveryFrom =
    body.freeDeliveryFrom === null || body.freeDeliveryFrom === ""
      ? null
      : body.freeDeliveryFrom !== undefined
        ? Math.max(0, Math.floor(Number(body.freeDeliveryFrom) || 0))
        : undefined;

  const settings = await getPrisma().siteSettings.upsert({
    where: { id: "default" },
    update: {
      shopName:
        typeof body.shopName === "string" ? body.shopName.trim() : undefined,
      pointsPercent: percentOrUndef(body.pointsPercent),
      minOrderForPoints: intOrUndef(body.minOrderForPoints),
      cdekPvzBaseCost: intOrUndef(body.cdekPvzBaseCost),
      cdekCourierBaseCost: intOrUndef(body.cdekCourierBaseCost),
      yandexDeliveryCost: intOrUndef(body.yandexDeliveryCost),
      freeDeliveryFrom,
      loyaltyThreshold1: intOrUndef(body.loyaltyThreshold1),
      loyaltyPercent1: percentOrUndef(body.loyaltyPercent1),
      loyaltyThreshold2: intOrUndef(body.loyaltyThreshold2),
      loyaltyPercent2: percentOrUndef(body.loyaltyPercent2),
      loyaltyThreshold3: intOrUndef(body.loyaltyThreshold3),
      loyaltyPercent3: percentOrUndef(body.loyaltyPercent3),
    },
    create: {
      id: "default",
      shopName:
        typeof body.shopName === "string" && body.shopName.trim()
          ? body.shopName.trim()
          : "Nega",
      pointsPercent: percentOrUndef(body.pointsPercent) ?? 5,
      minOrderForPoints: intOrUndef(body.minOrderForPoints) ?? 0,
      cdekPvzBaseCost: intOrUndef(body.cdekPvzBaseCost) ?? 350,
      cdekCourierBaseCost: intOrUndef(body.cdekCourierBaseCost) ?? 500,
      yandexDeliveryCost: intOrUndef(body.yandexDeliveryCost) ?? 450,
      freeDeliveryFrom: freeDeliveryFrom ?? 10000,
      loyaltyThreshold1: intOrUndef(body.loyaltyThreshold1) ?? 10000,
      loyaltyPercent1: percentOrUndef(body.loyaltyPercent1) ?? 3,
      loyaltyThreshold2: intOrUndef(body.loyaltyThreshold2) ?? 30000,
      loyaltyPercent2: percentOrUndef(body.loyaltyPercent2) ?? 5,
      loyaltyThreshold3: intOrUndef(body.loyaltyThreshold3) ?? 50000,
      loyaltyPercent3: percentOrUndef(body.loyaltyPercent3) ?? 10,
    },
  });

  return Response.json({ settings });
}
