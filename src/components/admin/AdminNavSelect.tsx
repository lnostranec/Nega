"use client";

import { usePathname, useRouter } from "next/navigation";

const ITEMS = [
  { href: "/admin", label: "Сводка" },
  { href: "/admin/products", label: "Товары" },
  { href: "/admin/categories", label: "Категории" },
  { href: "/admin/collections", label: "Коллекции" },
  { href: "/admin/orders", label: "Заказы" },
  { href: "/admin/promo-codes", label: "Промокоды" },
  { href: "/admin/reviews", label: "Отзывы" },
  { href: "/admin/gift-certificate", label: "Сертификат" },
  { href: "/admin/hero", label: "Слайдер" },
  { href: "/admin/bestsellers", label: "Бестселлеры" },
  { href: "/admin/settings", label: "Настройки" },
] as const;

/** Мобильное меню разделов админки: один селект вместо скрытой навигации. */
export function AdminNavSelect() {
  const router = useRouter();
  const pathname = usePathname();

  const current =
    ITEMS.filter(
      (item) =>
        pathname === item.href || pathname.startsWith(`${item.href}/`),
    ).sort((a, b) => b.href.length - a.href.length)[0]?.href ?? "/admin";

  return (
    <label className="block">
      <span className="sr-only">Раздел админки</span>
      <select
        value={current}
        onChange={(event) => router.push(event.target.value)}
        className="w-full rounded border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 outline-none focus:border-stone-500"
      >
        {ITEMS.map((item) => (
          <option key={item.href} value={item.href}>
            {item.label}
          </option>
        ))}
      </select>
    </label>
  );
}
