"use client";

import { FavoriteToggle } from "@/components/favorites/FavoriteToggle";

type ProductFavoriteButtonProps = {
  productId: string;
  slug: string;
  name: string;
  price: number;
  imageUrl?: string;
};

export function ProductFavoriteButton(props: ProductFavoriteButtonProps) {
  return (
    <FavoriteToggle
      item={{
        productId: props.productId,
        slug: props.slug,
        name: props.name,
        price: props.price,
        imageUrl: props.imageUrl,
      }}
      className="h-11 w-11 text-brand"
    />
  );
}
