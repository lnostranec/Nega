import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/admin";

export const metadata = {
  title: "Админ-панель",
};

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getAdminUser();
  if (!admin) redirect("/admin/login");

  return (
    <div className="min-h-screen bg-stone-100">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="font-medium text-[#260402]">
              Админка Nega
            </Link>
            <nav className="hidden gap-4 text-sm sm:flex">
              <Link
                href="/admin/products"
                className="text-stone-600 hover:text-stone-900"
              >
                Товары
              </Link>
              <Link
                href="/admin/categories"
                className="text-stone-600 hover:text-stone-900"
              >
                Категории
              </Link>
              <Link
                href="/admin/orders"
                className="text-stone-600 hover:text-stone-900"
              >
                Заказы
              </Link>
              <Link
                href="/admin/promo-codes"
                className="text-stone-600 hover:text-stone-900"
              >
                Промокоды
              </Link>
              <Link
                href="/admin/hero"
                className="text-stone-600 hover:text-stone-900"
              >
                Слайдер
              </Link>
              <Link
                href="/admin/bestsellers"
                className="text-stone-600 hover:text-stone-900"
              >
                Бестселлеры
              </Link>
              <Link
                href="/admin/settings"
                className="text-stone-600 hover:text-stone-900"
              >
                Настройки
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="hidden text-stone-500 sm:inline">{admin.email}</span>
            <Link href="/" className="text-stone-500 hover:text-stone-900">
              На сайт →
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
