"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
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

const selectedClass =
  "border border-brand bg-brand text-white";
const defaultClass =
  "border border-stone-300 bg-white text-stone-700 transition-colors duration-300 hover:border-brand";

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
    const variant = variants.find(
      (v) => v.color === c && v.size === size,
    );
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
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-stone-500">
          Размер
        </p>
        <div className="flex flex-wrap gap-2">
          {sizes.map((s) => {
            const variant = variants.find(
              (v) => v.size === s && (v.color === color || !v.color),
            );
            const inCart =
              cartItems.find((item) => item.variantId === variant?.id)?.quantity ?? 0;
            const available = variant && variant.stock - inCart > 0;
            return (
              <button
                key={s}
                type="button"
                disabled={!available}
                onClick={() => setSize(s)}
                className={`min-w-12 px-4 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-30 ${
                  size === s ? selectedClass : defaultClass
                } disabled:hover:border-stone-300`}
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>

      {selectedVariant && selectedVariant.stock > 0 && selectedVariant.stock <= 5 && (
        <p className="text-sm text-amber-800">
          {remainingStock <= 5
            ? `Осталось ${remainingStock} шт.`
            : `На складе ${selectedVariant.stock} шт.`}
        </p>
      )}

      {inCartQty > 0 && (
        <p className="text-sm text-stone-500">В корзине: {inCartQty} шт.</p>
      )}

      <Button className="w-full py-4" disabled={!inStock} onClick={handleAdd}>
        {inStock ? "Добавить в корзину" : "Нет в наличии"}
      </Button>
    </div>
  );
}
