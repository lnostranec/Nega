"use client";

import { useState } from "react";
import { AddToCart } from "@/components/product/AddToCart";
import { SetAddToCart } from "@/components/product/SetAddToCart";
import { ProductFavoriteButton } from "@/components/product/ProductFavoriteButton";
import { SplitBadge } from "@/components/ui/SplitBadge";
import { formatPrice } from "@/lib/format";

type Variant = {
  id: string;
  size: string;
  color: string | null;
  stock: number;
  part?: string;
};

type BottomModel = {
  id: string;
  name: string;
};

type SetAddon = {
  id: string;
  name: string;
  price: number;
  imageUrl?: string | null;
  note?: string | null;
};

type ProductInfoProps = {
  productId: string;
  slug: string;
  name: string;
  price: number;
  comparePrice: number | null;
  sku: string;
  description: string;
  composition: string;
  care: string;
  style?: string | null;
  country?: string | null;
  material?: string | null;
  imageUrl?: string;
  variants: Variant[];
  isSet?: boolean;
  bottomModels?: BottomModel[];
  setAddons?: SetAddon[];
};

export function ProductInfo({
  productId,
  slug,
  name,
  price,
  comparePrice,
  sku,
  description,
  composition,
  care,
  style,
  country,
  material,
  imageUrl,
  variants,
  isSet = false,
  bottomModels = [],
  setAddons = [],
}: ProductInfoProps) {
  const [openSection, setOpenSection] = useState<
    "description" | "composition" | "care" | null
  >(null);

  const hasDiscount = comparePrice && comparePrice > price;
  const specs = [
    style ? { label: "Коллекция", value: style } : null,
    country ? { label: "Страна производства", value: country } : null,
    material ? { label: "Материал", value: material } : null,
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-xl font-semibold uppercase tracking-wide text-[#260402] sm:text-2xl lg:text-3xl">
          {name}
        </h1>
        <ProductFavoriteButton
          productId={productId}
          slug={slug}
          name={name}
          price={price}
          imageUrl={imageUrl}
        />
      </div>

      {sku && <p className="mt-2 text-xs uppercase tracking-widest text-stone-400">Арт. {sku}</p>}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <span className="text-2xl font-medium text-stone-900">{formatPrice(price)}</span>
        {hasDiscount && (
          <span className="text-lg text-stone-400 line-through">{formatPrice(comparePrice)}</span>
        )}
      </div>

      <div className="mt-4">
        <SplitBadge price={price} />
      </div>

      <div className="mt-8">
        {isSet ? (
          <SetAddToCart
            productId={productId}
            slug={slug}
            name={name}
            price={price}
            imageUrl={imageUrl}
            variants={variants.map((v) => ({
              ...v,
              part: v.part ?? "STANDARD",
            }))}
            bottomModels={bottomModels}
            setAddons={setAddons}
          />
        ) : (
          <AddToCart
            productId={productId}
            slug={slug}
            name={name}
            price={price}
            imageUrl={imageUrl}
            variants={variants}
          />
        )}
      </div>

      {specs.length > 0 && (
        <dl className="mt-8 grid gap-3 border-t border-stone-200 pt-6 text-sm sm:grid-cols-2">
          {specs.map((spec) => (
            <div key={spec.label}>
              <dt className="text-xs uppercase tracking-widest text-stone-500">
                {spec.label}
              </dt>
              <dd className="mt-1 text-stone-800">{spec.value}</dd>
            </div>
          ))}
        </dl>
      )}

      <div className="mt-10 border-t border-stone-200">
        {(
          [
            { id: "description" as const, label: "Описание", content: description },
            { id: "composition" as const, label: "Состав", content: composition },
            { id: "care" as const, label: "Уход", content: care },
          ] satisfies { id: "description" | "composition" | "care"; label: string; content: string }[]
        ).map((section) => {
          const isOpen = openSection === section.id;

          return (
          <div key={section.id} className="border-b border-stone-200">
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() =>
                setOpenSection((current) =>
                  current === section.id ? null : section.id,
                )
              }
              className="flex w-full cursor-pointer items-center justify-between py-4 text-left text-sm font-medium uppercase tracking-widest text-[#260402]"
            >
              {section.label}
              <span
                className={`text-lg leading-none text-stone-400 transition-transform duration-300 ease-out ${
                  isOpen ? "rotate-45" : "rotate-0"
                }`}
                aria-hidden
              >
                +
              </span>
            </button>
            <div
              className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              }`}
            >
              <div className="overflow-hidden">
                <p className="pb-4 text-sm leading-relaxed text-stone-600">
                  {section.content}
                </p>
              </div>
            </div>
          </div>
          );
        })}
      </div>

      <p className="mt-6 text-sm text-stone-500">
        Доставка: СДЭК, Яндекс
      </p>
    </div>
  );
}
