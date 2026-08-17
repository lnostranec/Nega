"use client";

import { HeartIcon } from "@/components/icons";
import { useFavoritesStore, type FavoriteItem } from "@/store/favorites";
import { useIsClient } from "@/hooks/useIsClient";

type FavoriteToggleProps = {
  item: FavoriteItem;
  className?: string;
  size?: "md" | "sm";
  /** На мобилке без видимого круга (hit-area сохраняется) */
  bareOnMobile?: boolean;
};

export function FavoriteToggle({
  item,
  className = "",
  size = "md",
  bareOnMobile = false,
}: FavoriteToggleProps) {
  const storedFavorite = useFavoritesStore((s) => s.isFavorite(item.productId));
  const toggleItem = useFavoritesStore((s) => s.toggleItem);
  const mounted = useIsClient();

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
      className={`flex ${sizeClass} shrink-0 items-center justify-center rounded-full transition-colors duration-300 hover:text-brand ${
        bareOnMobile
          ? "border-0 bg-transparent md:border md:border-stone-200 md:bg-white md:hover:border-brand"
          : "border border-stone-200 bg-white hover:border-brand"
      } ${
        isFavorite
          ? bareOnMobile
            ? "text-brand md:border-brand"
            : "border-brand text-brand"
          : "text-stone-400"
      } ${className}`}
    >
      <HeartIcon className={iconClass} filled={isFavorite} />
    </button>
  );
}
