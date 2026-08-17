"use client";

type QuantityControlProps = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  size?: "sm" | "md";
};

export function QuantityControl({
  value,
  onChange,
  min = 1,
  max,
  size = "md",
}: QuantityControlProps) {
  const atMax = max !== undefined && value >= max;
  const isSm = size === "sm";

  return (
    <div
      className={`flex items-stretch border border-stone-300 transition-colors duration-300 ${
        isSm ? "h-8" : "h-10 focus-within:border-brand hover:border-brand"
      }`}
    >
      <button
        type="button"
        aria-label="Уменьшить количество"
        onClick={() => onChange(value - 1)}
        disabled={value <= min}
        className={`flex items-center justify-center text-stone-600 disabled:opacity-30 ${
          isSm
            ? "w-8 touch-manipulation text-base [-webkit-tap-highlight-color:transparent]"
            : "w-10 cursor-pointer text-lg transition-colors duration-300 hover:bg-brand hover:text-white active:bg-brand active:text-white disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-stone-600"
        }`}
      >
        −
      </button>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => {
          const next = parseInt(e.target.value, 10);
          if (Number.isNaN(next) || next < min) return;
          onChange(max !== undefined ? Math.min(next, max) : next);
        }}
        className={`border-x border-stone-300 text-center outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${
          isSm ? "w-9 text-xs" : "w-12 text-sm"
        }`}
      />
      <button
        type="button"
        aria-label="Увеличить количество"
        onClick={() => onChange(value + 1)}
        disabled={atMax}
        className={`flex items-center justify-center text-stone-600 disabled:opacity-30 ${
          isSm
            ? "w-8 touch-manipulation text-base [-webkit-tap-highlight-color:transparent]"
            : "w-10 cursor-pointer text-lg transition-colors duration-300 hover:bg-brand hover:text-white active:bg-brand active:text-white disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-stone-600"
        }`}
      >
        +
      </button>
    </div>
  );
}
