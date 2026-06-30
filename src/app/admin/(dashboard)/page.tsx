import Link from "next/link";
import { getAdminStats } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const stats = await getAdminStats();

  const cards = [
    { label: "Товары", value: stats.productsCount, href: "/admin/products" },
    { label: "Заказы", value: stats.ordersCount, href: "/admin/orders" },
    { label: "Клиенты", value: stats.usersCount, href: "/admin/orders" },
    { label: "Ожидают обработки", value: stats.pendingOrders, href: "/admin/orders" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-medium text-stone-900">Панель управления</h1>
      <p className="mt-1 text-sm text-stone-500">
        Управление товарами, заказами и настройками магазина
      </p>

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
    </div>
  );
}
