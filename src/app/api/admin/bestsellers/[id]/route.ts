import { NextRequest } from "next/server";
import { requireAdminUser } from "@/lib/admin";
import { deleteAdminBestseller } from "@/lib/admin-bestsellers";
import { dbUnavailableResponse } from "@/lib/auth";
import { isDbConfigured } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(_request: NextRequest, context: RouteContext) {
  if (!isDbConfigured()) return dbUnavailableResponse();
  const admin = await requireAdminUser();
  if (admin instanceof Response) return admin;

  const { id } = await context.params;

  try {
    await deleteAdminBestseller(id, admin.id);
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Не удалось удалить" }, { status: 400 });
  }
}
