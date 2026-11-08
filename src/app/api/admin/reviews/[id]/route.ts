import { NextRequest } from "next/server";
import { requireAdminUser } from "@/lib/admin";
import { deleteAdminReview, setAdminReviewActive } from "@/lib/admin-reviews";
import { dbUnavailableResponse } from "@/lib/auth";
import { isDbConfigured } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  if (!isDbConfigured()) return dbUnavailableResponse();
  const admin = await requireAdminUser();
  if (admin instanceof Response) return admin;

  const { id } = await params;

  let body: { isActive?: boolean };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  if (typeof body.isActive !== "boolean") {
    return Response.json({ error: "Не указан статус" }, { status: 400 });
  }

  try {
    await setAdminReviewActive(id, body.isActive, admin.id);
    return Response.json({ ok: true, isActive: body.isActive });
  } catch {
    return Response.json({ error: "Отзыв не найден" }, { status: 404 });
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  if (!isDbConfigured()) return dbUnavailableResponse();
  const admin = await requireAdminUser();
  if (admin instanceof Response) return admin;

  const { id } = await params;

  try {
    await deleteAdminReview(id, admin.id);
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Отзыв не найден" }, { status: 404 });
  }
}
