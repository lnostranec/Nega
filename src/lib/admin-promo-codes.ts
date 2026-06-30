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
  createdAt: string;
};

function toView(promo: PromoCode): AdminPromoCodeView {
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
    createdAt: promo.createdAt.toISOString(),
  };
}

export async function listAdminPromoCodes(): Promise<AdminPromoCodeView[]> {
  const promos = await getPrisma().promoCode.findMany({
    orderBy: [{ isGiftCert: "asc" }, { createdAt: "desc" }],
  });
  return promos.map(toView);
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
    throw new Error("GIFT_CERT_READONLY");
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

  if (nextMaxUses !== null && nextMaxUses < existing.usedCount) {
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
