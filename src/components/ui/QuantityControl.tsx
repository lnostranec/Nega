"use client";

type QuantityControlProps = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
};

export function QuantityControl({
  value,
  onChange,
  min = 1,
  max,
}: QuantityControlProps) {
  const atMax = max !== undefined && value >= max;

  return (
    <div className="flex h-10 items-stretch border border-stone-300 transition-colors duration-300 focus-within:border-brand hover:border-brand">
      <button
        type="button"
        aria-label="Уменьшить количество"
        onClick={() => onChange(value - 1)}
        disabled={value <= min}
        className="flex w-10 items-center justify-center text-lg text-stone-600 transition-colors duration-300 hover:bg-brand hover:text-white active:bg-brand active:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-stone-600"
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
        className="w-12 border-x border-stone-300 text-center text-sm outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <button
        type="button"
        aria-label="Увеличить количество"
        onClick={() => onChange(value + 1)}
        disabled={atMax}
        className="flex w-10 items-center justify-center text-lg text-stone-600 transition-colors duration-300 hover:bg-brand hover:text-white active:bg-brand active:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-stone-600"
      >
        +
      </button>
    </div>
  );
}
