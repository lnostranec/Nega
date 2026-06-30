"use client";

import { useEffect, useRef } from "react";
import { ChevronDownIcon } from "@/components/icons";

type FilterChipProps = {
  label: string;
  active?: boolean;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  children: React.ReactNode;
  showChevron?: boolean;
};

export function FilterChip({
  label,
  active = false,
  open,
  onToggle,
  onClose,
  children,
  showChevron = true,
}: FilterChipProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (!ref.current?.contains(event.target as Node)) {
        onClose();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open, onClose]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className={`inline-flex items-center gap-2 rounded-md border px-4 py-2.5 text-sm transition ${
          active || open
            ? "border-[#260402] bg-white text-[#260402]"
            : "border-stone-300 bg-white text-stone-800 hover:border-stone-400"
        }`}
      >
        <span className="whitespace-nowrap">{label}</span>
        {showChevron && (
          <ChevronDownIcon
            className={`h-3.5 w-3.5 shrink-0 transition ${open ? "rotate-180" : ""}`}
          />
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-full z-30 mt-2 min-w-[220px] rounded-md border border-stone-200 bg-white p-3 shadow-lg">
          {children}
        </div>
      )}
    </div>
  );
}
