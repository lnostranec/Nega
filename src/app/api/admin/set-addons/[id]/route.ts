import { NextRequest } from "next/server";
import { requireAdminUser } from "@/lib/admin";
import {
  deleteAdminSetAddon,
  updateAdminSetAddon,
  type AdminSetAddonDraftInput,
} from "@/lib/admin-set-addons";
import { dbUnavailableResponse } from "@/lib/auth";
import { isDbConfigured } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  if (!isDbConfigured()) return dbUnavailableResponse();
  const admin = await requireAdminUser();
  if (admin instanceof Response) return admin;

  const { id } = await context.params;
  const body = (await request.json()) as AdminSetAddonDraftInput;

  try {
    const item = await updateAdminSetAddon(id, body);
    return Response.json({ item });
  } catch (error) {
    const message =
      error instanceof Error && error.message === "EMPTY_NAME"
        ? "Укажите название допа"
        : error instanceof Error && error.message === "NOT_FOUND"
          ? "Доп не найден"
          : "Не удалось сохранить доп";
    return Response.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  if (!isDbConfigured()) return dbUnavailableResponse();
  const admin = await requireAdminUser();
  if (admin instanceof Response) return admin;

  const { id } = await context.params;

  try {
    await deleteAdminSetAddon(id);
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Не удалось удалить доп" }, { status: 400 });
  }
}
