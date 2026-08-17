import type { AdminVariantInput } from "./admin-products";
import { BOTTOM_SIZES, TOP_SIZES, type VariantPart } from "./product-sets";

export type SetMatrixState = {
  colors: string[];
  topSizes: string[];
  bottomSizes: string[];
  topStock: Record<string, number>;
  bottomStock: Record<string, number>;
};

function stockKey(color: string, size: string) {
  return `${color}::${size}`;
}

export type SetVariantInput = AdminVariantInput & { part: VariantPart };

export function variantsToSetMatrix(variants: SetVariantInput[]): SetMatrixState {
  const colorSet = new Set<string>();
  const topSizeSet = new Set<string>();
  const bottomSizeSet = new Set<string>();
  const topStock: Record<string, number> = {};
  const bottomStock: Record<string, number> = {};

  for (const variant of variants) {
    const color = variant.color?.trim() || "Без цвета";
    colorSet.add(color);
    if (variant.part === "TOP") {
      topSizeSet.add(variant.size);
      topStock[stockKey(color, variant.size)] = variant.stock;
    } else if (variant.part === "BOTTOM") {
      bottomSizeSet.add(variant.size);
      bottomStock[stockKey(color, variant.size)] = variant.stock;
    }
  }

  return {
    colors: colorSet.size > 0 ? [...colorSet] : ["Чёрный"],
    topSizes: topSizeSet.size > 0 ? [...topSizeSet] : ["75B", "80B"],
    bottomSizes: bottomSizeSet.size > 0 ? [...bottomSizeSet] : ["S", "M", "L"],
    topStock,
    bottomStock,
  };
}

export function setMatrixToVariants(matrix: SetMatrixState): SetVariantInput[] {
  const top = matrix.colors.flatMap((color) =>
    matrix.topSizes.map((size) => ({
      size,
      color: color === "Без цвета" ? null : color,
      stock: Math.max(0, matrix.topStock[stockKey(color, size)] ?? 0),
      part: "TOP" as const,
    })),
  );
  const bottom = matrix.colors.flatMap((color) =>
    matrix.bottomSizes.map((size) => ({
      size,
      color: color === "Без цвета" ? null : color,
      stock: Math.max(0, matrix.bottomStock[stockKey(color, size)] ?? 0),
      part: "BOTTOM" as const,
    })),
  );
  return [...top, ...bottom];
}

export function defaultSetMatrix(): SetMatrixState {
  return {
    colors: ["Чёрный"],
    topSizes: ["75B", "80B"],
    bottomSizes: ["S", "M", "L"],
    topStock: {
      [stockKey("Чёрный", "75B")]: 5,
      [stockKey("Чёрный", "80B")]: 5,
    },
    bottomStock: {
      [stockKey("Чёрный", "S")]: 5,
      [stockKey("Чёрный", "M")]: 5,
      [stockKey("Чёрный", "L")]: 5,
    },
  };
}

export function allTopSizes() {
  return [...TOP_SIZES];
}

export function allBottomSizes() {
  return [...BOTTOM_SIZES];
}

export function getSetStock(
  stock: Record<string, number>,
  color: string,
  size: string,
): number {
  return stock[stockKey(color, size)] ?? 0;
}

export function setSetStock(
  matrix: SetMatrixState,
  which: "top" | "bottom",
  color: string,
  size: string,
  value: number,
): SetMatrixState {
  const key = which === "top" ? "topStock" : "bottomStock";
  return {
    ...matrix,
    [key]: {
      ...matrix[key],
      [stockKey(color, size)]: Math.max(0, value),
    },
  };
}

export function toggleSetSize(
  matrix: SetMatrixState,
  which: "top" | "bottom",
  size: string,
  enabled: boolean,
): SetMatrixState {
  const order = which === "top" ? allTopSizes() : allBottomSizes();
  const key = which === "top" ? "topSizes" : "bottomSizes";
  const stockKeyName = which === "top" ? "topStock" : "bottomStock";
  const current = matrix[key];

  const sizes = enabled
    ? [...new Set([...current, size])].sort(
        (a, b) => order.indexOf(a as never) - order.indexOf(b as never),
      )
    : current.filter((s) => s !== size);

  const stock = { ...matrix[stockKeyName] };
  if (!enabled) {
    for (const color of matrix.colors) {
      delete stock[stockKey(color, size)];
    }
  }

  return { ...matrix, [key]: sizes, [stockKeyName]: stock };
}

export function addSetColor(matrix: SetMatrixState, color: string): SetMatrixState {
  const trimmed = color.trim();
  if (!trimmed || matrix.colors.includes(trimmed)) return matrix;

  const topStock = { ...matrix.topStock };
  const bottomStock = { ...matrix.bottomStock };
  for (const size of matrix.topSizes) topStock[stockKey(trimmed, size)] = 0;
  for (const size of matrix.bottomSizes) bottomStock[stockKey(trimmed, size)] = 0;

  return {
    ...matrix,
    colors: [...matrix.colors, trimmed],
    topStock,
    bottomStock,
  };
}

export function removeSetColor(
  matrix: SetMatrixState,
  color: string,
): SetMatrixState {
  const topStock = { ...matrix.topStock };
  const bottomStock = { ...matrix.bottomStock };
  for (const size of matrix.topSizes) delete topStock[stockKey(color, size)];
  for (const size of matrix.bottomSizes) delete bottomStock[stockKey(color, size)];
  return {
    ...matrix,
    colors: matrix.colors.filter((c) => c !== color),
    topStock,
    bottomStock,
  };
}
