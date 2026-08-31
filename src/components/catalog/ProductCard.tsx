"use client";

import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "@/lib/format";
import { PLACEHOLDER_PRODUCT } from "@/lib/constants";
import { FavoriteToggle } from "@/components/favorites/FavoriteToggle";

type ProductCardProps = {
  productId: string;
  slug: string;
  name: string;
  price: number;
  comparePrice?: number | null;
  imageUrl?: string | null;
  /** Компактный вид для страницы каталога */
  variant?: "default" | "compact";
  /** Категория, из которой открыли карточку (для хлебных крошек) */
  fromCollection?: string;
};

export function ProductCard({
  productId,
  slug,
  name,
  price,
  comparePrice,
  imageUrl,
  variant = "default",
  fromCollection,
}: ProductCardProps) {
  const hasDiscount = comparePrice && comparePrice > price;
  const isCompact = variant === "compact";

  const favoriteItem = {
    productId,
    slug,
    name,
    price,
    imageUrl: imageUrl ?? undefined,
  };

  const productHref = fromCollection
    ? `/product/${slug}?collection=${encodeURIComponent(fromCollection)}`
    : `/product/${slug}`;

  return (
    <div className="relative">
      <FavoriteToggle
        item={favoriteItem}
        size={isCompact ? "sm" : "md"}
        bareOnMobile
        className={`absolute z-10 ${
          isCompact ? "right-0.5 top-0.5" : "right-1 top-1"
        }`}
      />

      <Link href={productHref} className="group block">
        <div className="relative aspect-[3/4] overflow-hidden bg-stone-50 card-hover-border">
          <Image
            src={imageUrl || PLACEHOLDER_PRODUCT}
            alt={name}
            fill
            className="object-cover transition duration-300 group-hover:scale-105"
            sizes={
              isCompact
                ? "(max-width: 640px) 45vw, (max-width: 1280px) 20vw, 16vw"
                : "(max-width: 768px) 50vw, 25vw"
            }
          />
          {hasDiscount && (
            <span
              className={`absolute left-2 top-2 bg-[#260402] uppercase tracking-wide text-white ${
                isCompact
                  ? "px-1.5 py-0.5 text-[10px]"
                  : "left-3 top-3 px-2 py-1 text-xs"
              }`}
            >
              Sale
            </span>
          )}
        </div>
        <div className={`text-center ${isCompact ? "mt-2" : "mt-3"}`}>
          <h3
            className={
              isCompact
                ? "line-clamp-2 text-[10px] font-medium uppercase leading-snug tracking-wide text-[#260402] sm:text-[11px]"
                : "text-xs font-medium uppercase tracking-wide text-[#260402]"
            }
          >
            {name}
          </h3>
          <div
            className={`flex items-center justify-center ${
              isCompact ? "mt-1 flex-wrap gap-1.5" : "mt-1 gap-2"
            }`}
          >
            <span
              className={
                isCompact
                  ? "text-xs font-medium text-stone-900"
                  : "text-sm font-medium text-stone-900"
              }
            >
              {formatPrice(price)}
            </span>
            {hasDiscount && (
              <span
                className={
                  isCompact
                    ? "text-[11px] text-stone-400 line-through"
                    : "text-sm text-stone-400 line-through"
                }
              >
                {formatPrice(comparePrice)}
              </span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
