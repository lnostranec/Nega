import { CATALOG_CATEGORIES } from "./catalog";
import { demoToPageProduct, getDemoProductBySlug } from "./demo-products";
import { getPrisma, isDbAvailable } from "./prisma";

export async function getCollections() {
  if (!(await isDbAvailable())) return [];
  return getPrisma().collection.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
}

export async function getCatalogCategories() {
  if (!(await isDbAvailable())) {
    return CATALOG_CATEGORIES.map((c) => ({ name: c.name, slug: c.slug }));
  }

  const collections = await getCollections();
  return [
    { name: "Все товары", slug: "" },
    ...collections.map((c) => ({ name: c.name, slug: c.slug })),
  ];
}

export async function getCollectionBySlug(slug: string) {
  if (!(await isDbAvailable())) return null;
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
  if (!(await isDbAvailable())) return [];

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
  if (await isDbAvailable()) {
    const product = await getPrisma().product.findUnique({
      where: { slug, isActive: true },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        variants: {
          orderBy: [
            { part: "asc" },
            { color: "asc" },
            { size: "asc" },
          ],
        },
        bottomModels: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
        },
        setAddons: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
        },
        collections: { include: { collection: true } },
      },
    });
    if (product) return product;
  }

  const demo = getDemoProductBySlug(slug);
  return demo ? demoToPageProduct(demo) : null;
}

export async function getRelatedProductsForProduct(
  productId: string,
  options?: { excludeSlug?: string; limit?: number; fallbackCollectionSlug?: string },
) {
  const limit = options?.limit ?? 4;

  if (!(await isDbAvailable())) return [];

  const prisma = getPrisma();
  const configured = await prisma.productRelated.findMany({
    where: {
      productId,
      relatedProduct: {
        isActive: true,
        ...(options?.excludeSlug
          ? { slug: { not: options.excludeSlug } }
          : {}),
      },
    },
    orderBy: { sortOrder: "asc" },
    take: limit,
    include: {
      relatedProduct: {
        include: {
          images: { orderBy: { sortOrder: "asc" }, take: 1 },
        },
      },
    },
  });

  if (configured.length > 0) {
    return configured.map((row) => row.relatedProduct);
  }

  const fromCollection = await getProducts({
    collectionSlug: options?.fallbackCollectionSlug,
    excludeSlug: options?.excludeSlug,
    limit,
  });

  if (fromCollection.length > 0) return fromCollection;

  return getProducts({
    excludeSlug: options?.excludeSlug,
    limit,
  });
}

export async function getSiteSettings() {
  if (!(await isDbAvailable())) return null;
  return getPrisma().siteSettings.findUnique({ where: { id: "default" } });
}

export async function getAdminStats() {
  if (!(await isDbAvailable())) {
    return {
      productsCount: 0,
      ordersCount: 0,
      usersCount: 0,
      pendingOrders: 0,
      awaitingPayment: 0,
      paidToday: 0,
      withoutTracking: 0,
      lowStockVariants: 0,
      revenue7d: 0,
    };
  }

  const prisma = getPrisma();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    productsCount,
    ordersCount,
    usersCount,
    pendingOrders,
    awaitingPayment,
    paidToday,
    withoutTracking,
    lowStockVariants,
    revenueAgg,
  ] = await Promise.all([
    prisma.product.count({ where: { isActive: true } }),
    prisma.order.count(),
    prisma.user.count(),
    prisma.order.count({
      where: { status: { in: ["PAID", "PROCESSING"] } },
    }),
    prisma.order.count({
      where: { paymentStatus: "PENDING", status: "PENDING" },
    }),
    prisma.order.count({
      where: {
        paymentStatus: "PAID",
        createdAt: { gte: startOfDay },
      },
    }),
    prisma.order.count({
      where: {
        paymentStatus: "PAID",
        status: { in: ["PAID", "PROCESSING", "SHIPPED"] },
        OR: [{ trackingNumber: null }, { trackingNumber: "" }],
      },
    }),
    prisma.productVariant.count({ where: { stock: { lte: 2 } } }),
    prisma.order.aggregate({
      where: {
        paymentStatus: "PAID",
        createdAt: { gte: weekAgo },
      },
      _sum: { total: true },
    }),
  ]);

  return {
    productsCount,
    ordersCount,
    usersCount,
    pendingOrders,
    awaitingPayment,
    paidToday,
    withoutTracking,
    lowStockVariants,
    revenue7d: Number(revenueAgg._sum.total ?? 0),
  };
}
