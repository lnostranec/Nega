import { NextRequest } from "next/server";
import { requireAdminUser } from "@/lib/admin";
import { getPrisma, isDbConfigured } from "@/lib/prisma";
import { dbUnavailableResponse } from "@/lib/auth";

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

  const body = (await request.json()) as {
    shopName?: string;
    pointsPercent?: number;
    minOrderForPoints?: number;
  };

  const settings = await getPrisma().siteSettings.upsert({
    where: { id: "default" },
    update: {
      shopName: body.shopName?.trim(),
      pointsPercent:
        body.pointsPercent !== undefined
          ? Math.max(0, Math.min(100, Math.floor(body.pointsPercent)))
          : undefined,
      minOrderForPoints:
        body.minOrderForPoints !== undefined
          ? Math.max(0, Math.floor(body.minOrderForPoints))
          : undefined,
    },
    create: {
      id: "default",
      shopName: body.shopName?.trim() || "Nega",
      pointsPercent: body.pointsPercent ?? 5,
      minOrderForPoints: body.minOrderForPoints ?? 0,
    },
  });

  return Response.json({ settings });
}
