import type { Prisma } from "@prisma/client";
import { getPrisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";

export type AdminVariantInput = {
  id?: string;
  size: string;
  color: string | null;
  stock: number;
  sku?: string | null;
};

export type AdminProductInput = {
  name: string;
  slug?: string;
  description?: string;
  composition?: string;
  care?: string;
  style?: string | null;
  country?: string | null;
  material?: string | null;
  price: number;
  comparePrice?: number | null;
  sku?: string | null;
  isActive?: boolean;
  collectionIds: string[];
  imageUrls: string[];
  variants: AdminVariantInput[];
};

const productInclude = {
  images: { orderBy: { sortOrder: "asc" as const } },
  variants: { orderBy: [{ color: "asc" as const }, { size: "asc" as const }] },
  collections: { include: { collection: true } },
};

export async function getAdminProduct(id: string) {
  return getPrisma().product.findUnique({
    where: { id },
    include: productInclude,
  });
}

export async function listAdminProducts() {
  return getPrisma().product.findMany({
    include: {
      images: { orderBy: { sortOrder: "asc" }, take: 1 },
      variants: true,
      collections: { include: { collection: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
}

async function ensureUniqueSlug(base: string, excludeId?: string) {
  const prisma = getPrisma();
  let slug = base || "product";
  let suffix = 0;

  while (true) {
    const candidate = suffix === 0 ? slug : `${slug}-${suffix}`;
    const existing = await prisma.product.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!existing || existing.id === excludeId) return candidate;
    suffix += 1;
  }
}

export async function createAdminProduct(input: AdminProductInput) {
  const prisma = getPrisma();
  const baseSlug = slugify(input.slug || input.name);
  const slug = await ensureUniqueSlug(baseSlug);

  return prisma.product.create({
    data: buildProductData(input, slug),
    include: productInclude,
  });
}

export async function updateAdminProduct(id: string, input: AdminProductInput) {
  const prisma = getPrisma();
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) return null;

  const baseSlug = slugify(input.slug || input.name);
  const slug =
    baseSlug === existing.slug
      ? existing.slug
      : await ensureUniqueSlug(baseSlug, id);

  await prisma.productImage.deleteMany({ where: { productId: id } });
  await prisma.productVariant.deleteMany({ where: { productId: id } });
  await prisma.productCollection.deleteMany({ where: { productId: id } });

  return prisma.product.update({
    where: { id },
    data: buildProductData(input, slug),
    include: productInclude,
  });
}

function buildProductData(
  input: AdminProductInput,
  slug: string,
): Prisma.ProductCreateInput {
  return {
    name: input.name.trim(),
    slug,
    description: input.description?.trim() || null,
    composition: input.composition?.trim() || null,
    care: input.care?.trim() || null,
    style: input.style?.trim() || null,
    country: input.country?.trim() || null,
    material: input.material?.trim() || null,
    price: input.price,
    comparePrice: input.comparePrice ?? null,
    sku: input.sku?.trim() || null,
    isActive: input.isActive ?? true,
    images: {
      create: input.imageUrls
        .map((url) => url.trim())
        .filter(Boolean)
        .map((url, index) => ({
          url,
          alt: input.name,
          sortOrder: index,
        })),
    },
    variants: {
      create: input.variants.map((variant) => ({
        size: variant.size.trim(),
        color: variant.color?.trim() || null,
        stock: Math.max(0, Math.floor(variant.stock)),
        sku: variant.sku?.trim() || null,
      })),
    },
    collections: {
      create: input.collectionIds.map((collectionId) => ({
        collection: { connect: { id: collectionId } },
      })),
    },
  };
}

export async function setAdminProductActive(id: string, isActive: boolean) {
  return getPrisma().product.update({
    where: { id },
    data: { isActive },
    select: { id: true, isActive: true },
  });
}

export async function deleteAdminProduct(id: string) {
  return getPrisma().product.delete({ where: { id } });
}
