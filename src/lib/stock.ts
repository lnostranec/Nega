import type { Prisma } from "@prisma/client";

export async function restoreOrderStock(
  tx: Prisma.TransactionClient,
  items: { variantId: string | null; quantity: number }[],
): Promise<void> {
  const qtyByVariant = new Map<string, number>();

  for (const item of items) {
    if (!item.variantId) continue;
    qtyByVariant.set(
      item.variantId,
      (qtyByVariant.get(item.variantId) ?? 0) + item.quantity,
    );
  }

  for (const [variantId, qty] of qtyByVariant) {
    await tx.productVariant.update({
      where: { id: variantId },
      data: { stock: { increment: qty } },
    });
  }
}
