"use client";

import type { ReactNode } from "react";
import { useSizeCalculatorModal } from "./SizeCalculatorModalProvider";

type SizeCalculatorButtonProps = {
  className?: string;
  onClick?: () => void;
  children?: ReactNode;
};

export function SizeCalculatorButton({
  className = "",
  onClick,
  children = "Калькулятор размера",
}: SizeCalculatorButtonProps) {
  const { openSizeCalculator } = useSizeCalculatorModal();

  return (
    <button
      type="button"
      onClick={() => {
        onClick?.();
        openSizeCalculator();
      }}
      className={className ? `cursor-pointer ${className}` : "cursor-pointer"}
    >
      {children}
    </button>
  );
}
