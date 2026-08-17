export const CATALOG_STYLE_OPTIONS = [
  "Классика",
  "Романтика",
  "Минимализм",
  "Спорт-шик",
  "Винтаж",
] as const;

export const CATALOG_COUNTRY_OPTIONS = [
  "Россия",
  "Италия",
  "Франция",
  "Турция",
  "Китай",
] as const;

export const CATALOG_MATERIAL_OPTIONS = [
  "Хлопок",
  "Кружево",
  "Шёлк",
  "Полиамид",
  "Полиэстер",
  "Вискоза",
  "Микрофибра",
] as const;

export const CATALOG_PATTERN_OPTIONS = [
  "Однотон",
  "Кружево",
  "Принт",
  "Полоска",
  "Геометрия",
] as const;

export type CatalogFacets = {
  priceMin: number;
  priceMax: number;
  colors: string[];
  styles: string[];
  countries: string[];
  materials: string[];
  patterns: string[];
};

export const DEFAULT_CATALOG_FACETS: CatalogFacets = {
  priceMin: 0,
  priceMax: 50000,
  colors: [],
  styles: [...CATALOG_STYLE_OPTIONS],
  countries: [...CATALOG_COUNTRY_OPTIONS],
  materials: [...CATALOG_MATERIAL_OPTIONS],
  patterns: [...CATALOG_PATTERN_OPTIONS],
};

export type CatalogFilterState = {
  sort?: string;
  color?: string;
  inStock?: boolean;
  minPrice?: number;
  maxPrice?: number;
  style?: string;
  country?: string;
  material?: string;
  pattern?: string;
  size?: string;
};

export function countActiveCatalogFilters(filters: CatalogFilterState): number {
  let count = 0;
  if (filters.sort && filters.sort !== "default") count += 1;
  if (filters.color) count += 1;
  if (filters.inStock) count += 1;
  if (filters.minPrice !== undefined) count += 1;
  if (filters.maxPrice !== undefined) count += 1;
  if (filters.style) count += 1;
  if (filters.material) count += 1;
  if (filters.pattern) count += 1;
  if (filters.size) count += 1;
  return count;
}
