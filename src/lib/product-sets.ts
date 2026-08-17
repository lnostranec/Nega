export const SETS_COLLECTION_SLUG = "sets";

/** Размеры верха (лиф) для комплектов */
export const TOP_SIZES = [
  "65A",
  "65B",
  "65C",
  "70A",
  "70B",
  "70C",
  "70D",
  "75A",
  "75B",
  "75C",
  "75D",
  "80A",
  "80B",
  "80C",
  "80D",
  "85A",
  "85B",
  "85C",
  "90A",
  "90B",
] as const;

/** Размеры низа для комплектов */
export const BOTTOM_SIZES = [
  "XXS",
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "XXL",
  "XXXL",
  "4XL",
] as const;

/** Модели низа по умолчанию */
export const DEFAULT_BOTTOM_MODELS = [
  "Классические бразильяно",
  "Классические слипы",
  "Высокие слипы",
  "Классические стринги",
  "Стринги на регуляторах",
  "Высокие бразильяно",
  "Танга",
] as const;

export type VariantPart = "STANDARD" | "TOP" | "BOTTOM";

export function isSetsCollectionSlug(slug: string | null | undefined): boolean {
  return slug === SETS_COLLECTION_SLUG;
}

export function formatSetSizeLabel(
  topSize: string,
  bottomSize: string,
  bottomModel: string,
): string {
  return `верх ${topSize} / низ ${bottomSize} · ${bottomModel}`;
}

/** Корзинный ключ комплекта: set:topVariantId:bottomVariantId:encodedModel */
export function buildSetCartKey(
  topVariantId: string,
  bottomVariantId: string,
  bottomModel: string,
): string {
  return `set:${topVariantId}:${bottomVariantId}:${encodeURIComponent(bottomModel)}`;
}

export function parseSetCartKey(variantId: string): {
  topVariantId: string;
  bottomVariantId: string;
  bottomModel: string;
} | null {
  if (!variantId.startsWith("set:")) return null;
  const rest = variantId.slice(4);
  const first = rest.indexOf(":");
  const second = rest.indexOf(":", first + 1);
  if (first < 0 || second < 0) return null;

  const topVariantId = rest.slice(0, first);
  const bottomVariantId = rest.slice(first + 1, second);
  let bottomModel = "";
  try {
    bottomModel = decodeURIComponent(rest.slice(second + 1));
  } catch {
    return null;
  }

  if (!topVariantId || !bottomVariantId || !bottomModel) return null;
  return { topVariantId, bottomVariantId, bottomModel };
}

export function isSetCartKey(variantId: string): boolean {
  return variantId.startsWith("set:");
}

/** Корзинный ключ допа к комплекту: addon:{addonId} */
export function buildSetAddonCartKey(addonId: string): string {
  return `addon:${addonId}`;
}

export function parseSetAddonCartKey(variantId: string): string | null {
  if (!variantId.startsWith("addon:")) return null;
  const addonId = variantId.slice(6);
  return addonId || null;
}

export function isSetAddonCartKey(variantId: string): boolean {
  return variantId.startsWith("addon:");
}
