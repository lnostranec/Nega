import { NextRequest } from "next/server";
import { requireAdminUser } from "@/lib/admin";
import {
  createAdminSetAddon,
  listAdminSetAddons,
  type AdminSetAddonDraftInput,
} from "@/lib/admin-set-addons";
import { dbUnavailableResponse } from "@/lib/auth";
import { isDbConfigured } from "@/lib/prisma";

export async function GET() {
  if (!isDbConfigured()) return dbUnavailableResponse();
  const admin = await requireAdminUser();
  if (admin instanceof Response) return admin;

  const items = await listAdminSetAddons();
  return Response.json({ items });
}

export async function POST(request: NextRequest) {
  if (!isDbConfigured()) return dbUnavailableResponse();
  const admin = await requireAdminUser();
  if (admin instanceof Response) return admin;

  const body = (await request.json()) as AdminSetAddonDraftInput;

  try {
    const item = await createAdminSetAddon(body);
    return Response.json({ item }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error && error.message === "EMPTY_NAME"
        ? "Укажите название допа"
        : "Не удалось сохранить доп";
    return Response.json({ error: message }, { status: 400 });
  }
}
