"use client";

import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/format";

type PriceRangeSliderProps = {
  min: number;
  max: number;
  valueMin: number;
  valueMax: number;
  onChange: (min: number, max: number) => void;
};

export function PriceRangeSlider({
  min,
  max,
  valueMin,
  valueMax,
  onChange,
}: PriceRangeSliderProps) {
  const [localMin, setLocalMin] = useState(valueMin);
  const [localMax, setLocalMax] = useState(valueMax);

  useEffect(() => {
    setLocalMin(valueMin);
    setLocalMax(valueMax);
  }, [valueMin, valueMax]);

  const range = Math.max(max - min, 1);
  const minPercent = ((localMin - min) / range) * 100;
  const maxPercent = ((localMax - min) / range) * 100;

  function handleMinChange(next: number) {
    const clamped = Math.min(next, localMax - 100);
    setLocalMin(clamped);
    onChange(clamped, localMax);
  }

  function handleMaxChange(next: number) {
    const clamped = Math.max(next, localMin + 100);
    setLocalMax(clamped);
    onChange(localMin, clamped);
  }

  return (
    <div className="px-1 py-2">
      <div className="mb-4 flex items-center justify-between text-sm text-stone-700">
        <span>{formatPrice(localMin)}</span>
        <span>{formatPrice(localMax)}</span>
      </div>

      <div className="relative h-6">
        <div className="absolute top-1/2 h-0.5 w-full -translate-y-1/2 rounded bg-stone-200" />
        <div
          className="absolute top-1/2 h-0.5 -translate-y-1/2 rounded bg-[#260402]"
          style={{
            left: `${minPercent}%`,
            width: `${Math.max(maxPercent - minPercent, 0)}%`,
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={100}
          value={localMin}
          onChange={(e) => handleMinChange(Number(e.target.value))}
          className="pointer-events-none absolute inset-0 h-6 w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-stone-300 [&::-webkit-slider-thumb]:bg-white"
        />
        <input
          type="range"
          min={min}
          max={max}
          step={100}
          value={localMax}
          onChange={(e) => handleMaxChange(Number(e.target.value))}
          className="pointer-events-none absolute inset-0 h-6 w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-stone-300 [&::-webkit-slider-thumb]:bg-white"
        />
      </div>
    </div>
  );
}
