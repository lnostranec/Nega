import { NextRequest } from "next/server";
import { requireAdminUser } from "@/lib/admin";
import { getPrisma, isDbConfigured } from "@/lib/prisma";
import { dbUnavailableResponse } from "@/lib/auth";
import { slugify } from "@/lib/slug";

export async function GET() {
  if (!isDbConfigured()) return dbUnavailableResponse();
  const admin = await requireAdminUser();
  if (admin instanceof Response) return admin;

  const collections = await getPrisma().collection.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { products: true } } },
  });
  return Response.json({ collections });
}

export async function POST(request: NextRequest) {
  if (!isDbConfigured()) return dbUnavailableResponse();
  const admin = await requireAdminUser();
  if (admin instanceof Response) return admin;

  const body = (await request.json()) as {
    name?: string;
    slug?: string;
    description?: string;
    sortOrder?: number;
  };

  if (!body.name?.trim()) {
    return Response.json({ error: "Укажите название" }, { status: 400 });
  }

  const slug = slugify(body.slug || body.name);
  const collection = await getPrisma().collection.create({
    data: {
      name: body.name.trim(),
      slug,
      description: body.description?.trim() || null,
      sortOrder: body.sortOrder ?? 0,
    },
  });

  return Response.json({ collection }, { status: 201 });
}
