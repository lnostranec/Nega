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

  const name = body.name?.trim();
  if (body.name !== undefined && !name) {
    return Response.json(
      { error: "Название не может быть пустым" },
      { status: 400 },
    );
  }

  try {
    const collection = await getPrisma().collection.update({
      where: { id },
      data: {
        name,
        slug: body.slug ? slugify(body.slug) : undefined,
        description: body.description?.trim(),
        sortOrder: body.sortOrder,
        isActive: body.isActive,
      },
    });

    return Response.json({ collection });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";

    if (message.includes("Unique constraint")) {
      return Response.json(
        { error: "Такой slug уже занят другой категорией" },
        { status: 400 },
      );
    }
    if (message.includes("Record to update not found")) {
      return Response.json({ error: "Категория не найдена" }, { status: 404 });
    }

    console.error("Update collection error:", error);
    return Response.json(
      { error: "Не удалось сохранить категорию" },
      { status: 400 },
    );
  }
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
