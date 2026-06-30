"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CartValidateLine } from "@/lib/cart-validation";
import { useCartStore, type CartItem } from "@/store/cart";

type CartValidationState = {
  validating: boolean;
  messages: string[];
  stockByVariant: Record<string, number | null>;
  lines: CartValidateLine[];
};

const initialState: CartValidationState = {
  validating: false,
  messages: [],
  stockByVariant: {},
  lines: [],
};

function itemsFingerprint(items: CartItem[]): string {
  return items
    .map((item) => `${item.variantId}:${item.quantity}:${item.price}`)
    .join("|");
}

export function useCartValidation() {
  const items = useCartStore((s) => s.items);
  const applyValidation = useCartStore((s) => s.applyValidation);
  const [state, setState] = useState<CartValidationState>(initialState);
  const lastSyncedFingerprint = useRef<string>("");

  const validate = useCallback(async () => {
    if (items.length === 0) {
      setState(initialState);
      lastSyncedFingerprint.current = "";
      return;
    }

    setState((prev) => ({ ...prev, validating: true }));

    try {
      const response = await fetch("/api/cart/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            price: item.price,
            quantity: item.quantity,
          })),
        }),
      });

      if (!response.ok) {
        setState((prev) => ({ ...prev, validating: false }));
        return;
      }

      const data = await response.json();
      const lines = data.lines as CartValidateLine[];
      const messages = data.messages as string[];

      applyValidation(lines);

      const stockByVariant = Object.fromEntries(
        lines.map((line) => [line.variantId, line.stock]),
      );

      setState({
        validating: false,
        messages,
        stockByVariant,
        lines,
      });
    } catch {
      setState((prev) => ({ ...prev, validating: false }));
    }
  }, [items, applyValidation]);

  useEffect(() => {
    const fingerprint = itemsFingerprint(items);
    if (fingerprint === lastSyncedFingerprint.current) return;

    lastSyncedFingerprint.current = fingerprint;
    void validate();
  }, [items, validate]);

  return { ...state, revalidate: validate };
}
