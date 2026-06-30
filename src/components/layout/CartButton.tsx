"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BagIcon } from "@/components/icons";
import { usePrefersHover } from "@/hooks/usePrefersHover";
import { PLACEHOLDER_PRODUCT } from "@/lib/constants";
import { formatPrice } from "@/lib/format";
import { useCartStore } from "@/store/cart";
import {
  HEADER_ICON_BUTTON_CLASS,
  HEADER_ICON_CLASS,
} from "./header-icon-styles";

const PREVIEW_LIMIT = 2;
const CLOSE_DELAY_MS = 120;

export function CartButton() {
  const items = useCartStore((s) => s.items);
  const totalItems = useCartStore((s) => s.totalItems());
  const prefersHover = usePrefersHover();
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setMounted(true);
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!previewOpen || prefersHover) return;

    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setPreviewOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [previewOpen, prefersHover]);

  function openPreview() {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setPreviewOpen(true);
  }

  function scheduleClosePreview() {
    if (!prefersHover) return;
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => {
      setPreviewOpen(false);
      closeTimerRef.current = null;
    }, CLOSE_DELAY_MS);
  }

  function handleCartTriggerClick() {
    if (prefersHover || items.length === 0) return;
    setPreviewOpen((open) => !open);
  }

  const previewItems = items.slice(0, PREVIEW_LIMIT);
  const extraCount = Math.max(0, items.length - PREVIEW_LIMIT);
  const hasItems = mounted && items.length > 0;
  const showPreview = hasItems && previewOpen;

  const triggerClass = `${HEADER_ICON_BUTTON_CLASS} relative`;
  const badge =
    mounted && totalItems > 0 ? (
      <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#260402] px-1 text-[10px] font-medium leading-none text-white">
        {totalItems}
      </span>
    ) : null;

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={prefersHover ? openPreview : undefined}
      onMouseLeave={prefersHover ? scheduleClosePreview : undefined}
    >
      {prefersHover || items.length === 0 ? (
        <Link href="/cart" aria-label="Корзина" className={triggerClass}>
          <BagIcon className={HEADER_ICON_CLASS} />
          {badge}
        </Link>
      ) : (
        <button
          type="button"
          aria-label="Корзина"
          aria-expanded={showPreview}
          onClick={handleCartTriggerClick}
          className={triggerClass}
        >
          <BagIcon className={HEADER_ICON_CLASS} />
          {badge}
        </button>
      )}

      {hasItems && (
        <div
          className={`absolute right-0 top-full z-50 w-72 pt-2 transition-opacity duration-150 ${
            showPreview
              ? "pointer-events-auto opacity-100"
              : "pointer-events-none opacity-0"
          }`}
          aria-hidden={!showPreview}
        >
          <div className="border border-stone-200 bg-white shadow-lg">
            <ul className="divide-y divide-stone-100">
              {previewItems.map((item) => (
                <li key={item.variantId}>
                  <Link
                    href={`/product/${item.slug}`}
                    onClick={() => setPreviewOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 transition hover:bg-stone-50"
                  >
                    <div className="relative h-14 w-11 shrink-0 overflow-hidden bg-stone-50">
                      <Image
                        src={item.imageUrl || PLACEHOLDER_PRODUCT}
                        alt={item.name}
                        fill
                        className="object-contain p-1"
                        sizes="44px"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium uppercase tracking-wide text-[#260402]">
                        {item.name}
                      </p>
                      <p className="mt-0.5 text-xs text-stone-500">
                        {item.quantity > 1
                          ? `${item.quantity} × ${formatPrice(item.price)}`
                          : formatPrice(item.price)}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>

            {extraCount > 0 && (
              <p className="border-t border-stone-100 px-4 py-2 text-xs text-stone-500">
                и ещё {extraCount}{" "}
                {extraCount === 1 ? "товар" : extraCount < 5 ? "товара" : "товаров"}
              </p>
            )}

            <div className="border-t border-stone-100 p-3">
              <Link
                href="/cart"
                onClick={() => setPreviewOpen(false)}
                className="btn-site btn-site-filled block w-full bg-brand py-2.5 text-center text-xs font-medium uppercase tracking-widest text-white"
              >
                Перейти в корзину
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
