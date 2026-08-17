export type LoyaltySettings = {
  threshold1: number;
  percent1: number;
  threshold2: number;
  percent2: number;
  threshold3: number;
  percent3: number;
};

export const DEFAULT_LOYALTY_SETTINGS: LoyaltySettings = {
  threshold1: 10000,
  percent1: 3,
  threshold2: 30000,
  percent2: 5,
  threshold3: 50000,
  percent3: 10,
};

export function getLoyaltyPercent(
  lifetimeSpend: number,
  settings: LoyaltySettings = DEFAULT_LOYALTY_SETTINGS,
): number {
  if (lifetimeSpend >= settings.threshold3) return settings.percent3;
  if (lifetimeSpend >= settings.threshold2) return settings.percent2;
  if (lifetimeSpend >= settings.threshold1) return settings.percent1;
  return 0;
}

export function calculateLoyaltyDiscount(
  discountableSubtotal: number,
  percent: number,
): number {
  if (percent <= 0 || discountableSubtotal <= 0) return 0;
  return Math.floor((discountableSubtotal * percent) / 100);
}
