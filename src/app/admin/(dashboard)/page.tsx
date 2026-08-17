import Link from "next/link";
import { getAdminStats } from "@/lib/data";
import { formatPrice } from "@/lib/format";
import { listAuditLogs } from "@/lib/audit";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [stats, logs] = await Promise.all([
    getAdminStats(),
    listAuditLogs(15).catch(() => []),
  ]);

  const cards = [
    { label: "Товары", value: stats.productsCount, href: "/admin/products" },
    { label: "Заказы", value: stats.ordersCount, href: "/admin/orders" },
    { label: "Клиенты", value: stats.usersCount, href: "/admin/orders" },
    {
      label: "В обработке",
      value: stats.pendingOrders,
      href: "/admin/orders",
    },
    {
      label: "Ждут оплаты",
      value: stats.awaitingPayment,
      href: "/admin/orders",
    },
    {
      label: "Оплачено сегодня",
      value: stats.paidToday,
      href: "/admin/orders",
    },
    {
      label: "Без трека",
      value: stats.withoutTracking,
      href: "/admin/orders",
    },
    {
      label: "Низкий сток (≤2)",
      value: stats.lowStockVariants,
      href: "/admin/products",
    },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium text-stone-900">
            Панель управления
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            Выручка за 7 дней:{" "}
            <span className="font-medium text-stone-800">
              {formatPrice(stats.revenue7d)}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <a
            href="/api/admin/export/orders"
            className="border border-stone-300 bg-white px-3 py-2 transition hover:border-stone-500"
          >
            CSV заказов
          </a>
          <a
            href="/api/admin/export/products"
            className="border border-stone-300 bg-white px-3 py-2 transition hover:border-stone-500"
          >
            CSV товаров
          </a>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="rounded-lg border border-stone-200 bg-white p-6 transition hover:border-stone-400"
          >
            <p className="text-sm text-stone-500">{card.label}</p>
            <p className="mt-2 text-3xl font-medium">{card.value}</p>
          </Link>
        ))}
      </div>

      <section className="mt-10 rounded-lg border border-stone-200 bg-white p-6">
        <h2 className="text-sm font-medium uppercase tracking-widest text-stone-500">
          Последние действия
        </h2>
        {logs.length === 0 ? (
          <p className="mt-4 text-sm text-stone-500">Пока нет записей аудита</p>
        ) : (
          <ul className="mt-4 divide-y divide-stone-100 text-sm">
            {logs.map((log) => (
              <li
                key={log.id}
                className="flex flex-wrap items-baseline justify-between gap-2 py-2"
              >
                <span>
                  <span className="font-medium">{log.action}</span>{" "}
                  <span className="text-stone-500">
                    {log.entityType}
                    {log.entityId ? ` ${log.entityId.slice(0, 8)}…` : ""}
                  </span>
                  {log.admin?.email ? (
                    <span className="text-stone-400"> · {log.admin.email}</span>
                  ) : null}
                </span>
                <span className="text-xs text-stone-400">
                  {new Date(log.createdAt).toLocaleString("ru-RU")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
