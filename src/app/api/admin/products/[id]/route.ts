import { NextRequest } from "next/server";
import { requireAdminUser } from "@/lib/admin";
import {
  deleteAdminProduct,
  getAdminProduct,
  setAdminProductActive,
  updateAdminProduct,
  type AdminProductInput,
} from "@/lib/admin-products";
import { isDbConfigured } from "@/lib/prisma";
import { dbUnavailableResponse } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  if (!isDbConfigured()) return dbUnavailableResponse();
  const admin = await requireAdminUser();
  if (admin instanceof Response) return admin;

  const { id } = await params;
  const product = await getAdminProduct(id);
  if (!product) {
    return Response.json({ error: "Товар не найден" }, { status: 404 });
  }
  return Response.json({ product });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  if (!isDbConfigured()) return dbUnavailableResponse();
  const admin = await requireAdminUser();
  if (admin instanceof Response) return admin;

  const { id } = await params;
  const body = (await request.json()) as Partial<AdminProductInput>;

  if (
    body.isActive !== undefined &&
    body.name === undefined &&
    body.price === undefined
  ) {
    try {
      const product = await setAdminProductActive(id, body.isActive);
      return Response.json({ product });
    } catch {
      return Response.json({ error: "Товар не найден" }, { status: 404 });
    }
  }

  if (!body.name?.trim() || !Number.isFinite(body.price)) {
    return Response.json({ error: "Укажите название и цену" }, { status: 400 });
  }

  const product = await updateAdminProduct(id, {
    ...(body as AdminProductInput),
    collectionIds: body.collectionIds ?? [],
    imageUrls: body.imageUrls ?? [],
    variants: body.variants ?? [],
  });

  if (!product) {
    return Response.json({ error: "Товар не найден" }, { status: 404 });
  }

  return Response.json({ product });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  if (!isDbConfigured()) return dbUnavailableResponse();
  const admin = await requireAdminUser();
  if (admin instanceof Response) return admin;

  const { id } = await params;
  try {
    await deleteAdminProduct(id);
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Не удалось удалить товар" }, { status: 400 });
  }
}
