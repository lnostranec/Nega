"use client";

import Image from "next/image";
import { useState } from "react";
import { PLACEHOLDER_PRODUCT } from "@/lib/constants";

type GalleryImage = {
  id: string;
  url: string;
  alt: string;
};

type ProductGalleryProps = {
  images: GalleryImage[];
  productName: string;
};

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const gallery = images.length > 0 ? images : [{ id: "0", url: PLACEHOLDER_PRODUCT, alt: productName }];
  const [activeId, setActiveId] = useState(gallery[0].id);

  const activeImage = gallery.find((img) => img.id === activeId) ?? gallery[0];

  return (
    <div className="mx-auto w-full max-w-[461px] space-y-4 sm:max-w-[518px] lg:mx-0">
      <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-stone-50 lg:aspect-auto lg:h-[calc(100dvh-19rem+25px)] lg:max-h-[min(70vh,585px)]">
        <Image
          src={activeImage.url}
          alt={activeImage.alt}
          fill
          className="object-contain p-4"
          priority
          draggable={false}
          sizes="(max-width: 1024px) 100vw, 50vw"
        />
      </div>

      {gallery.length > 1 && (
        <div className="grid grid-cols-4 gap-x-2 gap-y-4 sm:grid-cols-5">
          {gallery.map((img) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActiveId(img.id)}
              className={`relative aspect-square overflow-hidden rounded-xl bg-stone-50 transition ${
                activeId === img.id
                  ? "ring-2 ring-[#260402] ring-offset-2"
                  : "opacity-70 hover:opacity-100"
              }`}
            >
              <Image
                src={img.url}
                alt={img.alt}
                fill
                draggable={false}
                className="object-contain p-1"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
