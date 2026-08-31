"use client";

import { CalculatorIcon } from "@/components/icons";
import { SizeCalculatorButton } from "@/components/size-calculator/SizeCalculatorButton";
import {
  HEADER_ICON_BUTTON_CLASS,
  HEADER_ICON_CLASS,
} from "./header-icon-styles";

export function SizeCalculatorHeaderButton() {
  return (
    <SizeCalculatorButton
      aria-label="Калькулятор размера"
      className={`${HEADER_ICON_BUTTON_CLASS} lg:hidden`}
    >
      <CalculatorIcon className={HEADER_ICON_CLASS} />
    </SizeCalculatorButton>
  );
}
