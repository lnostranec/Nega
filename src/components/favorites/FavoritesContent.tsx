"use client";

import Image from "next/image";
import Link from "next/link";
import { useFavoritesStore } from "@/store/favorites";
import { formatPrice } from "@/lib/format";
import { PLACEHOLDER_PRODUCT } from "@/lib/constants";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { SiteContainer } from "@/components/layout/SiteContainer";
import { SplitBadge } from "@/components/ui/SplitBadge";

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

export function FavoritesContent() {
  const items = useFavoritesStore((s) => s.items);
  const removeItem = useFavoritesStore((s) => s.removeItem);

  return (
    <SiteContainer className="py-10">
      <Breadcrumbs
        items={[
          { label: "Главная", href: "/" },
          { label: "Список желаний" },
        ]}
      />
      <h1 className="mt-6 text-2xl font-semibold uppercase tracking-wide text-[#260402]">
        Список желаний
      </h1>

      {items.length === 0 ? (
        <div className="mt-16 max-w-lg">
          <h2 className="text-lg font-medium text-[#260402]">
            Добавьте товары в избранное
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-stone-500">
            Вы можете начать с главной страницы или воспользоваться поиском, если
            ищете что-то конкретное.
          </p>
          <Link
            href="/"
            className="btn-site mt-8 inline-block border border-brand px-8 py-3 text-sm font-medium uppercase tracking-widest text-brand"
          >
            Перейти на главную
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {items.map((item) => (
            <article key={item.productId} className="group relative text-center">
              <button
                type="button"
                onClick={() => removeItem(item.productId)}
                aria-label="Удалить из избранного"
                className="absolute right-0 top-0 z-10 cursor-pointer p-2 text-stone-400 transition hover:text-[#260402]"
              >
                <RemoveIcon />
              </button>

              <Link href={`/product/${item.slug}`} className="block">
                <div className="relative mx-auto aspect-[3/4] w-full max-w-[220px] overflow-hidden bg-stone-50 card-hover-border">
                  <Image
                    src={item.imageUrl || PLACEHOLDER_PRODUCT}
                    alt={item.name}
                    fill
                    className="object-contain p-2 transition duration-300 group-hover:scale-105"
                    sizes="220px"
                  />
                </div>
                <h3 className="mt-4 text-xs font-medium uppercase tracking-wide text-[#260402]">
                  {item.name}
                </h3>
                <p className="mt-2 text-sm text-stone-800">
                  {formatPrice(item.price)}
                </p>
                <div className="mt-3 flex justify-center">
                  <SplitBadge price={item.price} />
                </div>
              </Link>
            </article>
          ))}
        </div>
      )}
    </SiteContainer>
  );
}
