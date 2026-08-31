import { NextRequest } from "next/server";
import { requireAdminUser } from "@/lib/admin";
import {
  deleteAdminHeroSlide,
  updateAdminHeroSlide,
} from "@/lib/admin-hero-slides";
import { dbUnavailableResponse } from "@/lib/auth";
import { isDbConfigured } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

function mapError(error: unknown) {
  if (error instanceof Error && error.message === "NOT_FOUND") {
    return { message: "Слайд не найден", status: 404 };
  }
  if (error instanceof Error && error.message === "MISSING_TITLE") {
    return { message: "Укажите заголовок", status: 400 };
  }
  if (error instanceof Error && error.message === "MISSING_IMAGE") {
    return { message: "Загрузите картинку", status: 400 };
  }
  return { message: "Не удалось сохранить слайд", status: 400 };
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  if (!isDbConfigured()) return dbUnavailableResponse();
  const admin = await requireAdminUser();
  if (admin instanceof Response) return admin;

  const { id } = await context.params;
  const body = await request.json();

  try {
    const slide = await updateAdminHeroSlide(id, body, admin.id);
    return Response.json({ slide });
  } catch (error) {
    const mapped = mapError(error);
    return Response.json({ error: mapped.message }, { status: mapped.status });
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  if (!isDbConfigured()) return dbUnavailableResponse();
  const admin = await requireAdminUser();
  if (admin instanceof Response) return admin;

  const { id } = await context.params;

  try {
    await deleteAdminHeroSlide(id, admin.id);
    return Response.json({ ok: true });
  } catch (error) {
    const mapped = mapError(error);
    return Response.json({ error: mapped.message }, { status: mapped.status });
  }
}
