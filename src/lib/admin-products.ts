import type { Prisma, VariantPart } from "@prisma/client";
import { getPrisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";
import { DEFAULT_BOTTOM_MODELS } from "@/lib/product-sets";

export type AdminVariantInput = {
  id?: string;
  size: string;
  color: string | null;
  stock: number;
  sku?: string | null;
  part?: VariantPart | "STANDARD" | "TOP" | "BOTTOM";
};

export type AdminBottomModelInput = {
  name: string;
  isActive?: boolean;
  sortOrder?: number;
};

export type AdminSetAddonInput = {
  name: string;
  price: number;
  imageUrl?: string | null;
  note?: string | null;
  isActive?: boolean;
  sortOrder?: number;
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
  bottomModels?: AdminBottomModelInput[];
  setAddons?: AdminSetAddonInput[];
  relatedProductIds?: string[];
};

export type AdminProductOption = {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string | null;
  isActive: boolean;
};

const productInclude = {
  images: { orderBy: { sortOrder: "asc" as const } },
  variants: {
    orderBy: [
      { part: "asc" as const },
      { color: "asc" as const },
      { size: "asc" as const },
    ],
  },
  bottomModels: { orderBy: { sortOrder: "asc" as const } },
  setAddons: { orderBy: { sortOrder: "asc" as const } },
  relatedProducts: {
    orderBy: { sortOrder: "asc" as const },
    include: {
      relatedProduct: {
        select: {
          id: true,
          name: true,
          slug: true,
          isActive: true,
          images: { orderBy: { sortOrder: "asc" as const }, take: 1 },
        },
      },
    },
  },
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

export async function listAdminProductOptions(
  excludeId?: string,
): Promise<AdminProductOption[]> {
  const products = await getPrisma().product.findMany({
    where: excludeId ? { id: { not: excludeId } } : undefined,
    select: {
      id: true,
      name: true,
      slug: true,
      isActive: true,
      images: { orderBy: { sortOrder: "asc" }, take: 1 },
    },
    orderBy: { name: "asc" },
  });

  return products.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    isActive: p.isActive,
    imageUrl: p.images[0]?.url ?? null,
  }));
}

async function ensureUniqueSlug(base: string, excludeId?: string) {
  const prisma = getPrisma();
  const slug = base || "product";
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
  await prisma.productBottomModel.deleteMany({ where: { productId: id } });
  await prisma.productSetAddon.deleteMany({ where: { productId: id } });
  await prisma.productRelated.deleteMany({ where: { productId: id } });
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
  const bottomModels =
    input.bottomModels && input.bottomModels.length > 0
      ? input.bottomModels
      : DEFAULT_BOTTOM_MODELS.map((name, index) => ({
          name,
          isActive: true,
          sortOrder: index,
        }));

  const setAddons = input.setAddons ?? [];
  const relatedProductIds = [
    ...new Set(
      (input.relatedProductIds ?? []).filter(
        (id) => typeof id === "string" && id.length > 0,
      ),
    ),
  ];

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
        part: (variant.part as VariantPart | undefined) ?? "STANDARD",
      })),
    },
    bottomModels: {
      create: bottomModels
        .map((model, index) => ({
          name: model.name.trim(),
          isActive: model.isActive ?? true,
          sortOrder: model.sortOrder ?? index,
        }))
        .filter((model) => model.name.length > 0),
    },
    setAddons: {
      create: setAddons
        .map((addon, index) => ({
          name: addon.name.trim(),
          price: Math.max(0, Number(addon.price) || 0),
          imageUrl: addon.imageUrl?.trim() || null,
          note: addon.note?.trim() || null,
          isActive: addon.isActive ?? true,
          sortOrder: addon.sortOrder ?? index,
        }))
        .filter((addon) => addon.name.length > 0),
    },
    relatedProducts: {
      create: relatedProductIds.map((relatedProductId, index) => ({
        relatedProductId,
        sortOrder: index,
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
  });
}

export async function deleteAdminProduct(id: string) {
  return getPrisma().product.delete({ where: { id } });
}
