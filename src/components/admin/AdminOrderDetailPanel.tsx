"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { OrderStatus } from "@prisma/client";
import { ORDER_STATUS_LABELS } from "@/lib/orders";
import type { AdminOrderDetail } from "@/lib/admin-orders";
import { DELIVERY_TYPE_LABELS, type DeliveryType } from "@/lib/cdek";
import { formatPrice } from "@/lib/format";

const STATUSES = Object.keys(ORDER_STATUS_LABELS) as OrderStatus[];

type Props = {
  order: AdminOrderDetail;
};

export function AdminOrderDetailPanel({ order: initial }: Props) {
  const router = useRouter();
  const [order, setOrder] = useState(initial);
  const [updating, setUpdating] = useState(false);

  async function changeStatus(status: OrderStatus) {
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (res.ok && data.order) {
        setOrder(data.order);
        router.refresh();
      }
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href="/admin/orders"
            className="text-sm text-stone-500 hover:text-stone-800"
          >
            ← К списку заказов
          </Link>
          <h1 className="mt-2 text-2xl font-medium">{order.orderNumber}</h1>
          <p className="mt-1 text-sm text-stone-500">
            {new Date(order.createdAt).toLocaleString("ru-RU")}
          </p>
        </div>
        <select
          value={order.status}
          disabled={updating}
          onChange={(e) => void changeStatus(e.target.value as OrderStatus)}
          className="border border-stone-300 px-3 py-2 text-sm"
        >
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {ORDER_STATUS_LABELS[status]}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-stone-200 bg-white p-6">
          <h2 className="text-sm font-medium uppercase tracking-widest text-stone-500">
            Клиент
          </h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex gap-4">
              <dt className="w-24 text-stone-500">Имя</dt>
              <dd>{order.customerName || "—"}</dd>
            </div>
            <div className="flex gap-4">
              <dt className="w-24 text-stone-500">Телефон</dt>
              <dd>{order.customerPhone}</dd>
            </div>
            <div className="flex gap-4">
              <dt className="w-24 text-stone-500">Email</dt>
              <dd>{order.customerEmail || "—"}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-lg border border-stone-200 bg-white p-6">
          <h2 className="text-sm font-medium uppercase tracking-widest text-stone-500">
            Доставка
          </h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex gap-4">
              <dt className="w-24 text-stone-500">Способ</dt>
              <dd>
                {order.deliveryMethod
                  ? DELIVERY_TYPE_LABELS[order.deliveryMethod as DeliveryType] ??
                    order.deliveryMethod
                  : "—"}
              </dd>
            </div>
            {order.cdekCityName && (
              <div className="flex gap-4">
                <dt className="w-24 text-stone-500">Город</dt>
                <dd>{order.cdekCityName}</dd>
              </div>
            )}
            {order.cdekPvzName && (
              <div className="flex gap-4">
                <dt className="w-24 text-stone-500">ПВЗ</dt>
                <dd>{order.cdekPvzName}</dd>
              </div>
            )}
            {order.cdekPvzCode && (
              <div className="flex gap-4">
                <dt className="w-24 text-stone-500">Код ПВЗ</dt>
                <dd className="font-mono">{order.cdekPvzCode}</dd>
              </div>
            )}
            {order.deliveryAddress && (
              <div className="flex gap-4">
                <dt className="w-24 text-stone-500">Адрес</dt>
                <dd>{order.deliveryAddress}</dd>
              </div>
            )}
            <div className="flex gap-4">
              <dt className="w-24 text-stone-500">Стоимость</dt>
              <dd>
                {order.deliveryCost > 0
                  ? formatPrice(order.deliveryCost)
                  : "Бесплатно"}
              </dd>
            </div>
          </dl>
        </section>
      </div>

      <section className="rounded-lg border border-stone-200 bg-white p-6">
        <h2 className="text-sm font-medium uppercase tracking-widest text-stone-500">
          Состав заказа
        </h2>
        <table className="mt-4 w-full text-left text-sm">
          <thead className="border-b border-stone-200 text-stone-500">
            <tr>
              <th className="pb-2 font-medium">Товар</th>
              <th className="pb-2 font-medium">Кол-во</th>
              <th className="pb-2 font-medium text-right">Сумма</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {order.items.map((item) => (
              <tr key={item.id}>
                <td className="py-3">
                  <p>{item.name}</p>
                  <p className="text-stone-500">
                    {[item.color, item.size].filter(Boolean).join(" · ")}
                  </p>
                </td>
                <td className="py-3">{item.quantity}</td>
                <td className="py-3 text-right">
                  {formatPrice(item.price * item.quantity)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 border-t border-stone-200 pt-4 text-sm">
          <div className="flex justify-between">
            <span className="text-stone-500">Товары</span>
            <span>{formatPrice(order.subtotal)}</span>
          </div>
          {order.promoDiscount > 0 && (
            <div className="mt-1 flex justify-between text-stone-500">
              <span>Промокод {order.promoCode ? `(${order.promoCode})` : ""}</span>
              <span>−{formatPrice(order.promoDiscount)}</span>
            </div>
          )}
          {order.pointsUsed > 0 && (
            <div className="mt-1 flex justify-between text-stone-500">
              <span>Баллы</span>
              <span>−{formatPrice(order.pointsUsed)}</span>
            </div>
          )}
          <div className="mt-1 flex justify-between">
            <span className="text-stone-500">Доставка</span>
            <span>
              {order.deliveryCost > 0
                ? formatPrice(order.deliveryCost)
                : "Бесплатно"}
            </span>
          </div>
          <div className="mt-2 flex justify-between text-base font-medium">
            <span>Итого</span>
            <span>{formatPrice(order.total)}</span>
          </div>
          {order.pointsEarned > 0 && (
            <p className="mt-2 text-stone-500">
              Начислено баллов: {order.pointsEarned}
            </p>
          )}
          <p className="mt-2 text-stone-500">
            Оплата: {order.paymentStatus}
          </p>
        </div>
      </section>

      {order.comment && (
        <section className="rounded-lg border border-stone-200 bg-white p-6">
          <h2 className="text-sm font-medium uppercase tracking-widest text-stone-500">
            Комментарий
          </h2>
          <p className="mt-3 text-sm text-stone-700">{order.comment}</p>
        </section>
      )}
    </div>
  );
}
