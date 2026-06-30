import type { Prisma } from "@prisma/client";
import type { PromoCode, PromoCodeType } from "@prisma/client";
import { getPrisma } from "@/lib/prisma";
import { isGiftCertificateVariant } from "@/lib/gift-certificate";

export type PromoValidationResult = {
  promoCodeId: string;
  code: string;
  type: PromoCodeType;
  discount: number;
  label: string;
};

export function normalizePromoCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}

export function calculatePromoDiscount(
  promo: Pick<PromoCode, "type" | "value">,
  discountableSubtotal: number,
): number {
  if (discountableSubtotal <= 0) return 0;

  if (promo.type === "PERCENT") {
    const percent = Math.max(0, Math.min(100, promo.value));
    return Math.min(
      discountableSubtotal,
      Math.floor((discountableSubtotal * percent) / 100),
    );
  }

  return Math.min(discountableSubtotal, Math.max(0, promo.value));
}

export function getDiscountableSubtotal(
  items: { variantId: string; price: number; quantity: number }[],
): number {
  return items
    .filter((item) => !isGiftCertificateVariant(item.variantId))
    .reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export async function validatePromoCode(
  code: string,
  items: { variantId: string; price: number; quantity: number }[],
): Promise<PromoValidationResult> {
  const normalized = normalizePromoCode(code);
  if (!normalized) {
    throw new Error("PROMO_EMPTY");
  }

  const prisma = getPrisma();
  const promo = await prisma.promoCode.findUnique({
    where: { code: normalized },
  });

  if (!promo || !promo.isActive) {
    throw new Error("PROMO_INVALID");
  }

  if (promo.expiresAt && promo.expiresAt < new Date()) {
    throw new Error("PROMO_EXPIRED");
  }

  if (promo.maxUses !== null && promo.usedCount >= promo.maxUses) {
    throw new Error("PROMO_EXHAUSTED");
  }

  const discountableSubtotal = getDiscountableSubtotal(items);
  if (discountableSubtotal <= 0) {
    throw new Error("PROMO_NO_PRODUCTS");
  }

  if (discountableSubtotal < promo.minOrderAmount) {
    throw new Error("PROMO_MIN_ORDER");
  }

  const discount = calculatePromoDiscount(promo, discountableSubtotal);
  if (discount <= 0) {
    throw new Error("PROMO_INVALID");
  }

  const label =
    promo.type === "PERCENT"
      ? `Скидка ${promo.value}%`
      : `Скидка ${promo.value.toLocaleString("ru-RU")} ₽`;

  return {
    promoCodeId: promo.id,
    code: promo.code,
    type: promo.type,
    discount,
    label,
  };
}

export function promoErrorMessage(code: string): string {
  switch (code) {
    case "PROMO_EMPTY":
      return "Введите промокод";
    case "PROMO_INVALID":
      return "Промокод не найден или недействителен";
    case "PROMO_EXPIRED":
      return "Срок действия промокода истёк";
    case "PROMO_EXHAUSTED":
      return "Промокод уже использован";
    case "PROMO_MIN_ORDER":
      return "Сумма заказа недостаточна для этого промокода";
    case "PROMO_NO_PRODUCTS":
      return "Промокод действует только на товары из каталога";
    default:
      return "Не удалось применить промокод";
  }
}

function randomCodePart(length: number): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < length; i += 1) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

async function generateUniqueGiftCode(
  db: Prisma.TransactionClient | ReturnType<typeof getPrisma>,
): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const code = `GIFT-${randomCodePart(4)}-${randomCodePart(4)}`;
    const existing = await db.promoCode.findUnique({ where: { code } });
    if (!existing) return code;
  }
  return `GIFT-${Date.now().toString().slice(-8)}`;
}

export async function createGiftCertificatePromoCodes(
  orderId: string,
  items: { variantId: string; quantity: number }[],
  tx?: Prisma.TransactionClient,
): Promise<string[]> {
  const db = tx ?? getPrisma();
  const codes: string[] = [];
  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);

  for (const item of items) {
    if (!isGiftCertificateVariant(item.variantId)) continue;

    const parts = item.variantId.split("-");
    const nominal = Number(parts[parts.length - 2]);
    if (!Number.isFinite(nominal) || nominal <= 0) continue;

    for (let i = 0; i < item.quantity; i += 1) {
      const code = await generateUniqueGiftCode(db);
      await db.promoCode.create({
        data: {
          code,
          type: "FIXED",
          value: nominal,
          maxUses: 1,
          expiresAt,
          isGiftCert: true,
          sourceOrderId: orderId,
        },
      });
      codes.push(code);
    }
  }

  return codes;
}
