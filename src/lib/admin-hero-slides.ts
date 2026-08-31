import { writeAuditLog } from "@/lib/audit";
import { getPrisma } from "@/lib/prisma";

export type HeroSlideInput = {
  title?: string;
  subtitle?: string;
  href?: string;
  imageUrl?: string;
  sortOrder?: number;
  isActive?: boolean;
};

function normalizeHref(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "/catalog";
  if (trimmed.startsWith("/") || /^https?:\/\//i.test(trimmed)) return trimmed;
  return `/${trimmed}`;
}

export function listAdminHeroSlides() {
  return getPrisma().heroSlide.findMany({
    orderBy: { sortOrder: "asc" },
  });
}

export async function createAdminHeroSlide(
  input: HeroSlideInput,
  adminId?: string | null,
) {
  const title = input.title?.trim();
  const imageUrl = input.imageUrl?.trim();
  if (!title) throw new Error("MISSING_TITLE");
  if (!imageUrl) throw new Error("MISSING_IMAGE");

  const last = await getPrisma().heroSlide.findFirst({
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  const slide = await getPrisma().heroSlide.create({
    data: {
      title,
      subtitle: input.subtitle?.trim() ?? "",
      href: normalizeHref(input.href ?? "/catalog"),
      imageUrl,
      sortOrder: input.sortOrder ?? (last?.sortOrder ?? -1) + 1,
      isActive: input.isActive ?? true,
    },
  });

  await writeAuditLog({
    adminId,
    action: "hero_slide.create",
    entityType: "HeroSlide",
    entityId: slide.id,
  });

  return slide;
}

export async function updateAdminHeroSlide(
  id: string,
  input: HeroSlideInput,
  adminId?: string | null,
) {
  const existing = await getPrisma().heroSlide.findUnique({ where: { id } });
  if (!existing) throw new Error("NOT_FOUND");

  const slide = await getPrisma().heroSlide.update({
    where: { id },
    data: {
      title: input.title?.trim(),
      subtitle: input.subtitle?.trim(),
      href: input.href !== undefined ? normalizeHref(input.href) : undefined,
      imageUrl: input.imageUrl?.trim(),
      sortOrder: input.sortOrder,
      isActive: input.isActive,
    },
  });

  await writeAuditLog({
    adminId,
    action: "hero_slide.update",
    entityType: "HeroSlide",
    entityId: slide.id,
  });

  return slide;
}

export async function deleteAdminHeroSlide(
  id: string,
  adminId?: string | null,
) {
  const existing = await getPrisma().heroSlide.findUnique({ where: { id } });
  if (!existing) throw new Error("NOT_FOUND");

  await getPrisma().heroSlide.delete({ where: { id } });
  await writeAuditLog({
    adminId,
    action: "hero_slide.delete",
    entityType: "HeroSlide",
    entityId: id,
  });
}

export async function reorderAdminHeroSlides(
  ids: string[],
  adminId?: string | null,
) {
  if (ids.length === 0) throw new Error("EMPTY_ORDER");

  await getPrisma().$transaction(
    ids.map((id, index) =>
      getPrisma().heroSlide.update({
        where: { id },
        data: { sortOrder: index },
      }),
    ),
  );

  await writeAuditLog({
    adminId,
    action: "hero_slide.reorder",
    entityType: "HeroSlide",
    meta: { ids },
  });

  return listAdminHeroSlides();
}
