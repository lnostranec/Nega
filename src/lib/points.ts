/** 1 балл = 1 ₽ скидки */
export function calculatePointsRedemption(
  subtotal: number,
  availablePoints: number,
  usePoints: boolean,
) {
  if (!usePoints || availablePoints <= 0 || subtotal <= 0) {
    return {
      pointsUsed: 0,
      total: subtotal,
    };
  }

  const pointsUsed = Math.min(availablePoints, Math.floor(subtotal));
  const total = subtotal - pointsUsed;

  return { pointsUsed, total };
}
