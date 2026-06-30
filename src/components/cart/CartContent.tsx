"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { PointsTotal } from "@/components/checkout/PointsTotal";
import { useAuth } from "@/components/account/AuthModalProvider";
import { useCartValidation } from "@/hooks/useCartValidation";
import { useCartStore } from "@/store/cart";
import { formatPrice } from "@/lib/format";
import { PLACEHOLDER_PRODUCT } from "@/lib/constants";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { SiteContainer } from "@/components/layout/SiteContainer";
import { QuantityControl } from "@/components/ui/QuantityControl";

function RemoveIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="h-5 w-5"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  );
}

export function CartContent() {
  const { user, openLogin, refreshUser, loading } = useAuth();
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const clearCart = useCartStore((s) => s.clearCart);
  const usePoints = useCartStore((s) => s.usePoints);
  const setUsePoints = useCartStore((s) => s.setUsePoints);
  const totalPrice = useCartStore((s) => s.totalPrice());
  const totalItems = useCartStore((s) => s.totalItems());
  const { messages, stockByVariant, validating } = useCartValidation();

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  if (items.length === 0) {
    return (
      <SiteContainer className="py-10">
        <Breadcrumbs
          items={[{ label: "Главная", href: "/" }, { label: "Корзина" }]}
        />
        <h1 className="mt-6 text-2xl font-semibold uppercase tracking-wide text-[#260402]">
          Корзина
        </h1>
        <div className="mt-16 text-center">
          <p className="text-lg text-stone-600">Ваша корзина пуста</p>
          <Link
            href="/catalog"
            className="btn-site btn-site-filled mt-6 inline-block bg-brand px-8 py-3 text-sm font-medium uppercase tracking-widest text-white"
          >
            Перейти в каталог
          </Link>
        </div>
      </SiteContainer>
    );
  }

  const itemsWord =
    totalItems === 1 ? "товар" : totalItems < 5 ? "товара" : "товаров";

  return (
    <SiteContainer className="py-10">
      <Breadcrumbs
        items={[{ label: "Главная", href: "/" }, { label: "Корзина" }]}
      />
      <h1 className="mt-6 text-2xl font-semibold uppercase tracking-wide text-[#260402]">
        Корзина
      </h1>

      {messages.length > 0 && (
        <div className="mt-4 border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {messages.map((message) => (
            <p key={message}>{message}</p>
          ))}
        </div>
      )}

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_320px] xl:grid-cols-[1fr_360px]">
        <div>
          <div className="space-y-0 divide-y divide-stone-200 border-y border-stone-200">
            {items.map((item) => (
              <article
                key={item.variantId}
                className="flex flex-col gap-5 py-8 sm:flex-row sm:items-center"
              >
                <Link
                  href={`/product/${item.slug}`}
                  className="relative h-36 w-32 shrink-0 overflow-hidden bg-stone-50 sm:h-40 sm:w-36"
                >
                  <Image
                    src={item.imageUrl || PLACEHOLDER_PRODUCT}
                    alt={item.name}
                    fill
                    className="object-contain p-2"
                    sizes="144px"
                  />
                </Link>

                <div className="min-w-0 flex-1">
                  <Link
                    href={`/product/${item.slug}`}
                    className="text-sm font-medium uppercase tracking-wide text-[#260402] hover:underline"
                  >
                    {item.name}
                  </Link>
                  <p className="mt-2 text-sm text-stone-500">
                    {item.color && `${item.color}, `}размер {item.size}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                  <p className="min-w-[80px] text-sm font-medium text-stone-900">
                    {formatPrice(item.price)}
                  </p>
                  <QuantityControl
                    value={item.quantity}
                    max={stockByVariant[item.variantId] ?? undefined}
                    onChange={(qty) =>
                      updateQuantity(
                        item.variantId,
                        qty,
                        stockByVariant[item.variantId] ?? undefined,
                      )
                    }
                  />
                  <button
                    type="button"
                    onClick={() => removeItem(item.variantId)}
                    aria-label="Удалить товар"
                    className="cursor-pointer text-stone-400 transition hover:text-[#260402]"
                  >
                    <RemoveIcon />
                  </button>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={clearCart}
              className="btn-site border border-brand px-4 py-2 text-sm text-brand transition-colors duration-300"
            >
              Очистить корзину
            </button>
          </div>
        </div>

        <aside className="h-fit border border-stone-200 px-6 py-8">
          <PointsTotal
            subtotal={totalPrice}
            availablePoints={user?.points ?? 0}
            usePoints={usePoints}
            onUsePointsChange={setUsePoints}
            isLoggedIn={Boolean(user)}
            loading={loading}
          />
          {!user && !loading && (
            <p className="mt-3 text-xs text-stone-500">
              <button type="button" onClick={openLogin} className="underline">
                Войдите
              </button>
              , чтобы списать баллы
            </p>
          )}
          <div className="mt-4 space-y-1 text-sm text-stone-500">
            <p>
              {totalItems} {itemsWord}
            </p>
            <p>Без учёта доставки и промокода</p>
            <p className="text-xs">Промокод вводится на шаге оформления</p>
          </div>
          <Link
            href="/checkout"
            className={`btn-site btn-site-filled mt-6 block w-full bg-brand py-3.5 text-center text-sm font-medium uppercase tracking-widest text-white ${
              validating ? "pointer-events-none opacity-60" : ""
            }`}
          >
            Перейти к оформлению
          </Link>
        </aside>
      </div>
    </SiteContainer>
  );
}
