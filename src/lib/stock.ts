import type { Prisma } from "@prisma/client";
import { isGiftCertificateVariant } from "@/lib/gift-certificate";
import {
  isSetAddonCartKey,
  isSetCartKey,
  parseSetCartKey,
} from "@/lib/product-sets";

export async function restoreOrderStock(
  tx: Prisma.TransactionClient,
  items: {
    variantId: string | null;
    sourceVariantId?: string | null;
    quantity: number;
  }[],
): Promise<void> {
  const qtyByVariant = new Map<string, number>();

  for (const item of items) {
    const source = item.sourceVariantId ?? item.variantId;
    if (!source) continue;
    if (isSetAddonCartKey(source)) continue;
    // У подарочного сертификата нет складского варианта
    if (isGiftCertificateVariant(source)) continue;

    if (isSetCartKey(source)) {
      const parsed = parseSetCartKey(source);
      if (!parsed) continue;
      qtyByVariant.set(
        parsed.topVariantId,
        (qtyByVariant.get(parsed.topVariantId) ?? 0) + item.quantity,
      );
      qtyByVariant.set(
        parsed.bottomVariantId,
        (qtyByVariant.get(parsed.bottomVariantId) ?? 0) + item.quantity,
      );
      continue;
    }

    qtyByVariant.set(
      source,
      (qtyByVariant.get(source) ?? 0) + item.quantity,
    );
  }

  for (const [variantId, qty] of qtyByVariant) {
    // updateMany вместо update: если вариант успели удалить, возврат остатка
    // не должен ронять отмену заказа.
    await tx.productVariant.updateMany({
      where: { id: variantId },
      data: { stock: { increment: qty } },
    });
  }
}

/**
 * Повторно резервирует остатки по позициям уже созданного заказа.
 * Нужно, когда оплата пришла после истечения резерва и заказ успели отменить:
 * товар к этому моменту уже вернулся на склад.
 * Возвращает список позиций, которых не хватило.
 */
export async function reserveOrderStock(
  tx: Prisma.TransactionClient,
  items: {
    variantId: string | null;
    sourceVariantId?: string | null;
    quantity: number;
  }[],
): Promise<string[]> {
  const qtyByVariant = new Map<string, number>();

  for (const item of items) {
    const source = item.sourceVariantId ?? item.variantId;
    if (!source) continue;
    if (isSetAddonCartKey(source)) continue;
    // У подарочного сертификата нет складского варианта
    if (isGiftCertificateVariant(source)) continue;

    if (isSetCartKey(source)) {
      const parsed = parseSetCartKey(source);
      if (!parsed) continue;
      qtyByVariant.set(
        parsed.topVariantId,
        (qtyByVariant.get(parsed.topVariantId) ?? 0) + item.quantity,
      );
      qtyByVariant.set(
        parsed.bottomVariantId,
        (qtyByVariant.get(parsed.bottomVariantId) ?? 0) + item.quantity,
      );
      continue;
    }

    qtyByVariant.set(source, (qtyByVariant.get(source) ?? 0) + item.quantity);
  }

  const missing: string[] = [];

  for (const [variantId, qty] of qtyByVariant) {
    const updated = await tx.productVariant.updateMany({
      where: { id: variantId, stock: { gte: qty } },
      data: { stock: { decrement: qty } },
    });

    if (updated.count === 0) {
      missing.push(variantId);
    }
  }

  return missing;
}
