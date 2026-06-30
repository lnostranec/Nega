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
};

export function ProductCard({
  productId,
  slug,
  name,
  price,
  comparePrice,
  imageUrl,
  variant = "default",
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

  const imageBlock = (
    <div className="relative aspect-[3/4] overflow-hidden bg-stone-50 card-hover-border">
      <Image
        src={imageUrl || PLACEHOLDER_PRODUCT}
        alt={name}
        fill
        className={
          isCompact
            ? "object-contain p-0 transition duration-300 scale-[1.05] group-hover:scale-110"
            : "object-contain p-2 transition duration-300 group-hover:scale-105"
        }
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
  );

  if (isCompact) {
    return (
      <div className="group">
        <Link href={`/product/${slug}`} className="block">
          {imageBlock}
        </Link>
        <div className="mt-2 flex items-start gap-1.5">
          <Link href={`/product/${slug}`} className="min-w-0 flex-1 text-center">
            <h3 className="line-clamp-2 text-[10px] font-medium uppercase leading-snug tracking-wide text-[#260402] sm:text-[11px]">
              {name}
            </h3>
            <div className="mt-1 flex flex-wrap items-center justify-center gap-1.5">
              <span className="text-xs font-medium text-stone-900">
                {formatPrice(price)}
              </span>
              {hasDiscount && (
                <span className="text-[11px] text-stone-400 line-through">
                  {formatPrice(comparePrice)}
                </span>
              )}
            </div>
          </Link>
          <FavoriteToggle item={favoriteItem} size="sm" />
        </div>
      </div>
    );
  }

  return (
    <div className="group relative">
      <FavoriteToggle
        item={favoriteItem}
        className="absolute right-2 top-2 z-10"
      />
      <Link href={`/product/${slug}`} className="block">
        {imageBlock}
        <div className="mt-3 text-center">
          <h3 className="text-xs font-medium uppercase tracking-wide text-[#260402]">
            {name}
          </h3>
          <div className="mt-1 flex items-center justify-center gap-2">
            <span className="text-sm font-medium text-stone-900">
              {formatPrice(price)}
            </span>
            {hasDiscount && (
              <span className="text-sm text-stone-400 line-through">
                {formatPrice(comparePrice)}
              </span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
