import { NextRequest } from "next/server";
import { requireAdminUser } from "@/lib/admin";
import {
  createAdminProduct,
  listAdminProducts,
  type AdminProductInput,
} from "@/lib/admin-products";
import { isDbConfigured } from "@/lib/prisma";
import { dbUnavailableResponse } from "@/lib/auth";

export async function GET() {
  if (!isDbConfigured()) return dbUnavailableResponse();
  const admin = await requireAdminUser();
  if (admin instanceof Response) return admin;

  const products = await listAdminProducts();
  return Response.json({ products });
}

export async function POST(request: NextRequest) {
  if (!isDbConfigured()) return dbUnavailableResponse();
  const admin = await requireAdminUser();
  if (admin instanceof Response) return admin;

  const body = (await request.json()) as AdminProductInput;
  if (!body.name?.trim() || !Number.isFinite(body.price)) {
    return Response.json({ error: "Укажите название и цену" }, { status: 400 });
  }

  const product = await createAdminProduct({
    ...body,
    collectionIds: body.collectionIds ?? [],
    imageUrls: body.imageUrls ?? [],
    variants: body.variants ?? [],
  });

  return Response.json({ product }, { status: 201 });
}
