import type { Prisma } from "@prisma/client";
import { getPrisma } from "@/lib/prisma";
import { getDiscountableSubtotal } from "@/lib/promo-codes";
import {
  calculateLoyaltyDiscount,
  DEFAULT_LOYALTY_SETTINGS,
  getLoyaltyPercent,
  type LoyaltySettings,
} from "@/lib/loyalty-shared";

export type { LoyaltySettings };
export {
  calculateLoyaltyDiscount,
  DEFAULT_LOYALTY_SETTINGS,
  getLoyaltyPercent,
} from "@/lib/loyalty-shared";

const PAID_STATUSES = ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"] as const;

/**
 * Клиент БД: обычный или транзакционный.
 * Внутри транзакции обязательно передавать tx — иначе запрос уходит через
 * отдельное соединение, которого при малом пуле может не оказаться.
 */
type Db = Prisma.TransactionClient | ReturnType<typeof getPrisma>;

export async function getLoyaltySettings(
  db: Db = getPrisma(),
): Promise<LoyaltySettings> {
  try {
    const settings = await db.siteSettings.findUnique({
      where: { id: "default" },
    });
    if (!settings) return DEFAULT_LOYALTY_SETTINGS;
    return {
      threshold1: settings.loyaltyThreshold1,
      percent1: settings.loyaltyPercent1,
      threshold2: settings.loyaltyThreshold2,
      percent2: settings.loyaltyPercent2,
      threshold3: settings.loyaltyThreshold3,
      percent3: settings.loyaltyPercent3,
    };
  } catch {
    return DEFAULT_LOYALTY_SETTINGS;
  }
}

export async function getUserLifetimeSpend(
  userId: string,
  db: Db = getPrisma(),
): Promise<number> {
  const result = await db.order.aggregate({
    where: {
      userId,
      status: { in: [...PAID_STATUSES] },
    },
    _sum: { total: true },
  });
  return Number(result._sum.total ?? 0);
}

export async function getUserLoyalty(
  userId: string,
  db: Db = getPrisma(),
): Promise<{
  lifetimeSpend: number;
  percent: number;
  settings: LoyaltySettings;
}> {
  const [lifetimeSpend, settings] = await Promise.all([
    getUserLifetimeSpend(userId, db),
    getLoyaltySettings(db),
  ]);
  return {
    lifetimeSpend,
    percent: getLoyaltyPercent(lifetimeSpend, settings),
    settings,
  };
}

export function loyaltyDiscountFromItems(
  items: { price: number; quantity: number; variantId: string }[],
  percent: number,
): number {
  return calculateLoyaltyDiscount(getDiscountableSubtotal(items), percent);
}
