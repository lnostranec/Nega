export const CATALOG_CATEGORIES = [
  { name: "Все товары", slug: "" },
  { name: "Комплекты", slug: "sets" },
  { name: "Бюстгальтеры", slug: "bras" },
  { name: "Трусики", slug: "panties" },
  { name: "Пояса", slug: "belts" },
  { name: "Корсеты", slug: "corsets" },
  { name: "Боди", slug: "bodysuits" },
  { name: "Чулки", slug: "stockings" },
  { name: "Аксессуары", slug: "accessories" },
  { name: "Одежда", slug: "homewear" },
] as const;

export const CATALOG_SORT_OPTIONS = [
  { value: "default", label: "Рекомендуем" },
  { value: "popular", label: "Популярные" },
  { value: "new", label: "Новинки" },
  { value: "price-asc", label: "Дешевле" },
  { value: "price-desc", label: "Дороже" },
] as const;

export const CATALOG_FOR_YOU_LABEL = "Фильтры для вас";

export type CatalogSort = (typeof CATALOG_SORT_OPTIONS)[number]["value"];

export const CATALOG_PAGE_SIZE = 12;

export type CatalogProductItem = {
  id: string;
  slug: string;
  name: string;
  price: number;
  comparePrice: number | null;
  imageUrl?: string;
};

export type CatalogPageData = {
  products: CatalogProductItem[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  categories: { name: string; slug: string }[];
  facets: import("./catalog-facets").CatalogFacets;
};

export type CatalogFilters = {
  collection?: string;
  q?: string;
  sort?: string;
  page?: number;
  color?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  style?: string;
  country?: string;
  material?: string;
  pattern?: string;
};

export function buildCatalogUrl(params: CatalogFilters) {
  const search = new URLSearchParams();
  if (params.collection) search.set("collection", params.collection);
  if (params.q) search.set("q", params.q);
  if (params.sort && params.sort !== "default") search.set("sort", params.sort);
  if (params.page && params.page > 1) search.set("page", String(params.page));
  if (params.color) search.set("color", params.color);
  if (params.minPrice !== undefined && params.minPrice > 0) {
    search.set("minPrice", String(params.minPrice));
  }
  if (params.maxPrice !== undefined && params.maxPrice > 0) {
    search.set("maxPrice", String(params.maxPrice));
  }
  if (params.inStock) search.set("inStock", "1");
  if (params.style) search.set("style", params.style);
  if (params.country) search.set("country", params.country);
  if (params.material) search.set("material", params.material);
  if (params.pattern) search.set("pattern", params.pattern);
  const query = search.toString();
  return query ? `/catalog?${query}` : "/catalog";
}
