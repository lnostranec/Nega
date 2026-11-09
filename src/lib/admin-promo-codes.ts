import type { PromoCode } from "@prisma/client";
import { getPrisma } from "@/lib/prisma";
import { normalizePromoCode } from "@/lib/promo-codes";

export type AdminPromoCodeView = {
  id: string;
  code: string;
  type: PromoCode["type"];
  value: number;
  minOrderAmount: number;
  maxUses: number | null;
  usedCount: number;
  expiresAt: string | null;
  isActive: boolean;
  isGiftCert: boolean;
  /** Заказ, в котором куплен сертификат */
  sourceOrder: { id: string; orderNumber: string } | null;
  createdAt: string;
};

function toView(
  promo: PromoCode,
  sourceOrder: AdminPromoCodeView["sourceOrder"] = null,
): AdminPromoCodeView {
  return {
    id: promo.id,
    code: promo.code,
    type: promo.type,
    value: promo.value,
    minOrderAmount: promo.minOrderAmount,
    maxUses: promo.maxUses,
    usedCount: promo.usedCount,
    expiresAt: promo.expiresAt?.toISOString() ?? null,
    isActive: promo.isActive,
    isGiftCert: promo.isGiftCert,
    sourceOrder,
    createdAt: promo.createdAt.toISOString(),
  };
}

async function findSourceOrder(
  sourceOrderId: string | null,
): Promise<AdminPromoCodeView["sourceOrder"]> {
  if (!sourceOrderId) return null;
  return getPrisma().order.findUnique({
    where: { id: sourceOrderId },
    select: { id: true, orderNumber: true },
  });
}

export async function listAdminPromoCodes(): Promise<AdminPromoCodeView[]> {
  const prisma = getPrisma();
  const promos = await prisma.promoCode.findMany({
    orderBy: [{ isGiftCert: "asc" }, { createdAt: "desc" }],
  });

  const sourceOrderIds = [
    ...new Set(promos.map((promo) => promo.sourceOrderId).filter((id) => id !== null)),
  ];
  const orders = sourceOrderIds.length
    ? await prisma.order.findMany({
        where: { id: { in: sourceOrderIds } },
        select: { id: true, orderNumber: true },
      })
    : [];
  const orderById = new Map(orders.map((order) => [order.id, order]));

  return promos.map((promo) =>
    toView(promo, promo.sourceOrderId ? orderById.get(promo.sourceOrderId) ?? null : null),
  );
}

export type CreatePromoCodeInput = {
  code: string;
  type: "FIXED" | "PERCENT";
  value: number;
  minOrderAmount?: number;
  maxUses?: number | null;
  expiresAt?: string | null;
  isActive?: boolean;
};

export async function createAdminPromoCode(
  input: CreatePromoCodeInput,
): Promise<AdminPromoCodeView> {
  const code = normalizePromoCode(input.code);
  if (!code) {
    throw new Error("INVALID_CODE");
  }

  if (input.type === "PERCENT" && (input.value < 1 || input.value > 100)) {
    throw new Error("INVALID_PERCENT");
  }

  if (input.type === "FIXED" && input.value <= 0) {
    throw new Error("INVALID_VALUE");
  }

  const promo = await getPrisma().promoCode.create({
    data: {
      code,
      type: input.type,
      value: Math.floor(input.value),
      minOrderAmount: Math.max(0, Math.floor(input.minOrderAmount ?? 0)),
      maxUses:
        input.maxUses === null || input.maxUses === undefined
          ? null
          : Math.max(1, Math.floor(input.maxUses)),
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      isActive: input.isActive ?? true,
      isGiftCert: false,
    },
  });

  return toView(promo);
}

export type UpdatePromoCodeInput = {
  code?: string;
  type?: "FIXED" | "PERCENT";
  value?: number;
  minOrderAmount?: number;
  maxUses?: number | null;
  /** Счётчик использований — админ может поправить вручную */
  usedCount?: number;
  expiresAt?: string | null;
  isActive?: boolean;
};

function validatePromoValues(
  type: "FIXED" | "PERCENT",
  value: number,
): void {
  if (type === "PERCENT" && (value < 1 || value > 100)) {
    throw new Error("INVALID_PERCENT");
  }
  if (type === "FIXED" && value <= 0) {
    throw new Error("INVALID_VALUE");
  }
}

export async function updateAdminPromoCode(
  id: string,
  input: UpdatePromoCodeInput,
): Promise<AdminPromoCodeView> {
  const prisma = getPrisma();
  const existing = await prisma.promoCode.findUnique({ where: { id } });

  if (!existing) {
    throw new Error("NOT_FOUND");
  }

  if (existing.isGiftCert) {
    // У сертификата можно только включить / отключить, остальное — только чтение
    const otherFields = Object.entries(input).filter(
      ([key, value]) => key !== "isActive" && value !== undefined,
    );
    if (otherFields.length > 0 || input.isActive === undefined) {
      throw new Error("GIFT_CERT_READONLY");
    }
    const promo = await prisma.promoCode.update({
      where: { id },
      data: { isActive: input.isActive },
    });
    return toView(promo, await findSourceOrder(promo.sourceOrderId));
  }

  const nextType = input.type ?? existing.type;
  const nextValue =
    input.value !== undefined ? Math.floor(input.value) : existing.value;

  validatePromoValues(nextType, nextValue);

  const nextMaxUses =
    input.maxUses === undefined
      ? existing.maxUses
      : input.maxUses === null
        ? null
        : Math.max(1, Math.floor(input.maxUses));

  const nextUsedCount =
    input.usedCount === undefined
      ? existing.usedCount
      : Math.max(0, Math.floor(input.usedCount));

  if (nextMaxUses !== null && nextMaxUses < nextUsedCount) {
    throw new Error("MAX_USES_TOO_LOW");
  }

  let nextCode = existing.code;
  if (input.code !== undefined) {
    const normalized = normalizePromoCode(input.code);
    if (!normalized) {
      throw new Error("INVALID_CODE");
    }
    nextCode = normalized;
  }

  const promo = await prisma.promoCode.update({
    where: { id },
    data: {
      code: nextCode,
      type: nextType,
      value: nextValue,
      minOrderAmount:
        input.minOrderAmount !== undefined
          ? Math.max(0, Math.floor(input.minOrderAmount))
          : undefined,
      maxUses: input.maxUses !== undefined ? nextMaxUses : undefined,
      usedCount: input.usedCount !== undefined ? nextUsedCount : undefined,
      expiresAt:
        input.expiresAt === undefined
          ? undefined
          : input.expiresAt
            ? new Date(input.expiresAt)
            : null,
      isActive: input.isActive,
    },
  });

  return toView(promo);
}

export async function deleteAdminPromoCode(id: string): Promise<void> {
  const prisma = getPrisma();
  const existing = await prisma.promoCode.findUnique({ where: { id } });

  if (!existing) {
    throw new Error("NOT_FOUND");
  }

  if (existing.isGiftCert) {
    throw new Error("GIFT_CERT_READONLY");
  }

  await prisma.promoCode.delete({ where: { id } });
}
