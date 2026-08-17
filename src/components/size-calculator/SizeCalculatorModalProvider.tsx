"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { SizeCalculatorModal } from "./SizeCalculatorModal";

type SizeCalculatorModalContextValue = {
  openSizeCalculator: () => void;
  closeSizeCalculator: () => void;
};

const SizeCalculatorModalContext =
  createContext<SizeCalculatorModalContextValue | null>(null);

export function SizeCalculatorModalProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  const openSizeCalculator = useCallback(() => setOpen(true), []);
  const closeSizeCalculator = useCallback(() => setOpen(false), []);

  return (
    <SizeCalculatorModalContext.Provider
      value={{ openSizeCalculator, closeSizeCalculator }}
    >
      {children}
      <SizeCalculatorModal open={open} onClose={closeSizeCalculator} />
    </SizeCalculatorModalContext.Provider>
  );
}

export function useSizeCalculatorModal() {
  const context = useContext(SizeCalculatorModalContext);
  if (!context) {
    throw new Error(
      "useSizeCalculatorModal must be used within SizeCalculatorModalProvider",
    );
  }
  return context;
}
