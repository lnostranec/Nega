"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { SizeCalculatorButton } from "@/components/size-calculator/SizeCalculatorButton";
import { useCartStore } from "@/store/cart";

type Variant = {
  id: string;
  size: string;
  color: string | null;
  stock: number;
};

type AddToCartProps = {
  productId: string;
  slug: string;
  name: string;
  price: number;
  imageUrl?: string;
  variants: Variant[];
};

const selectedClass = "border border-brand bg-brand text-white";
const defaultClass =
  "border border-stone-300 bg-white text-stone-700 transition-colors duration-300 hover:border-brand";

/** Адаптивная сетка размеров — кнопки не сжимаются меньше читаемой ширины */
const SIZE_ROW_CLASS = "w-full max-w-[48rem]";
const SIZE_GRID_CLASS =
  "grid gap-2 [grid-template-columns:repeat(auto-fill,minmax(3.5rem,1fr))] sm:[grid-template-columns:repeat(auto-fill,minmax(4rem,1fr))]";
const SIZE_BTN_CLASS =
  "flex h-11 min-h-11 w-full items-center justify-center overflow-hidden px-1 text-xs leading-none sm:h-12 sm:min-h-12 sm:px-1.5 sm:text-sm disabled:cursor-not-allowed disabled:opacity-30";

export function AddToCart({
  productId,
  slug,
  name,
  price,
  imageUrl,
  variants,
}: AddToCartProps) {
  const addItem = useCartStore((s) => s.addItem);
  const cartItems = useCartStore((s) => s.items);

  const colors = [...new Set(variants.map((v) => v.color).filter(Boolean))] as string[];
  const sizes = [...new Set(variants.map((v) => v.size))];

  const [color, setColor] = useState(colors[0] ?? "");
  const [size, setSize] = useState(sizes[0] ?? "");

  const selectedVariant = variants.find(
    (v) => v.size === size && (v.color === color || !v.color),
  );

  const inCartQty =
    cartItems.find((item) => item.variantId === selectedVariant?.id)?.quantity ?? 0;
  const remainingStock = selectedVariant
    ? Math.max(0, selectedVariant.stock - inCartQty)
    : 0;
  const inStock = Boolean(selectedVariant && remainingStock > 0);

  function isColorAvailable(c: string): boolean {
    const variant = variants.find((v) => v.color === c && v.size === size);
    if (!variant) return false;
    const inCart =
      cartItems.find((item) => item.variantId === variant.id)?.quantity ?? 0;
    return variant.stock - inCart > 0;
  }

  function handleAdd() {
    if (!selectedVariant || !inStock) return;
    addItem({
      productId,
      variantId: selectedVariant.id,
      slug,
      name,
      size: selectedVariant.size,
      color: selectedVariant.color ?? undefined,
      price,
      imageUrl,
    });
  }

  return (
    <div className="space-y-6">
      {colors.length > 0 && (
        <div>
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-stone-500">
            Цвет
          </p>
          <div className="flex flex-wrap gap-2">
            {colors.map((c) => {
              const available = isColorAvailable(c);
              return (
                <button
                  key={c}
                  type="button"
                  disabled={!available}
                  onClick={() => setColor(c)}
                  className={`px-4 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-30 ${
                    color === c ? selectedClass : defaultClass
                  } disabled:hover:border-stone-300`}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-stone-500">
            Размер
          </p>
          <SizeCalculatorButton className="text-xs font-medium uppercase tracking-[0.15em] text-[#260402] underline underline-offset-4 transition hover:opacity-70">
            Узнать ваш размер
          </SizeCalculatorButton>
        </div>

        <div className={SIZE_ROW_CLASS}>
          <div className={SIZE_GRID_CLASS}>
            {sizes.map((s) => {
              const variant = variants.find(
                (v) => v.size === s && (v.color === color || !v.color),
              );
              const inCart =
                cartItems.find((item) => item.variantId === variant?.id)?.quantity ??
                0;
              const available = variant && variant.stock - inCart > 0;
              return (
                <button
                  key={s}
                  type="button"
                  disabled={!available}
                  onClick={() => setSize(s)}
                  className={`${SIZE_BTN_CLASS} ${
                    size === s ? selectedClass : defaultClass
                  } disabled:hover:border-stone-300`}
                >
                  {s}
                </button>
              );
            })}
          </div>

          {selectedVariant &&
            selectedVariant.stock > 0 &&
            selectedVariant.stock <= 5 && (
              <p className="mt-3 text-sm text-amber-800">
                {remainingStock <= 5
                  ? `Осталось ${remainingStock} шт.`
                  : `На складе ${selectedVariant.stock} шт.`}
              </p>
            )}

          {inCartQty > 0 && (
            <p className="mt-2 text-sm text-stone-500">В корзине: {inCartQty} шт.</p>
          )}

          <Button
            className="mt-6 w-full py-4"
            disabled={!inStock}
            onClick={handleAdd}
          >
            {inStock ? "Добавить в корзину" : "Нет в наличии"}
          </Button>
        </div>
      </div>
    </div>
  );
}
