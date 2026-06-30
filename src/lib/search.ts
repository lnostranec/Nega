import { getDemoProducts } from "./demo-products";
import { matchesSearchQuery } from "./search-utils";
import { toCatalogItem } from "./product-display";
import { getPrisma, isDbConfigured } from "./prisma";

export type SearchResultItem = {
  id: string;
  slug: string;
  name: string;
  price: number;
  imageUrl?: string;
};

function filterDemoProducts(query: string, limit: number): SearchResultItem[] {
  return getDemoProducts()
    .filter((product) =>
      matchesSearchQuery(
        [product.name, product.description, product.collection.name],
        query,
      ),
    )
    .slice(0, limit)
    .map((product) => ({
      id: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      imageUrl: product.images[0]?.url,
    }));
}

export async function searchProducts(
  query: string,
  limit = 6,
): Promise<SearchResultItem[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  if (!isDbConfigured()) {
    return filterDemoProducts(trimmed, limit);
  }

  const words = trimmed
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);

  const products = await getPrisma().product.findMany({
    where: {
      isActive: true,
      AND: words.map((word) => ({
        OR: [
          { name: { contains: word, mode: "insensitive" as const } },
          { description: { contains: word, mode: "insensitive" as const } },
        ],
      })),
    },
    include: {
      images: { orderBy: { sortOrder: "asc" }, take: 1 },
    },
    take: limit,
    orderBy: { name: "asc" },
  });

  return products.map(toCatalogItem);
}
