"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { DELIVERY_TYPE_LABELS, type DeliveryType } from "@/lib/cdek";
import { formatPrice } from "@/lib/format";
import type { TrackedOrderView } from "@/lib/guest-orders";
import { sanitizePhoneInput } from "@/lib/validation";
import { Button } from "@/components/ui/Button";
import { SiteContainer } from "@/components/layout/SiteContainer";

const inputClass =
  "w-full border border-stone-300 px-4 py-3 text-sm outline-none focus:border-[#260402]";

export function TrackOrderContent() {
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<TrackedOrderView | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setOrder(null);

    try {
      const response = await fetch("/api/orders/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber, phone }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Заказ не найден");
        return;
      }
      setOrder(data.order as TrackedOrderView);
    } catch {
      setError("Ошибка сети");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SiteContainer className="py-10">
      <div className="mx-auto max-w-2xl">
        <h1 className="font-serif text-4xl text-stone-900">Отслеживание заказа</h1>
        <p className="mt-3 text-sm text-stone-600">
          Введите номер заказа и телефон, указанный при оформлении.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <input
            type="text"
            placeholder="Номер заказа (NEGA-...)"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            required
            className={inputClass}
          />
          <input
            type="tel"
            placeholder="Телефон"
            value={phone}
            onChange={(e) => setPhone(sanitizePhoneInput(e.target.value))}
            required
            className={inputClass}
          />
          {error && (
            <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Ищем..." : "Найти заказ"}
          </Button>
        </form>

        {order && (
          <article className="mt-10 border border-stone-200 p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium text-stone-900">Заказ {order.orderNumber}</p>
                <p className="mt-1 text-sm text-stone-500">
                  {new Date(order.createdAt).toLocaleDateString("ru-RU", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
              <p className="text-sm uppercase tracking-widest text-stone-500">
                {order.statusLabel}
              </p>
            </div>

            {(order.deliveryMethod || order.cdekCityName) && (
              <div className="mt-4 border-t border-stone-100 pt-4 text-sm text-stone-600">
                <p className="font-medium text-stone-800">Доставка</p>
                {order.deliveryMethod && (
                  <p className="mt-1">
                    {DELIVERY_TYPE_LABELS[order.deliveryMethod as DeliveryType] ??
                      order.deliveryMethod}
                  </p>
                )}
                {order.cdekCityName && <p>Город: {order.cdekCityName}</p>}
                {order.cdekPvzName && <p>ПВЗ: {order.cdekPvzName}</p>}
                {order.deliveryAddress && <p>Адрес: {order.deliveryAddress}</p>}
                <p className="mt-1">
                  {order.deliveryCost > 0
                    ? formatPrice(order.deliveryCost)
                    : "Бесплатно"}
                </p>
              </div>
            )}

            <ul className="mt-4 divide-y divide-stone-100 border-t border-stone-100 pt-4">
              {order.items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-start justify-between gap-4 py-2 text-sm"
                >
                  <div>
                    <p className="text-stone-900">{item.name}</p>
                    <p className="text-stone-500">
                      {[item.color, item.size].filter(Boolean).join(" · ")}
                      {item.quantity > 1 ? ` · ${item.quantity} шт.` : ""}
                    </p>
                  </div>
                  <p className="shrink-0 text-stone-700">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </li>
              ))}
            </ul>

            <div className="mt-4 border-t border-stone-100 pt-4 text-sm">
              {order.promoDiscount > 0 && (
                <p className="flex justify-between text-stone-500">
                  <span>Промокод</span>
                  <span>−{formatPrice(order.promoDiscount)}</span>
                </p>
              )}
              <p className="mt-2 flex justify-between font-medium text-stone-900">
                <span>Итого</span>
                <span>{formatPrice(order.total)}</span>
              </p>
            </div>

            <p className="mt-6 text-center text-sm text-stone-500">
              <Link href="/account" className="underline hover:text-stone-700">
                Войти в личный кабинет
              </Link>
              , чтобы видеть все заказы
            </p>
          </article>
        )}
      </div>
    </SiteContainer>
  );
}
