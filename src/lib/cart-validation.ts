import { getPrisma } from "@/lib/prisma";
import {
  isGiftCertificateVariant,
  parseGiftCertificateNominal,
} from "@/lib/gift-certificate";

export type CartValidateInput = {
  productId: string;
  variantId: string;
  price: number;
  quantity: number;
};

export type CartValidateLine = {
  variantId: string;
  productId: string;
  price: number;
  quantity: number;
  currentPrice: number;
  stock: number | null;
  priceChanged: boolean;
  overStock: boolean;
  unavailable: boolean;
  suggestedQuantity: number;
};

export type CartValidationResult = {
  lines: CartValidateLine[];
  hasIssues: boolean;
  messages: string[];
};

export async function validateCartItems(
  items: CartValidateInput[],
): Promise<CartValidationResult> {
  if (items.length === 0) {
    return { lines: [], hasIssues: false, messages: [] };
  }

  const prisma = getPrisma();
  const lines: CartValidateLine[] = [];
  const messages = new Set<string>();

  for (const item of items) {
    if (isGiftCertificateVariant(item.variantId)) {
      const nominal = parseGiftCertificateNominal(item.variantId);
      const unavailable = nominal === null;
      const priceChanged = nominal !== null && nominal !== item.price;

      if (unavailable) messages.add("Один из товаров больше недоступен");
      if (priceChanged) messages.add("Цены в корзине обновлены");

      lines.push({
        variantId: item.variantId,
        productId: item.productId,
        price: item.price,
        quantity: item.quantity,
        currentPrice: nominal ?? item.price,
        stock: null,
        priceChanged,
        overStock: false,
        unavailable,
        suggestedQuantity: unavailable ? 0 : item.quantity,
      });
      continue;
    }

    const variant = await prisma.productVariant.findUnique({
      where: { id: item.variantId },
      include: {
        product: { select: { price: true, isActive: true, id: true } },
      },
    });

    const unavailable =
      !variant ||
      variant.productId !== item.productId ||
      !variant.product.isActive;

    if (unavailable) {
      messages.add("Один из товаров больше недоступен");
      lines.push({
        variantId: item.variantId,
        productId: item.productId,
        price: item.price,
        quantity: item.quantity,
        currentPrice: item.price,
        stock: 0,
        priceChanged: false,
        overStock: false,
        unavailable: true,
        suggestedQuantity: 0,
      });
      continue;
    }

    const currentPrice = Number(variant.product.price);
    const priceChanged = currentPrice !== item.price;
    const overStock = item.quantity > variant.stock;
    const suggestedQuantity = Math.max(0, Math.min(item.quantity, variant.stock));

    if (priceChanged) messages.add("Цены в корзине обновлены");
    if (overStock) messages.add("Количество скорректировано по остатку на складе");
    if (variant.stock === 0) messages.add("Один из товаров закончился на складе");

    lines.push({
      variantId: item.variantId,
      productId: item.productId,
      price: item.price,
      quantity: item.quantity,
      currentPrice,
      stock: variant.stock,
      priceChanged,
      overStock,
      unavailable: variant.stock === 0,
      suggestedQuantity,
    });
  }

  const hasIssues = lines.some(
    (line) =>
      line.unavailable || line.overStock || line.priceChanged,
  );

  return {
    lines,
    hasIssues,
    messages: [...messages],
  };
}
