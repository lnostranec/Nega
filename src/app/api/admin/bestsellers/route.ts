import { NextRequest } from "next/server";
import { requireAdminUser } from "@/lib/admin";
import {
  addAdminBestseller,
  listAdminBestsellers,
  reorderAdminBestsellers,
} from "@/lib/admin-bestsellers";
import { dbUnavailableResponse } from "@/lib/auth";
import { isDbConfigured } from "@/lib/prisma";

export async function GET() {
  if (!isDbConfigured()) return dbUnavailableResponse();
  const admin = await requireAdminUser();
  if (admin instanceof Response) return admin;

  const items = await listAdminBestsellers();
  return Response.json({ items });
}

export async function POST(request: NextRequest) {
  if (!isDbConfigured()) return dbUnavailableResponse();
  const admin = await requireAdminUser();
  if (admin instanceof Response) return admin;

  const body = (await request.json()) as { productId?: string; ids?: string[] };

  if (Array.isArray(body.ids)) {
    try {
      const items = await reorderAdminBestsellers(body.ids, admin.id);
      return Response.json({ items });
    } catch {
      return Response.json({ error: "Не удалось изменить порядок" }, { status: 400 });
    }
  }

  if (!body.productId) {
    return Response.json({ error: "Выберите товар" }, { status: 400 });
  }

  try {
    const item = await addAdminBestseller(body.productId, admin.id);
    return Response.json({ item }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error && error.message === "ALREADY_ADDED"
        ? "Этот товар уже в бестселлерах"
        : error instanceof Error && error.message === "NOT_FOUND"
          ? "Товар не найден"
          : "Не удалось добавить товар";
    return Response.json({ error: message }, { status: 400 });
  }
}
