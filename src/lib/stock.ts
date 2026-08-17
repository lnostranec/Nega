import type { Prisma } from "@prisma/client";
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
    await tx.productVariant.update({
      where: { id: variantId },
      data: { stock: { increment: qty } },
    });
  }
}
