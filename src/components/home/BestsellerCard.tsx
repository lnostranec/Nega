"use client";

import Image from "next/image";
import Link from "next/link";
import { SplitBadge, formatPricePlain } from "@/components/ui/SplitBadge";
import { PLACEHOLDER_PRODUCT } from "@/lib/constants";
import { FavoriteToggle } from "@/components/favorites/FavoriteToggle";

export type BestsellerProduct = {
  productId: string;
  slug: string;
  name: string;
  price: number;
  imageUrl?: string | null;
};

type BestsellerCardProps = {
  product: BestsellerProduct;
};

export function BestsellerCard({ product }: BestsellerCardProps) {
  return (
    <div className="relative text-center">
      <FavoriteToggle
        item={{
          productId: product.productId,
          slug: product.slug,
          name: product.name,
          price: product.price,
          imageUrl: product.imageUrl ?? undefined,
        }}
        bareOnMobile
        className="absolute right-0 top-0 z-10"
      />

      <Link
        href={`/product/${product.slug}`}
        className="group relative mx-auto block w-full max-w-[280px]"
      >
        <div className="relative aspect-[3/4] overflow-hidden bg-stone-50 card-hover-border">
          <Image
            src={product.imageUrl || PLACEHOLDER_PRODUCT}
            alt={product.name}
            fill
            draggable={false}
            className="object-cover transition duration-300 group-hover:scale-105"
            sizes="280px"
          />
        </div>
      </Link>

      <h3 className="mx-auto mt-4 max-w-full px-1 text-sm font-medium uppercase tracking-wide">
        <Link
          href={`/product/${product.slug}`}
          title={product.name}
          className="block truncate text-[#260402] transition duration-300 hover:underline"
        >
          {product.name}
        </Link>
      </h3>
      <p className="mt-2 text-sm text-stone-800">{formatPricePlain(product.price)}</p>
      <div className="mt-3 flex h-9 items-center justify-center">
        <SplitBadge price={product.price} />
      </div>
    </div>
  );
}
