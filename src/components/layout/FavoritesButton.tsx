"use client";

import Link from "next/link";
import { HeartIcon } from "@/components/icons";
import { useFavoritesStore } from "@/store/favorites";
import { useIsClient } from "@/hooks/useIsClient";
import {
  HEADER_ICON_BUTTON_CLASS,
  HEADER_ICON_CLASS,
} from "./header-icon-styles";

export function FavoritesButton() {
  const totalItems = useFavoritesStore((s) => s.totalItems());
  const mounted = useIsClient();

  return (
    <Link
      href="/favorites"
      aria-label="Избранное"
      className={HEADER_ICON_BUTTON_CLASS}
    >
      <HeartIcon className={HEADER_ICON_CLASS} />
      {mounted && totalItems > 0 && (
        <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#260402] px-1 text-[10px] font-medium leading-none text-white">
          {totalItems}
        </span>
      )}
    </Link>
  );
}
