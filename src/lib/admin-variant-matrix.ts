import type { AdminVariantInput } from "./admin-products";
import { SIZES } from "./constants";

export type VariantMatrixState = {
  colors: string[];
  sizes: string[];
  stock: Record<string, number>;
};

function stockKey(color: string, size: string) {
  return `${color}::${size}`;
}

export function variantsToMatrix(variants: AdminVariantInput[]): VariantMatrixState {
  const colorSet = new Set<string>();
  const sizeSet = new Set<string>();
  const stock: Record<string, number> = {};

  for (const variant of variants) {
    const color = variant.color?.trim() || "Без цвета";
    colorSet.add(color);
    sizeSet.add(variant.size);
    stock[stockKey(color, variant.size)] = variant.stock;
  }

  return {
    colors: colorSet.size > 0 ? [...colorSet] : ["Чёрный"],
    sizes: sizeSet.size > 0 ? [...sizeSet] : ["M"],
    stock,
  };
}

export function matrixToVariants(matrix: VariantMatrixState): AdminVariantInput[] {
  return matrix.colors.flatMap((color) =>
    matrix.sizes.map((size) => ({
      size,
      color: color === "Без цвета" ? null : color,
      stock: Math.max(0, matrix.stock[stockKey(color, size)] ?? 0),
    })),
  );
}

export function defaultVariantMatrix(): VariantMatrixState {
  return {
    colors: ["Чёрный"],
    sizes: ["S", "M", "L"],
    stock: {
      [stockKey("Чёрный", "S")]: 5,
      [stockKey("Чёрный", "M")]: 5,
      [stockKey("Чёрный", "L")]: 5,
    },
  };
}

export function allSizes() {
  return [...SIZES];
}

export function getStock(
  matrix: VariantMatrixState,
  color: string,
  size: string,
): number {
  return matrix.stock[stockKey(color, size)] ?? 0;
}

export function setStock(
  matrix: VariantMatrixState,
  color: string,
  size: string,
  value: number,
): VariantMatrixState {
  return {
    ...matrix,
    stock: {
      ...matrix.stock,
      [stockKey(color, size)]: Math.max(0, value),
    },
  };
}

export function toggleSize(
  matrix: VariantMatrixState,
  size: string,
  enabled: boolean,
): VariantMatrixState {
  const order = allSizes();
  const sizes = enabled
    ? [...new Set([...matrix.sizes, size])].sort(
        (a, b) => order.indexOf(a as (typeof order)[number]) - order.indexOf(b as (typeof order)[number]),
      )
    : matrix.sizes.filter((s) => s !== size);

  return { ...matrix, sizes };
}

export function addColor(matrix: VariantMatrixState, color: string): VariantMatrixState {
  const trimmed = color.trim();
  if (!trimmed || matrix.colors.includes(trimmed)) return matrix;

  const stock = { ...matrix.stock };
  for (const size of matrix.sizes) {
    stock[stockKey(trimmed, size)] = 0;
  }

  return {
    colors: [...matrix.colors, trimmed],
    sizes: matrix.sizes,
    stock,
  };
}

export function removeColor(matrix: VariantMatrixState, color: string): VariantMatrixState {
  const stock = { ...matrix.stock };
  for (const size of matrix.sizes) {
    delete stock[stockKey(color, size)];
  }
  return {
    colors: matrix.colors.filter((c) => c !== color),
    sizes: matrix.sizes,
    stock,
  };
}
