"use client";

import Image from "next/image";
import { useState } from "react";
import { ImagePreviewModal } from "@/components/ui/ImagePreviewModal";
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
  const [previewOpen, setPreviewOpen] = useState(false);

  const activeIndex = gallery.findIndex((img) => img.id === activeId);
  const safeIndex = activeIndex >= 0 ? activeIndex : 0;
  const activeImage = gallery[safeIndex] ?? gallery[0];
  const hasMultipleImages = gallery.length > 1;

  function goToPrevious() {
    if (safeIndex > 0) {
      setActiveId(gallery[safeIndex - 1].id);
    }
  }

  function goToNext() {
    if (safeIndex < gallery.length - 1) {
      setActiveId(gallery[safeIndex + 1].id);
    }
  }

  return (
    <>
      <div className="mx-auto w-full max-w-[461px] space-y-4 sm:max-w-[518px] lg:mx-0">
        <button
          type="button"
          onClick={() => setPreviewOpen(true)}
          aria-label="Открыть изображение товара"
          className="relative aspect-[3/4] w-full cursor-pointer overflow-hidden rounded-2xl bg-stone-50 transition duration-300 hover:opacity-95 lg:aspect-auto lg:h-[calc(100dvh-19rem+25px)] lg:max-h-[min(70vh,585px)]"
        >
          <Image
            src={activeImage.url}
            alt={activeImage.alt}
            fill
            className="object-cover"
            priority
            draggable={false}
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
        </button>

        {hasMultipleImages && (
          <div className="grid grid-cols-4 gap-x-2 gap-y-4 sm:grid-cols-5">
            {gallery.map((img) => (
              <button
                key={img.id}
                type="button"
                onClick={() => setActiveId(img.id)}
                aria-label={`Показать фото: ${img.alt}`}
                aria-pressed={activeId === img.id}
                className={`relative aspect-square cursor-pointer overflow-hidden rounded-xl bg-stone-50 transition ${
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
                  className="object-cover"
                  sizes="80px"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      <ImagePreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        src={activeImage.url}
        alt={activeImage.alt}
        ariaLabel={productName}
        frameClassName="bg-stone-50"
        imageClassName="object-cover"
        imageSizes="(max-width: 640px) 98vw, 840px"
        onPrevious={hasMultipleImages ? goToPrevious : undefined}
        onNext={hasMultipleImages ? goToNext : undefined}
        canGoPrevious={safeIndex > 0}
        canGoNext={safeIndex < gallery.length - 1}
      />
    </>
  );
}
