import { NextRequest } from "next/server";
import { requireAdminUser } from "@/lib/admin";
import { getPrisma, isDbConfigured } from "@/lib/prisma";
import { dbUnavailableResponse } from "@/lib/auth";
import { slugify } from "@/lib/slug";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  if (!isDbConfigured()) return dbUnavailableResponse();
  const admin = await requireAdminUser();
  if (admin instanceof Response) return admin;

  const { id } = await params;
  const body = (await request.json()) as {
    name?: string;
    slug?: string;
    description?: string;
    sortOrder?: number;
    isActive?: boolean;
  };

  const collection = await getPrisma().collection.update({
    where: { id },
    data: {
      name: body.name?.trim(),
      slug: body.slug ? slugify(body.slug) : undefined,
      description: body.description?.trim(),
      sortOrder: body.sortOrder,
      isActive: body.isActive,
    },
  });

  return Response.json({ collection });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  if (!isDbConfigured()) return dbUnavailableResponse();
  const admin = await requireAdminUser();
  if (admin instanceof Response) return admin;

  const { id } = await params;

  try {
    await getPrisma().collection.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Не удалось удалить категорию" }, { status: 400 });
  }
}
