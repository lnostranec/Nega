import type { Prisma } from "@prisma/client";
import type { PrismaClient, PromoCode, PromoCodeType } from "@prisma/client";
import { getPrisma } from "@/lib/prisma";
import {
  isGiftCertificateVariant,
  type GiftCertificateView,
} from "@/lib/gift-certificate";

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
  customer: PromoCustomer = {},
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

  await assertPromoNotUsedByCustomer(prisma, promo.id, customer);

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
    case "PROMO_ALREADY_USED":
      return "Вы уже использовали этот промокод";
    case "PROMO_MIN_ORDER":
      return "Сумма заказа недостаточна для этого промокода";
    case "PROMO_NO_PRODUCTS":
      return "Промокод действует только на товары из каталога";
    default:
      return "Не удалось применить промокод";
  }
}

type PromoCustomer = {
  userId?: string | null;
  email?: string | null;
};

/**
 * Промокод можно использовать один раз на покупателя.
 * Считаем только оплаченные заказы: если оплата не прошла, промокод
 * остаётся доступным.
 */
export async function assertPromoNotUsedByCustomer(
  client: Pick<PrismaClient, "order">,
  promoCodeId: string,
  customer: PromoCustomer,
): Promise<void> {
  const conditions: Record<string, unknown>[] = [];

  if (customer.userId) {
    conditions.push({ userId: customer.userId });
  }

  if (customer.email) {
    conditions.push({
      customerEmail: { equals: customer.email, mode: "insensitive" },
    });
  }

  if (conditions.length === 0) return;

  const used = await client.order.findFirst({
    where: {
      promoCodeId,
      paymentStatus: "PAID",
      OR: conditions,
    },
    select: { id: true },
  });

  if (used) {
    throw new Error("PROMO_ALREADY_USED");
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
  items: { variantId: string; quantity: number; typeLabel?: string | null }[],
  tx?: Prisma.TransactionClient,
): Promise<GiftCertificateView[]> {
  const db = tx ?? getPrisma();
  const codes: GiftCertificateView[] = [];
  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);

  for (const item of items) {
    if (!isGiftCertificateVariant(item.variantId)) continue;

    const parts = item.variantId.split("-");
    const nominal = Number(parts[parts.length - 2]);
    if (!Number.isFinite(nominal) || nominal <= 0) continue;
    const typeLabel = item.typeLabel ?? null;

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
      codes.push({
        code,
        nominal,
        expiresAt: expiresAt.toISOString(),
        typeLabel,
        isActive: true,
        isUsed: false,
      });
    }
  }

  return codes;
}

/** Сертификаты, выпущенные по заказу (для страницы оплаты и админки). */
export async function getOrderGiftCertificates(
  orderId: string,
): Promise<GiftCertificateView[]> {
  const promos = await getPrisma().promoCode.findMany({
    where: { sourceOrderId: orderId, isGiftCert: true },
    orderBy: { createdAt: "asc" },
  });
  return promos.map((promo) => ({
    code: promo.code,
    nominal: promo.value,
    expiresAt: promo.expiresAt?.toISOString() ?? null,
    isActive: promo.isActive,
    isUsed: promo.maxUses !== null && promo.usedCount >= promo.maxUses,
  }));
}
