"use client";

import type { ReactNode } from "react";
import { useSizeCalculatorModal } from "./SizeCalculatorModalProvider";

type SizeCalculatorButtonProps = {
  className?: string;
  onClick?: () => void;
  children?: ReactNode;
  "aria-label"?: string;
};

export function SizeCalculatorButton({
  className = "",
  onClick,
  children = "Калькулятор размера",
  "aria-label": ariaLabel,
}: SizeCalculatorButtonProps) {
  const { openSizeCalculator } = useSizeCalculatorModal();

  return (
    <button
      type="button"
      aria-label={
        ariaLabel ??
        (typeof children === "string" ? children : "Калькулятор размера")
      }
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
