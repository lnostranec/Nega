"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type FavoriteItem = {
  productId: string;
  slug: string;
  name: string;
  price: number;
  imageUrl?: string;
};

type FavoritesState = {
  items: FavoriteItem[];
  addItem: (item: FavoriteItem) => void;
  removeItem: (productId: string) => void;
  toggleItem: (item: FavoriteItem) => void;
  isFavorite: (productId: string) => boolean;
  clearAll: () => void;
  totalItems: () => number;
};

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        set((state) => {
          if (state.items.some((i) => i.productId === item.productId)) {
            return state;
          }
          return { items: [...state.items, item] };
        });
      },
      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        }));
      },
      toggleItem: (item) => {
        const exists = get().items.some((i) => i.productId === item.productId);
        if (exists) {
          get().removeItem(item.productId);
        } else {
          get().addItem(item);
        }
      },
      isFavorite: (productId) =>
        get().items.some((i) => i.productId === productId),
      clearAll: () => set({ items: [] }),
      totalItems: () => get().items.length,
    }),
    { name: "nega-favorites" },
  ),
);
