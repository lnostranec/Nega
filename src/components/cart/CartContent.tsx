"use client";

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
import { TrashIcon } from "@/components/icons";
import { calculateLoyaltyDiscount } from "@/lib/loyalty-shared";
import { isGiftCertificateVariant } from "@/lib/gift-certificate";

export function CartContent() {
  const { user, openLogin, refreshUser, loading } = useAuth();
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const usePoints = useCartStore((s) => s.usePoints);
  const setUsePoints = useCartStore((s) => s.setUsePoints);
  const totalPrice = useCartStore((s) => s.totalPrice());
  const totalItems = useCartStore((s) => s.totalItems());
  const { messages, stockByVariant, validating } = useCartValidation();

  const loyaltyPercent = user?.loyaltyPercent ?? 0;
  const discountable = items
    .filter((item) => !isGiftCertificateVariant(item.variantId))
    .reduce((sum, item) => sum + item.price * item.quantity, 0);
  const loyaltyDiscount = calculateLoyaltyDiscount(discountable, loyaltyPercent);

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
        <div className="min-w-0">
          <div className="divide-y divide-stone-200 border-y border-stone-200">
            {items.map((item) => {
              const stockMax = stockByVariant[item.variantId] ?? undefined;
              const onQtyChange = (qty: number) =>
                updateQuantity(item.variantId, qty, stockMax);
              const imageSrc = item.imageUrl || PLACEHOLDER_PRODUCT;
              const meta = (
                <>
                  {item.color && `${item.color}, `}размер {item.size}
                </>
              );

              return (
                <div key={item.variantId}>
                  {/* ——— Мобилка ——— */}
                  <article className="relative flex flex-col items-center gap-4 py-8 text-center lg:hidden">
                    <button
                      type="button"
                      onClick={() => removeItem(item.variantId)}
                      aria-label="Удалить товар"
                      className="absolute right-0 top-6 z-10 text-stone-400"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>

                    <Link href={`/product/${item.slug}`} className="shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imageSrc}
                        alt={item.name}
                        width={260}
                        height={280}
                        className="h-[280px] w-[260px] max-w-[calc(100vw-2rem)] object-contain bg-stone-50 p-2"
                      />
                    </Link>

                    <div className="flex w-full flex-col items-center px-2">
                      <Link
                        href={`/product/${item.slug}`}
                        className="text-sm font-medium uppercase tracking-wide text-[#260402]"
                      >
                        {item.name}
                      </Link>
                      <p className="mt-2 text-sm text-stone-500">{meta}</p>
                      <p className="mt-3 text-sm font-medium text-stone-900">
                        {formatPrice(item.price)}
                      </p>
                      <div className="mt-4 w-fit">
                        <QuantityControl
                          size="sm"
                          value={item.quantity}
                          max={stockMax}
                          onChange={onQtyChange}
                        />
                      </div>
                    </div>
                  </article>

                  {/* ——— ПК ——— */}
                  <article className="hidden items-center gap-6 py-6 lg:flex">
                    <Link href={`/product/${item.slug}`} className="shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imageSrc}
                        alt={item.name}
                        width={112}
                        height={144}
                        className="h-36 w-28 object-contain bg-stone-50 p-1"
                      />
                    </Link>

                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/product/${item.slug}`}
                        className="text-sm font-medium uppercase tracking-wide text-[#260402] hover:underline"
                      >
                        {item.name}
                      </Link>
                      <p className="mt-2 text-sm text-stone-500">{meta}</p>
                    </div>

                    <div className="flex shrink-0 items-center gap-5">
                      <p className="min-w-[5.5rem] text-sm font-medium text-stone-900">
                        {formatPrice(item.price)}
                      </p>
                      <QuantityControl
                        value={item.quantity}
                        max={stockMax}
                        onChange={onQtyChange}
                      />
                      <button
                        type="button"
                        onClick={() => removeItem(item.variantId)}
                        aria-label="Удалить товар"
                        className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-stone-300 text-stone-400 transition-[color,border-color] duration-300 hover:border-brand hover:text-brand"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </article>
                </div>
              );
            })}
          </div>
        </div>

        <aside className="h-fit border border-stone-200 px-6 py-8 lg:sticky lg:top-28">
          <PointsTotal
            subtotal={totalPrice}
            loyaltyDiscount={loyaltyDiscount}
            loyaltyPercent={user?.loyaltyPercent ?? 0}
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
