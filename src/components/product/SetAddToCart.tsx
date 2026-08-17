"use client";

import Image from "next/image";
import { useMemo, useRef, useState } from "react";
import type { CSSProperties, TransitionEvent } from "react";
import { Button } from "@/components/ui/Button";
import { SizeCalculatorButton } from "@/components/size-calculator/SizeCalculatorButton";
import { useCartStore } from "@/store/cart";
import { formatPrice } from "@/lib/format";
import {
  buildSetAddonCartKey,
  buildSetCartKey,
  formatSetSizeLabel,
} from "@/lib/product-sets";

type Variant = {
  id: string;
  size: string;
  color: string | null;
  stock: number;
  part: string;
};

type BottomModel = {
  id: string;
  name: string;
};

type SetAddon = {
  id: string;
  name: string;
  price: number;
  imageUrl?: string | null;
  note?: string | null;
};

type SetAddToCartProps = {
  productId: string;
  slug: string;
  name: string;
  price: number;
  imageUrl?: string;
  variants: Variant[];
  bottomModels: BottomModel[];
  setAddons?: SetAddon[];
};

const selectedClass = "border border-brand bg-brand text-white";
const defaultClass =
  "border border-stone-300 bg-white text-stone-700 transition-colors duration-300 hover:border-brand";
const SIZE_ROW_CLASS = "w-full max-w-[48rem]";
const SIZE_GRID_CLASS =
  "grid gap-2 [grid-template-columns:repeat(auto-fill,minmax(3.5rem,1fr))] sm:[grid-template-columns:repeat(auto-fill,minmax(4rem,1fr))]";
const SIZE_BTN_CLASS =
  "flex h-11 min-h-11 w-full items-center justify-center overflow-hidden px-1 text-xs leading-none sm:h-12 sm:min-h-12 sm:px-1.5 sm:text-sm disabled:cursor-not-allowed disabled:opacity-30";

export function SetAddToCart({
  productId,
  slug,
  name,
  price,
  imageUrl,
  variants,
  bottomModels,
  setAddons = [],
}: SetAddToCartProps) {
  const addItem = useCartStore((s) => s.addItem);
  const cartItems = useCartStore((s) => s.items);

  const topVariants = useMemo(
    () => variants.filter((v) => v.part === "TOP"),
    [variants],
  );
  const bottomVariants = useMemo(
    () => variants.filter((v) => v.part === "BOTTOM"),
    [variants],
  );

  const colors = useMemo(
    () =>
      [
        ...new Set(
          [...topVariants, ...bottomVariants]
            .map((v) => v.color)
            .filter(Boolean),
        ),
      ] as string[],
    [topVariants, bottomVariants],
  );

  const [color, setColor] = useState(colors[0] ?? "");
  const [topSize, setTopSize] = useState("");
  const [bottomSize, setBottomSize] = useState("");
  const [bottomModel, setBottomModel] = useState(bottomModels[0]?.name ?? "");
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
  const [modelsOpen, setModelsOpen] = useState(false);
  const [panelStyle, setPanelStyle] = useState<CSSProperties>({ height: 0 });
  const modelsContentRef = useRef<HTMLDivElement>(null);

  function closeModels() {
    const node = modelsContentRef.current;
    const fullHeight = node?.scrollHeight ?? 0;
    setPanelStyle({ height: fullHeight });
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setPanelStyle({ height: 0 });
        setModelsOpen(false);
      });
    });
  }

  function toggleModels() {
    const node = modelsContentRef.current;
    if (!node) return;
    const fullHeight = node.scrollHeight;

    if (modelsOpen) {
      closeModels();
      return;
    }

    setModelsOpen(true);
    setPanelStyle({ height: fullHeight });
  }

  function handlePanelTransitionEnd(event: TransitionEvent<HTMLDivElement>) {
    if (event.propertyName !== "height") return;
    if (!modelsOpen) return;
    setPanelStyle({ height: "auto" });
  }

  function toggleAddon(id: string) {
    setSelectedAddonIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  const topSizes = useMemo(() => {
    const sizes = [
      ...new Set(
        topVariants
          .filter((v) => v.color === color || (!v.color && !color))
          .map((v) => v.size),
      ),
    ];
    return sizes;
  }, [topVariants, color]);

  const bottomSizes = useMemo(() => {
    return [
      ...new Set(
        bottomVariants
          .filter((v) => v.color === color || (!v.color && !color))
          .map((v) => v.size),
      ),
    ];
  }, [bottomVariants, color]);

  const selectedTop = topVariants.find(
    (v) =>
      v.size === (topSize || topSizes[0]) &&
      (v.color === color || (!v.color && !color)),
  );
  const selectedBottom = bottomVariants.find(
    (v) =>
      v.size === (bottomSize || bottomSizes[0]) &&
      (v.color === color || (!v.color && !color)),
  );

  const effectiveTop = topSize || topSizes[0] || "";
  const effectiveBottom = bottomSize || bottomSizes[0] || "";
  const effectiveModel = bottomModel || bottomModels[0]?.name || "";

  const cartKey =
    selectedTop && selectedBottom && effectiveModel
      ? buildSetCartKey(selectedTop.id, selectedBottom.id, effectiveModel)
      : "";

  const inCartQty =
    cartItems.find((item) => item.variantId === cartKey)?.quantity ?? 0;

  const topStock = selectedTop
    ? Math.max(0, selectedTop.stock - inCartQty)
    : 0;
  const bottomStock = selectedBottom
    ? Math.max(0, selectedBottom.stock - inCartQty)
    : 0;
  const remainingStock = Math.min(topStock, bottomStock);
  const inStock = Boolean(
    selectedTop &&
      selectedBottom &&
      effectiveModel &&
      remainingStock > 0,
  );

  function sizeAvailable(list: Variant[], size: string): boolean {
    const variant = list.find(
      (v) => v.size === size && (v.color === color || (!v.color && !color)),
    );
    if (!variant) return false;
    return variant.stock > 0;
  }

  function handleAdd() {
    if (!selectedTop || !selectedBottom || !effectiveModel || !inStock) return;
    addItem({
      productId,
      variantId: buildSetCartKey(
        selectedTop.id,
        selectedBottom.id,
        effectiveModel,
      ),
      slug,
      name,
      size: formatSetSizeLabel(effectiveTop, effectiveBottom, effectiveModel),
      color: color || undefined,
      price,
      imageUrl,
      sizeTop: effectiveTop,
      sizeBottom: effectiveBottom,
      bottomModel: effectiveModel,
      bottomVariantId: selectedBottom.id,
    });

    for (const addon of setAddons) {
      if (!selectedAddonIds.includes(addon.id)) continue;
      addItem({
        productId,
        variantId: buildSetAddonCartKey(addon.id),
        slug,
        name: `${name} · ${addon.name}`,
        size: "доп. к комплекту",
        color: color || undefined,
        price: addon.price,
        imageUrl: addon.imageUrl ?? undefined,
      });
    }
  }

  return (
    <div className="space-y-6">
      {colors.length > 0 && (
        <div>
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-stone-500">
            Цвет
          </p>
          <div className="flex flex-wrap gap-2">
            {colors.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  setColor(c);
                  setTopSize("");
                  setBottomSize("");
                }}
                className={`px-4 py-2.5 text-sm ${
                  color === c ? selectedClass : defaultClass
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-stone-500">
            Размер верха
          </p>
          <SizeCalculatorButton className="text-xs font-medium uppercase tracking-[0.15em] text-[#260402] underline underline-offset-4 transition hover:opacity-70">
            Узнать ваш размер
          </SizeCalculatorButton>
        </div>
        <div className={SIZE_ROW_CLASS}>
          <div className={SIZE_GRID_CLASS}>
            {topSizes.map((s) => {
              const available = sizeAvailable(topVariants, s);
              return (
                <button
                  key={s}
                  type="button"
                  disabled={!available}
                  onClick={() => setTopSize(s)}
                  className={`${SIZE_BTN_CLASS} ${
                    effectiveTop === s ? selectedClass : defaultClass
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div>
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-stone-500">
          Размер низа
        </p>
        <div className={SIZE_ROW_CLASS}>
          <div className={SIZE_GRID_CLASS}>
            {bottomSizes.map((s) => {
              const available = sizeAvailable(bottomVariants, s);
              return (
                <button
                  key={s}
                  type="button"
                  disabled={!available}
                  onClick={() => setBottomSize(s)}
                  className={`${SIZE_BTN_CLASS} ${
                    effectiveBottom === s ? selectedClass : defaultClass
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {bottomModels.length > 0 && (
        <div className={SIZE_ROW_CLASS}>
          <button
            type="button"
            onClick={toggleModels}
            aria-expanded={modelsOpen}
            className="flex w-full items-center justify-between rounded-md border border-[#260402] bg-white px-4 py-3 text-left transition hover:bg-stone-50"
          >
            <span>
              <span className="block text-[11px] uppercase tracking-[0.16em] text-stone-400">
                Модель низа
              </span>
              <span className="mt-1 block text-sm font-medium text-[#260402]">
                {effectiveModel || "Выбрать"}
              </span>
            </span>
            <span
              className={`text-stone-500 transition-transform duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                modelsOpen ? "rotate-180" : ""
              }`}
              aria-hidden
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                className="h-5 w-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m6 9 6 6 6-6"
                />
              </svg>
            </span>
          </button>

          <div
            className="overflow-hidden transition-[height] duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={panelStyle}
            onTransitionEnd={handlePanelTransitionEnd}
          >
            <div ref={modelsContentRef} className="pt-3 pb-1">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {bottomModels.map((model) => {
                  const selected = effectiveModel === model.name;
                  return (
                    <button
                      key={model.id}
                      type="button"
                      tabIndex={modelsOpen ? 0 : -1}
                      onClick={() => {
                        setBottomModel(model.name);
                        if (modelsOpen) closeModels();
                      }}
                      className={`min-h-[3.25rem] rounded-md border px-3 py-2.5 text-center text-sm leading-snug transition-colors duration-200 ${
                        selected
                          ? "border-brand bg-brand text-white"
                          : "border-stone-300 bg-white text-stone-700 hover:border-brand"
                      }`}
                    >
                      {model.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {setAddons.length > 0 && (
        <div className={SIZE_ROW_CLASS}>
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-stone-500">
            Добавить к заказу
          </p>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:thin]">
            {setAddons.map((addon) => {
              const selected = selectedAddonIds.includes(addon.id);
              return (
                <button
                  key={addon.id}
                  type="button"
                  onClick={() => toggleAddon(addon.id)}
                  aria-pressed={selected}
                  className={`relative w-[calc((100%-1rem)/3)] shrink-0 overflow-hidden rounded-md border bg-white text-left transition ${
                    selected
                      ? "border-[#260402]"
                      : "border-stone-200 hover:border-stone-300"
                  }`}
                >
                  <span
                    className={`absolute right-1.5 top-1.5 z-10 flex h-5 w-5 items-center justify-center rounded-full border transition ${
                      selected
                        ? "border-[#260402] bg-[#260402] text-white"
                        : "border-stone-300 bg-white/90 text-transparent"
                    }`}
                    aria-hidden
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      className="h-3 w-3"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m3.5 8.5 3 3 6-6"
                      />
                    </svg>
                  </span>
                  <div className="relative aspect-square bg-stone-50">
                    {addon.imageUrl ? (
                      <Image
                        src={addon.imageUrl}
                        alt={addon.name}
                        fill
                        className="object-cover"
                        sizes="160px"
                      />
                    ) : (
                      <span className="flex h-full items-center justify-center text-[10px] text-stone-400">
                        Нет фото
                      </span>
                    )}
                  </div>
                  <div className="space-y-0.5 px-2 py-2">
                    <p className="truncate text-xs font-medium text-stone-900">
                      {addon.name}
                    </p>
                    <p className="text-xs text-[#8B4513]">
                      +{formatPrice(addon.price)}
                    </p>
                    {addon.note && (
                      <p className="line-clamp-2 text-[10px] leading-snug text-stone-400">
                        ({addon.note})
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {inCartQty > 0 && (
        <p className="text-sm text-stone-500">В корзине: {inCartQty} шт.</p>
      )}

      <div className={SIZE_ROW_CLASS}>
        <Button className="w-full py-4" disabled={!inStock} onClick={handleAdd}>
          {inStock ? "Добавить в корзину" : "Выберите размеры"}
        </Button>
      </div>
    </div>
  );
}
