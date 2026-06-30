"use client";

import Link from "next/link";
import type { PublicUser } from "@/lib/auth-types";
import type { OrderView } from "@/lib/orders";
import type { PointTransactionView } from "@/lib/points-history";
import { formatPrice } from "@/lib/format";
import { useAuth } from "./AuthModalProvider";
import { AccountLoginTrigger } from "./AccountLoginTrigger";
import { AccountProfileForm } from "./AccountProfileForm";

export function AccountGuest() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-serif text-4xl text-stone-900">Личный кабинет</h1>

      <div className="mt-10 border border-stone-200 p-8 text-center">
        <p className="text-stone-600">
          Войдите или зарегистрируйтесь, чтобы видеть заказы и баллы
        </p>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <AccountLoginTrigger className="btn-site btn-site-filled inline-block bg-brand px-8 py-3 text-sm uppercase tracking-widest text-white">
            Войти
          </AccountLoginTrigger>
          <AccountLoginTrigger
            authMode="register"
            className="btn-site inline-block border border-stone-300 px-8 py-3 text-sm uppercase tracking-widest text-[#260402]"
          >
            Регистрация
          </AccountLoginTrigger>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          { title: "Баллы", value: "—", desc: "Начисляются за покупки" },
          { title: "Заказы", value: "—", desc: "История заказов" },
          { title: "Профиль", value: "—", desc: "Имя, email и телефон" },
        ].map((block) => (
          <div key={block.title} className="border border-stone-200 p-6">
            <p className="text-sm uppercase tracking-widest text-stone-500">
              {block.title}
            </p>
            <p className="mt-2 text-2xl font-medium">{block.value}</p>
            <p className="mt-1 text-sm text-stone-400">{block.desc}</p>
          </div>
        ))}
      </div>

      <p className="mt-8 text-center text-sm text-stone-400">
        <Link href="/" className="underline hover:text-stone-600">
          На главную
        </Link>
      </p>
    </div>
  );
}

type AccountDashboardProps = {
  user: PublicUser;
  orders: OrderView[];
  pointTransactions: PointTransactionView[];
};

export function AccountDashboard({
  user,
  orders,
  pointTransactions,
}: AccountDashboardProps) {
  const displayName = user.firstName ?? user.email.split("@")[0];
  const ordersCount = orders.length;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl text-stone-900">Личный кабинет</h1>
          <p className="mt-2 text-stone-600">
            Здравствуйте, {displayName}
          </p>
        </div>
        <LogoutButton />
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        <div className="border border-stone-200 p-6">
          <p className="text-sm uppercase tracking-widest text-stone-500">Баллы</p>
          <p className="mt-2 text-2xl font-medium">{user.points}</p>
          <p className="mt-1 text-sm text-stone-400">Начисляются за покупки</p>
        </div>
        <div className="border border-stone-200 p-6">
          <p className="text-sm uppercase tracking-widest text-stone-500">Заказы</p>
          <p className="mt-2 text-2xl font-medium">{ordersCount}</p>
          <p className="mt-1 text-sm text-stone-400">История заказов</p>
        </div>
        <div className="border border-stone-200 p-6">
          <p className="text-sm uppercase tracking-widest text-stone-500">Профиль</p>
          <p className="mt-2 text-lg font-medium">{displayName}</p>
          <p className="mt-1 text-sm text-stone-400">{user.email}</p>
        </div>
      </div>

      <section className="mt-10 border border-stone-200 p-8">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#260402]">
          Данные профиля
        </h2>
        <dl className="mt-6 space-y-4 text-sm">
          <div className="flex flex-col gap-1 sm:flex-row sm:gap-8">
            <dt className="w-32 shrink-0 text-stone-500">С нами с</dt>
            <dd className="text-stone-900">
              {new Date(user.createdAt).toLocaleDateString("ru-RU", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </dd>
          </div>
        </dl>
        <AccountProfileForm user={user} />
      </section>

      <section className="mt-10 border border-stone-200 p-8">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#260402]">
          История баллов
        </h2>

        {pointTransactions.length === 0 ? (
          <p className="mt-6 text-sm text-stone-500">
            Пока нет операций с баллами. Они начисляются после оплаты заказа.
          </p>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[320px] text-left text-sm">
              <thead>
                <tr className="border-b border-stone-200 text-xs uppercase tracking-widest text-stone-500">
                  <th className="pb-3 pr-4 font-medium">Дата</th>
                  <th className="pb-3 pr-4 font-medium">Операция</th>
                  <th className="pb-3 pr-4 font-medium">Баллы</th>
                  <th className="pb-3 font-medium">Комментарий</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {pointTransactions.map((tx) => (
                  <tr key={tx.id}>
                    <td className="py-3 pr-4 whitespace-nowrap text-stone-600">
                      {new Date(tx.createdAt).toLocaleDateString("ru-RU", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3 pr-4 text-stone-900">{tx.label}</td>
                    <td
                      className={`py-3 pr-4 font-medium whitespace-nowrap ${
                        tx.amount > 0 ? "text-brand" : "text-stone-700"
                      }`}
                    >
                      {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
                    </td>
                    <td className="py-3 text-stone-500">{tx.note ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-10 border border-stone-200 p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#260402]">
            История заказов
          </h2>
          <Link
            href="/catalog"
            className="text-xs uppercase tracking-widest text-stone-500 hover:text-[#260402]"
          >
            Новый заказ →
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="mt-6 border border-dashed border-stone-200 p-8 text-center">
            <p className="text-stone-600">У вас пока нет заказов</p>
            <Link
              href="/catalog"
              className="btn-site btn-site-filled mt-4 inline-block bg-brand px-8 py-3 text-sm uppercase tracking-widest text-white"
            >
              Перейти в каталог
            </Link>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {orders.map((order) => (
              <article key={order.id} className="border border-stone-200 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-stone-900">
                      Заказ {order.orderNumber}
                    </p>
                    <p className="mt-1 text-sm text-stone-500">
                      {new Date(order.createdAt).toLocaleDateString("ru-RU", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                      {" · "}
                      {order.itemsCount}{" "}
                      {order.itemsCount === 1
                        ? "товар"
                        : order.itemsCount < 5
                          ? "товара"
                          : "товаров"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatPrice(order.total)}</p>
                    {order.promoDiscount > 0 && (
                      <p className="mt-1 text-xs text-stone-500">
                        Промокод −{formatPrice(order.promoDiscount)}
                      </p>
                    )}
                    {order.pointsUsed > 0 && (
                      <p className="mt-1 text-xs text-stone-500">
                        Списано {order.pointsUsed} баллов
                      </p>
                    )}
                    <p className="mt-1 text-xs uppercase tracking-widest text-stone-500">
                      {order.statusLabel}
                    </p>
                  </div>
                </div>

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

                {order.pointsEarned > 0 && (
                  <p className="mt-3 text-xs text-stone-500">
                    +{order.pointsEarned} баллов за этот заказ
                  </p>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      <p className="mt-8 text-center text-sm text-stone-400">
        <Link href="/" className="underline hover:text-stone-600">
          На главную
        </Link>
      </p>
    </div>
  );
}

function LogoutButton() {
  const { logout } = useAuth();

  return (
    <button
      type="button"
      onClick={() => logout()}
      className="btn-site border border-stone-300 px-6 py-2.5 text-sm uppercase tracking-widest text-[#260402]"
    >
      Выйти
    </button>
  );
}
