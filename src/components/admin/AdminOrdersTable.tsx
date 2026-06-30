"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { OrderStatus } from "@prisma/client";
import { ORDER_STATUS_LABELS } from "@/lib/orders";
import type { AdminOrderListItem } from "@/lib/admin-orders";
import { formatPrice } from "@/lib/format";

const STATUSES = Object.keys(ORDER_STATUS_LABELS) as OrderStatus[];

type Props = {
  orders: AdminOrderListItem[];
};

export function AdminOrdersTable({ orders: initial }: Props) {
  const router = useRouter();
  const [orders, setOrders] = useState(initial);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function changeStatus(id: string, status: OrderStatus) {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (res.ok && data.order) {
        setOrders((prev) =>
          prev.map((order) =>
            order.id === id
              ? {
                  ...order,
                  status: data.order.status,
                  statusLabel: ORDER_STATUS_LABELS[data.order.status as OrderStatus],
                }
              : order,
          ),
        );
        router.refresh();
      }
    } finally {
      setUpdatingId(null);
    }
  }

  if (orders.length === 0) {
    return (
      <div className="rounded-lg border border-stone-200 bg-white p-12 text-center text-stone-400">
        Заказов пока нет
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-stone-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-stone-200 bg-stone-50">
          <tr>
            <th className="px-4 py-3 font-medium">Номер</th>
            <th className="px-4 py-3 font-medium">Клиент</th>
            <th className="px-4 py-3 font-medium">Сумма</th>
            <th className="px-4 py-3 font-medium">Дата</th>
            <th className="px-4 py-3 font-medium">Статус</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} className="border-b border-stone-100">
              <td className="px-4 py-3 font-medium">
                <Link
                  href={`/admin/orders/${order.id}`}
                  className="hover:underline"
                >
                  {order.orderNumber}
                </Link>
              </td>
              <td className="px-4 py-3">
                <div>{order.customerName || "—"}</div>
                <div className="text-stone-500">{order.customerPhone}</div>
              </td>
              <td className="px-4 py-3">
                {formatPrice(order.total)}
                <span className="text-stone-400"> · {order.itemsCount} шт.</span>
              </td>
              <td className="px-4 py-3 text-stone-500">
                {new Date(order.createdAt).toLocaleString("ru-RU")}
              </td>
              <td className="px-4 py-3">
                <select
                  value={order.status}
                  disabled={updatingId === order.id}
                  onChange={(e) =>
                    void changeStatus(order.id, e.target.value as OrderStatus)
                  }
                  className="border border-stone-300 px-2 py-1 text-sm"
                >
                  {STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {ORDER_STATUS_LABELS[status]}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
