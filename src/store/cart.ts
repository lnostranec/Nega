"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartValidateLine } from "@/lib/cart-validation";

export type CartItem = {
  productId: string;
  variantId: string;
  slug: string;
  name: string;
  size: string;
  color?: string;
  price: number;
  imageUrl?: string;
  quantity: number;
};

type CartState = {
  items: CartItem[];
  usePoints: boolean;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number, maxStock?: number) => void;
  clearCart: () => void;
  setUsePoints: (value: boolean) => void;
  applyValidation: (lines: CartValidateLine[]) => void;
  totalItems: () => number;
  totalPrice: () => number;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      usePoints: false,
      addItem: (item, quantity = 1) => {
        set((state) => {
          const existing = state.items.find((i) => i.variantId === item.variantId);
          const nextQty = (existing?.quantity ?? 0) + quantity;
          if (nextQty < 1) return state;

          if (existing) {
            return {
              items: state.items.map((i) =>
                i.variantId === item.variantId
                  ? { ...i, quantity: nextQty }
                  : i,
              ),
            };
          }
          return { items: [...state.items, { ...item, quantity: nextQty }] };
        });
      },
      removeItem: (variantId) => {
        set((state) => ({
          items: state.items.filter((i) => i.variantId !== variantId),
        }));
      },
      updateQuantity: (variantId, quantity, maxStock) => {
        if (quantity < 1) {
          get().removeItem(variantId);
          return;
        }
        const capped =
          maxStock !== undefined && maxStock !== null
            ? Math.min(quantity, maxStock)
            : quantity;
        set((state) => ({
          items: state.items.map((i) =>
            i.variantId === variantId ? { ...i, quantity: capped } : i,
          ),
        }));
      },
      clearCart: () => set({ items: [], usePoints: false }),
      setUsePoints: (value) => set({ usePoints: value }),
      applyValidation: (lines) => {
        set((state) => {
          const lineMap = new Map(lines.map((line) => [line.variantId, line]));
          let changed = false;

          const nextItems = state.items
            .map((item) => {
              const line = lineMap.get(item.variantId);
              if (!line) return item;

              if (line.unavailable || line.suggestedQuantity < 1) {
                changed = true;
                return null;
              }

              const quantity = line.suggestedQuantity;
              const price = line.currentPrice;

              if (quantity !== item.quantity || price !== item.price) {
                changed = true;
                return { ...item, quantity, price };
              }

              return item;
            })
            .filter((item): item is CartItem => item !== null);

          if (!changed && nextItems.length === state.items.length) {
            return state;
          }

          return { items: nextItems };
        });
      },
      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      totalPrice: () =>
        get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    }),
    { name: "nega-cart" },
  ),
);
