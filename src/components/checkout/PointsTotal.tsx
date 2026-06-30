"use client";

import { useEffect } from "react";
import { formatPrice } from "@/lib/format";
import { calculatePointsRedemption } from "@/lib/points";

type PointsTotalProps = {
  subtotal: number;
  promoDiscount?: number;
  deliveryCost?: number;
  availablePoints: number;
  usePoints: boolean;
  onUsePointsChange: (value: boolean) => void;
  isLoggedIn?: boolean;
  loading?: boolean;
  className?: string;
};

function PointsSwitch({
  checked,
  disabled,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label="Списать баллы"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`group relative inline-flex h-4 w-7 shrink-0 items-center rounded-full p-0.5 transition-colors duration-300 ease-out disabled:cursor-not-allowed disabled:opacity-40 ${
        checked ? "bg-brand" : "bg-stone-200"
      }`}
    >
      <span
        className={`pointer-events-none block h-3 w-3 rounded-full bg-white shadow-[0_1px_2px_rgba(38,4,2,0.16)] transition-transform duration-300 ease-out ${
          checked ? "translate-x-3" : "translate-x-0"
        }`}
        aria-hidden
      />
      <span
        className={`pointer-events-none absolute inset-0 rounded-full ring-1 transition-all duration-300 ${
          checked
            ? "ring-brand/30 group-hover:ring-brand/50"
            : "ring-stone-300/80 group-hover:ring-stone-400"
        }`}
        aria-hidden
      />
    </button>
  );
}

function pointsLabel(count: number): string {
  if (count === 1) return "балл";
  if (count >= 2 && count <= 4) return "балла";
  return "баллов";
}

export function PointsTotal({
  subtotal,
  promoDiscount = 0,
  deliveryCost = 0,
  availablePoints,
  usePoints,
  onUsePointsChange,
  isLoggedIn = false,
  loading = false,
  className = "",
}: PointsTotalProps) {
  const afterPromo = Math.max(0, subtotal - promoDiscount);
  const canUsePoints = isLoggedIn && availablePoints > 0 && afterPromo > 0;
  const active = usePoints && canUsePoints;
  const { pointsUsed, total: totalAfterPoints } = calculatePointsRedemption(
    afterPromo,
    availablePoints,
    active,
  );

  const finalTotal =
    (active && pointsUsed > 0 ? totalAfterPoints : afterPromo) + deliveryCost;

  useEffect(() => {
    if (!canUsePoints && usePoints) {
      onUsePointsChange(false);
    }
  }, [canUsePoints, usePoints, onUsePointsChange]);

  return (
    <div className={className}>
      {promoDiscount > 0 && (
        <div className="mb-3 flex items-baseline justify-between gap-4 text-sm">
          <span className="text-stone-500">Промокод</span>
          <span className="font-medium text-brand">−{formatPrice(promoDiscount)}</span>
        </div>
      )}
      {deliveryCost > 0 && (
        <div className="mb-3 flex items-baseline justify-between gap-4 text-sm">
          <span className="text-stone-500">Доставка</span>
          <span className="font-medium">{formatPrice(deliveryCost)}</span>
        </div>
      )}
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-lg font-semibold text-[#260402]">Итого</span>
        <p className="text-lg font-semibold text-[#260402]">
          {formatPrice(finalTotal)}
        </p>
      </div>

      <div className="mt-5 border-t border-stone-200 pt-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <PointsSwitch
              checked={active}
              disabled={loading || !isLoggedIn || !canUsePoints}
              onChange={onUsePointsChange}
            />
            <div className="min-w-0">
              <p className="text-sm font-medium text-[#260402]">Списать баллы</p>
              {loading ? (
                <p className="mt-0.5 text-xs text-stone-400">Загрузка...</p>
              ) : !isLoggedIn ? (
                <p className="mt-0.5 text-xs text-stone-400">Войдите в аккаунт</p>
              ) : availablePoints > 0 ? (
                <p className="mt-0.5 text-xs text-stone-400">
                  {availablePoints} {pointsLabel(availablePoints)} · 1 балл = 1 ₽
                </p>
              ) : (
                <p className="mt-0.5 text-xs text-stone-400">
                  Начисляются после покупок
                </p>
              )}
            </div>
          </div>

          {active && pointsUsed > 0 && (
            <div className="shrink-0 text-right">
              <p className="text-sm text-stone-400 line-through">
                {formatPrice(afterPromo + deliveryCost)}
              </p>
              <p className="mt-0.5 text-xs font-medium text-brand">
                −{formatPrice(pointsUsed)}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
