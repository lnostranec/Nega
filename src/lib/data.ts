import { CATALOG_CATEGORIES } from "./catalog";
import { demoToPageProduct, getDemoProductBySlug } from "./demo-products";
import { getPrisma, isDbConfigured } from "./prisma";

export async function getCollections() {
  if (!isDbConfigured()) return [];
  return getPrisma().collection.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
}

export async function getCatalogCategories() {
  if (!isDbConfigured()) {
    return CATALOG_CATEGORIES.map((c) => ({ name: c.name, slug: c.slug }));
  }

  const collections = await getCollections();
  return [
    { name: "Все товары", slug: "" },
    ...collections.map((c) => ({ name: c.name, slug: c.slug })),
  ];
}

export async function getCollectionBySlug(slug: string) {
  if (!isDbConfigured()) return null;
  return getPrisma().collection.findUnique({
    where: { slug, isActive: true },
    include: {
      products: {
        include: {
          product: {
            include: {
              images: { orderBy: { sortOrder: "asc" }, take: 1 },
            },
          },
        },
      },
    },
  });
}

export async function getProducts(options?: {
  collectionSlug?: string;
  search?: string;
  limit?: number;
  excludeSlug?: string;
}) {
  if (!isDbConfigured()) return [];

  const where = {
    isActive: true,
    ...(options?.excludeSlug && { slug: { not: options.excludeSlug } }),
    ...(options?.search && {
      OR: [
        { name: { contains: options.search, mode: "insensitive" as const } },
        {
          description: { contains: options.search, mode: "insensitive" as const },
        },
      ],
    }),
    ...(options?.collectionSlug && {
      collections: {
        some: {
          collection: { slug: options.collectionSlug, isActive: true },
        },
      },
    }),
  };

  return getPrisma().product.findMany({
    where,
    include: {
      images: { orderBy: { sortOrder: "asc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
    take: options?.limit,
  });
}

export async function getProductBySlug(slug: string) {
  if (isDbConfigured()) {
    const product = await getPrisma().product.findUnique({
      where: { slug, isActive: true },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        variants: { orderBy: [{ color: "asc" }, { size: "asc" }] },
        collections: { include: { collection: true } },
      },
    });
    if (product) return product;
  }

  const demo = getDemoProductBySlug(slug);
  return demo ? demoToPageProduct(demo) : null;
}

export async function getSiteSettings() {
  if (!isDbConfigured()) return null;
  return getPrisma().siteSettings.findUnique({ where: { id: "default" } });
}

export async function getAdminStats() {
  if (!isDbConfigured()) {
    return { productsCount: 0, ordersCount: 0, usersCount: 0, pendingOrders: 0 };
  }

  const [productsCount, ordersCount, usersCount, pendingOrders] =
    await Promise.all([
      getPrisma().product.count(),
      getPrisma().order.count(),
      getPrisma().user.count(),
      getPrisma().order.count({ where: { status: "PENDING" } }),
    ]);

  return { productsCount, ordersCount, usersCount, pendingOrders };
}
