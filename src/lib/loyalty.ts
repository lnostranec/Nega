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

export async function getLoyaltySettings(): Promise<LoyaltySettings> {
  try {
    const settings = await getPrisma().siteSettings.findUnique({
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

export async function getUserLifetimeSpend(userId: string): Promise<number> {
  const result = await getPrisma().order.aggregate({
    where: {
      userId,
      status: { in: [...PAID_STATUSES] },
    },
    _sum: { total: true },
  });
  return Number(result._sum.total ?? 0);
}

export async function getUserLoyalty(userId: string): Promise<{
  lifetimeSpend: number;
  percent: number;
  settings: LoyaltySettings;
}> {
  const [lifetimeSpend, settings] = await Promise.all([
    getUserLifetimeSpend(userId),
    getLoyaltySettings(),
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
