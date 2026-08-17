import {
  CATALOG_CATEGORIES,
  CATALOG_PAGE_SIZE,
  type CatalogPageData,
  type CatalogSort,
} from "./catalog";
import {
  CATALOG_COUNTRY_OPTIONS,
  CATALOG_MATERIAL_OPTIONS,
  CATALOG_PATTERN_OPTIONS,
  CATALOG_STYLE_OPTIONS,
  DEFAULT_CATALOG_FACETS,
  type CatalogFacets,
} from "./catalog-facets";
import { getDemoProducts, type DemoProduct } from "./demo-products";
import { toCatalogItem } from "./product-display";
import { getCatalogCategories } from "./data";
import { getPrisma, isDbAvailable } from "./prisma";

type CatalogQuery = {
  collectionSlug?: string;
  search?: string;
  sort?: CatalogSort;
  page?: number;
  color?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  style?: string;
  country?: string;
  material?: string;
  pattern?: string;
  size?: string;
};

function productHasStock(product: DemoProduct): boolean {
  return product.variants.some((variant) => variant.stock > 0);
}

function productHasColor(product: DemoProduct, color: string): boolean {
  return product.variants.some((variant) => variant.color === color);
}

function filterDemoProducts(
  products: DemoProduct[],
  query: CatalogQuery,
): DemoProduct[] {
  let items = products;

  if (query.collectionSlug) {
    items = items.filter((p) => p.collection.slug === query.collectionSlug);
  }

  if (query.search) {
    const q = query.search.toLowerCase();
    items = items.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.collection.name.toLowerCase().includes(q),
    );
  }

  if (query.size) {
    items = items.filter((p) =>
      p.variants.some(
        (variant) => variant.size.toUpperCase() === query.size!.toUpperCase(),
      ),
    );
  }

  if (query.color) {
    items = items.filter((p) => productHasColor(p, query.color!));
  }

  if (query.inStock) {
    items = items.filter((p) => productHasStock(p));
  }

  if (query.minPrice !== undefined) {
    items = items.filter((p) => p.price >= query.minPrice!);
  }

  if (query.maxPrice !== undefined) {
    items = items.filter((p) => p.price <= query.maxPrice!);
  }

  if (query.style) {
    items = items.filter((p) => p.style === query.style);
  }

  if (query.country) {
    items = items.filter((p) => p.country === query.country);
  }

  if (query.material) {
    items = items.filter((p) => p.material === query.material);
  }

  if (query.pattern) {
    items = items.filter((p) => p.pattern === query.pattern);
  }

  return items;
}

function getDemoFacets(products: DemoProduct[]): CatalogFacets {
  const prices = products.map((p) => p.price);
  const colors = [
    ...new Set(
      products.flatMap((p) =>
        p.variants.map((v) => v.color).filter(Boolean) as string[],
      ),
    ),
  ].sort((a, b) => a.localeCompare(b, "ru"));

  return {
    priceMin: prices.length ? Math.min(...prices) : 0,
    priceMax: prices.length ? Math.max(...prices) : 50000,
    colors,
    styles: [...CATALOG_STYLE_OPTIONS],
    countries: [...CATALOG_COUNTRY_OPTIONS],
    materials: [...CATALOG_MATERIAL_OPTIONS],
    patterns: [...CATALOG_PATTERN_OPTIONS],
  };
}

function sortCatalogItems<T extends { price: number; name: string }>(
  items: T[],
  sort: CatalogSort,
): T[] {
  const list = [...items];
  switch (sort) {
    case "price-asc":
      return list.sort((a, b) => a.price - b.price);
    case "price-desc":
      return list.sort((a, b) => b.price - a.price);
    case "new":
      return list.reverse();
    case "popular":
      return list.sort((a, b) => a.name.localeCompare(b.name, "ru"));
    default:
      return list;
  }
}

function paginate<T>(items: T[], page: number) {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / CATALOG_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * CATALOG_PAGE_SIZE;

  return {
    items: items.slice(start, start + CATALOG_PAGE_SIZE),
    total,
    page: safePage,
    totalPages,
  };
}

function getDemoCatalogPageData(
  query: CatalogQuery,
  page: number,
  sort: CatalogSort,
): CatalogPageData {
  const allDemo = getDemoProducts();
  const facets = getDemoFacets(allDemo);
  const demoProducts = filterDemoProducts(allDemo, query);
  let items = demoProducts.map((demo) => ({
    id: demo.id,
    slug: demo.slug,
    name: demo.name,
    price: demo.price,
    comparePrice: demo.comparePrice,
    imageUrl: demo.images[0]?.url,
  }));

  items = sortCatalogItems(items, sort);
  const paginated = paginate(items, page);

  return {
    products: paginated.items,
    total: paginated.total,
    page: paginated.page,
    perPage: CATALOG_PAGE_SIZE,
    totalPages: paginated.totalPages,
    categories: CATALOG_CATEGORIES.map((c) => ({
      name: c.name,
      slug: c.slug,
    })),
    facets,
  };
}

function prismaOrderBy(sort: CatalogSort) {
  switch (sort) {
    case "price-asc":
      return { price: "asc" as const };
    case "price-desc":
      return { price: "desc" as const };
    case "new":
      return { createdAt: "desc" as const };
    case "popular":
      return { name: "asc" as const };
    default:
      return { createdAt: "desc" as const };
  }
}

function buildVariantFilter(query: CatalogQuery) {
  const filter: {
    color?: string;
    size?: { equals: string; mode: "insensitive" };
    stock?: { gt: number };
  } = {};

  if (query.color) filter.color = query.color;
  if (query.size) {
    filter.size = { equals: query.size, mode: "insensitive" };
  }
  if (query.inStock) filter.stock = { gt: 0 };

  return Object.keys(filter).length > 0 ? filter : null;
}

function buildProductWhere(query: CatalogQuery) {
  const priceFilter: { gte?: number; lte?: number } = {};
  if (query.minPrice !== undefined) priceFilter.gte = query.minPrice;
  if (query.maxPrice !== undefined) priceFilter.lte = query.maxPrice;

  const variantFilter = buildVariantFilter(query);

  return {
    isActive: true,
    ...(query.collectionSlug && {
      collections: {
        some: {
          collection: { slug: query.collectionSlug, isActive: true },
        },
      },
    }),
    ...(query.search && {
      OR: [
        { name: { contains: query.search, mode: "insensitive" as const } },
        {
          description: { contains: query.search, mode: "insensitive" as const },
        },
      ],
    }),
    ...(variantFilter && { variants: { some: variantFilter } }),
    ...(Object.keys(priceFilter).length > 0 && { price: priceFilter }),
    ...(query.style && { style: query.style }),
    ...(query.country && { country: query.country }),
    ...(query.material && { material: query.material }),
    ...(query.pattern && { pattern: query.pattern }),
  };
}

async function getDbFacets(collectionSlug?: string): Promise<CatalogFacets> {
  const prisma = getPrisma();
  const baseWhere = {
    isActive: true,
    ...(collectionSlug && {
      collections: {
        some: {
          collection: { slug: collectionSlug, isActive: true },
        },
      },
    }),
  };

  const [priceAgg, colorRows, styleRows, countryRows, materialRows, patternRows] =
    await Promise.all([
      prisma.product.aggregate({
        where: baseWhere,
        _min: { price: true },
        _max: { price: true },
      }),
      prisma.productVariant.findMany({
        where: {
          product: baseWhere,
          color: { not: null },
        },
        select: { color: true },
        distinct: ["color"],
      }),
      prisma.product.findMany({
        where: { ...baseWhere, style: { not: null } },
        select: { style: true },
        distinct: ["style"],
      }),
      prisma.product.findMany({
        where: { ...baseWhere, country: { not: null } },
        select: { country: true },
        distinct: ["country"],
      }),
      prisma.product.findMany({
        where: { ...baseWhere, material: { not: null } },
        select: { material: true },
        distinct: ["material"],
      }),
      prisma.product.findMany({
        where: { ...baseWhere, pattern: { not: null } },
        select: { pattern: true },
        distinct: ["pattern"],
      }),
    ]);

  return {
    priceMin: priceAgg._min.price ? Number(priceAgg._min.price) : 0,
    priceMax: priceAgg._max.price ? Number(priceAgg._max.price) : 50000,
    colors: colorRows
      .map((row) => row.color)
      .filter(Boolean)
      .sort((a, b) => a!.localeCompare(b!, "ru")) as string[],
    styles:
      styleRows.length > 0
        ? (styleRows.map((r) => r.style!).sort() as string[])
        : [...CATALOG_STYLE_OPTIONS],
    countries:
      countryRows.length > 0
        ? (countryRows.map((r) => r.country!).sort() as string[])
        : [...CATALOG_COUNTRY_OPTIONS],
    materials:
      materialRows.length > 0
        ? (materialRows.map((r) => r.material!).sort() as string[])
        : [...CATALOG_MATERIAL_OPTIONS],
    patterns:
      patternRows.length > 0
        ? (patternRows.map((r) => r.pattern!).sort() as string[])
        : [...CATALOG_PATTERN_OPTIONS],
  };
}

async function getDbCatalogPageData(
  query: CatalogQuery,
  page: number,
  sort: CatalogSort,
): Promise<CatalogPageData> {
  const prisma = getPrisma();
  const where = buildProductWhere(query);

  const [total, products, categories, facets] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      include: {
        images: { orderBy: { sortOrder: "asc" }, take: 1 },
      },
      orderBy: prismaOrderBy(sort),
      skip: (page - 1) * CATALOG_PAGE_SIZE,
      take: CATALOG_PAGE_SIZE,
    }),
    getCatalogCategories(),
    getDbFacets(query.collectionSlug),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / CATALOG_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  return {
    products: products.map(toCatalogItem),
    total,
    page: safePage,
    perPage: CATALOG_PAGE_SIZE,
    totalPages,
    categories,
    facets,
  };
}

export async function getCatalogPageData(
  query: CatalogQuery,
): Promise<CatalogPageData> {
  const page = Math.max(1, query.page ?? 1);
  const sort = query.sort ?? "default";

  if (await isDbAvailable()) {
    try {
      return await getDbCatalogPageData(query, page, sort);
    } catch {
      return getDemoCatalogPageData(query, page, sort);
    }
  }

  return getDemoCatalogPageData(query, page, sort);
}

export { DEFAULT_CATALOG_FACETS };
