import { NextRequest } from "next/server";
import { requireAdminUser } from "@/lib/admin";
import {
  createAdminHeroSlide,
  listAdminHeroSlides,
  reorderAdminHeroSlides,
} from "@/lib/admin-hero-slides";
import { dbUnavailableResponse } from "@/lib/auth";
import { isDbConfigured } from "@/lib/prisma";

export async function GET() {
  if (!isDbConfigured()) return dbUnavailableResponse();
  const admin = await requireAdminUser();
  if (admin instanceof Response) return admin;

  const slides = await listAdminHeroSlides();
  return Response.json({ slides });
}

export async function POST(request: NextRequest) {
  if (!isDbConfigured()) return dbUnavailableResponse();
  const admin = await requireAdminUser();
  if (admin instanceof Response) return admin;

  const body = (await request.json()) as {
    title?: string;
    subtitle?: string;
    href?: string;
    imageUrl?: string;
    sortOrder?: number;
    isActive?: boolean;
    ids?: string[];
  };

  if (Array.isArray(body.ids)) {
    try {
      const slides = await reorderAdminHeroSlides(body.ids, admin.id);
      return Response.json({ slides });
    } catch {
      return Response.json({ error: "Не удалось изменить порядок" }, { status: 400 });
    }
  }

  try {
    const slide = await createAdminHeroSlide(body, admin.id);
    return Response.json({ slide }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error && error.message === "MISSING_TITLE"
        ? "Укажите заголовок"
        : error instanceof Error && error.message === "MISSING_IMAGE"
          ? "Загрузите картинку"
          : "Не удалось создать слайд";
    return Response.json({ error: message }, { status: 400 });
  }
}
