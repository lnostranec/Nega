"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { BagIcon } from "@/components/icons";
import { usePrefersHover } from "@/hooks/usePrefersHover";
import { useIsClient } from "@/hooks/useIsClient";
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
  const previewRef = useRef<HTMLDivElement>(null);
  const mounted = useIsClient();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTop, setPreviewTop] = useState(92);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  const showPreview = mounted && items.length > 0 && previewOpen;

  useEffect(() => {
    if (!showPreview || prefersHover) return;

    function updateTop() {
      const header = document.querySelector<HTMLElement>("[data-site-header]");
      if (header) {
        setPreviewTop(Math.round(header.getBoundingClientRect().bottom));
      }
    }

    updateTop();
    window.addEventListener("resize", updateTop);
    window.addEventListener("scroll", updateTop, true);
    return () => {
      window.removeEventListener("resize", updateTop);
      window.removeEventListener("scroll", updateTop, true);
    };
  }, [showPreview, prefersHover]);

  useEffect(() => {
    if (!showPreview || prefersHover) return;

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (
        containerRef.current?.contains(target) ||
        previewRef.current?.contains(target)
      ) {
        return;
      }
      setPreviewOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [showPreview, prefersHover]);

  function measurePreviewTop() {
    const header = document.querySelector<HTMLElement>("[data-site-header]");
    if (header) {
      setPreviewTop(Math.round(header.getBoundingClientRect().bottom));
    }
  }

  function openPreview() {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    measurePreviewTop();
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
    measurePreviewTop();
    setPreviewOpen((open) => !open);
  }

  const previewItems = items.slice(0, PREVIEW_LIMIT);
  const extraCount = Math.max(0, items.length - PREVIEW_LIMIT);

  const triggerClass = `${HEADER_ICON_BUTTON_CLASS} relative`;
  const badge =
    mounted && totalItems > 0 ? (
      <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#260402] px-1 text-[10px] font-medium leading-none text-white">
        {totalItems}
      </span>
    ) : null;

  const previewPanel = showPreview ? (
    prefersHover ? (
      <div
        ref={previewRef}
        className="absolute right-0 top-full z-50 w-72 pt-2"
        onMouseEnter={openPreview}
        onMouseLeave={scheduleClosePreview}
      >
        <CartPreviewContent
          previewItems={previewItems}
          extraCount={extraCount}
          onNavigate={() => setPreviewOpen(false)}
        />
      </div>
    ) : (
      createPortal(
        <div
          ref={previewRef}
          className="fixed inset-x-0 z-40 w-full"
          style={{ top: previewTop }}
        >
          <CartPreviewContent
            previewItems={previewItems}
            extraCount={extraCount}
            onNavigate={() => setPreviewOpen(false)}
            fullWidth
          />
        </div>,
        document.body,
      )
    )
  ) : null;

  return (
    <div
      ref={containerRef}
      className="relative shrink-0"
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

      {previewPanel}
    </div>
  );
}

type PreviewItem = {
  variantId: string;
  slug: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
};

function CartPreviewContent({
  previewItems,
  extraCount,
  onNavigate,
  fullWidth = false,
}: {
  previewItems: PreviewItem[];
  extraCount: number;
  onNavigate: () => void;
  fullWidth?: boolean;
}) {
  return (
    <div
      className={`border border-stone-200 bg-white shadow-lg ${
        fullWidth ? "border-x-0 shadow-md" : ""
      }`}
    >
      <ul className="divide-y divide-stone-100">
        {previewItems.map((item) => (
          <li key={item.variantId}>
            <Link
              href={`/product/${item.slug}`}
              onClick={onNavigate}
              className="flex items-center gap-3 px-4 py-3 transition hover:bg-stone-50"
            >
              <div className="flex h-14 w-11 shrink-0 items-center justify-center overflow-hidden bg-stone-50">
                <Image
                  src={item.imageUrl || PLACEHOLDER_PRODUCT}
                  alt={item.name}
                  width={44}
                  height={56}
                  className="h-full w-full object-cover"
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
          onClick={onNavigate}
          className="btn-site btn-site-filled block w-full bg-brand py-2.5 text-center text-xs font-medium uppercase tracking-widest text-white"
        >
          Перейти в корзину
        </Link>
      </div>
    </div>
  );
}
