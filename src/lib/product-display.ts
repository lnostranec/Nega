import { PLACEHOLDER_PRODUCT } from "./placeholders";

export function isWeakImageUrl(url?: string | null): boolean {
  if (!url) return true;
  return (
    url.includes("unsplash.com") ||
    url.endsWith(".svg") ||
    url === PLACEHOLDER_PRODUCT
  );
}

export function resolveProductImageUrl(url?: string | null): string | undefined {
  if (!url || isWeakImageUrl(url)) return undefined;
  return url;
}

type DbProductWithImage = {
  id: string;
  slug: string;
  name: string;
  price: number | { toString(): string };
  comparePrice?: number | { toString(): string } | null;
  images?: { url: string }[];
};

export function toCatalogItem(product: DbProductWithImage) {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    price: Number(product.price),
    comparePrice: product.comparePrice ? Number(product.comparePrice) : null,
    imageUrl: resolveProductImageUrl(product.images?.[0]?.url),
  };
}
