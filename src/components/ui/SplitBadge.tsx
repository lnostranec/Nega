import { formatPrice } from "@/lib/format";

type SplitBadgeProps = {
  price: number;
  parts?: number;
};

export function SplitBadge({ price, parts = 4 }: SplitBadgeProps) {
  const installment = Math.ceil(price / parts);

  return (
    <div className="inline-flex h-9 max-w-full items-stretch overflow-hidden rounded-full border border-stone-200 text-[11px] leading-none sm:text-xs">
      <span className="flex shrink-0 items-center gap-0.5 rounded-l-full bg-brand px-2.5 font-medium text-white sm:gap-1 sm:px-4">
        <span className="font-bold">₽</span>
        <span className="whitespace-nowrap tabular-nums">
          {installment.toLocaleString("ru-RU")} ₽
        </span>
      </span>
      <span className="flex shrink-0 items-center rounded-r-full border-l border-stone-200 bg-white px-2.5 text-stone-600 sm:px-4">
        <span className="whitespace-nowrap sm:hidden">× {parts} в Сплит</span>
        <span className="hidden whitespace-nowrap sm:inline">× {parts} платежа в Сплит</span>
      </span>
    </div>
  );
}

export function formatPricePlain(value: number): string {
  return `${value.toLocaleString("ru-RU")} ₽`;
}
