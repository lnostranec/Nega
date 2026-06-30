"use client";

import { useEffect, useState } from "react";
import { HeartIcon } from "@/components/icons";
import { useFavoritesStore, type FavoriteItem } from "@/store/favorites";

type FavoriteToggleProps = {
  item: FavoriteItem;
  className?: string;
  size?: "md" | "sm";
};

export function FavoriteToggle({
  item,
  className = "",
  size = "md",
}: FavoriteToggleProps) {
  const storedFavorite = useFavoritesStore((s) => s.isFavorite(item.productId));
  const toggleItem = useFavoritesStore((s) => s.toggleItem);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isFavorite = mounted && storedFavorite;

  const sizeClass =
    size === "sm" ? "h-7 w-7" : "h-9 w-9";
  const iconClass = size === "sm" ? "h-4 w-4" : "h-[18px] w-[18px]";

  return (
    <button
      type="button"
      aria-label={isFavorite ? "Убрать из избранного" : "Добавить в избранное"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleItem(item);
      }}
      className={`flex ${sizeClass} shrink-0 items-center justify-center rounded-full border border-stone-200 bg-white transition-colors duration-300 hover:border-brand hover:text-brand ${className} ${
        isFavorite ? "border-brand text-brand" : "text-stone-400"
      }`}
    >
      <HeartIcon className={iconClass} filled={isFavorite} />
    </button>
  );
}
