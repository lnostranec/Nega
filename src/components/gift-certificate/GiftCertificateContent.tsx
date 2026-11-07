"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ImagePreviewModal } from "@/components/ui/ImagePreviewModal";
import { SiteContainer } from "@/components/layout/SiteContainer";
import { formatPrice } from "@/lib/format";
import {
  buildGiftCertificateVariantId,
  giftCertificateFallbackBackground,
  GIFT_CERTIFICATE_PLACEHOLDER_IMAGE,
  GIFT_CERTIFICATE_SKU,
  type GiftCertificateConfig,
} from "@/lib/gift-certificate";
import { useCartStore } from "@/store/cart";

const selectedClass = "cursor-pointer border border-brand bg-brand text-white";
const defaultClass =
  "cursor-pointer border border-stone-300 bg-white text-stone-700 transition-colors duration-300 hover:border-brand";

type AccordionSection = "description" | "delivery" | null;

export function GiftCertificateContent({ config }: { config: GiftCertificateConfig }) {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);

  const [design, setDesign] = useState(config.designs[0].id);
  const [nominal, setNominal] = useState(config.nominals[0]);
  const [type, setType] = useState(config.types[0].id);
  const [openSection, setOpenSection] = useState<AccordionSection>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const activeDesignIndex = Math.max(
    0,
    config.designs.findIndex((d) => d.id === design),
  );
  const activeDesign = config.designs[activeDesignIndex];
  const activeType = config.types.find((t) => t.id === type) ?? config.types[0];

  // Фото выбранного дизайна → общее фото сертификата → заглушка на градиенте
  const activeImage = activeDesign.imageUrl ?? config.mainImageUrl;
  const displayImage = activeImage ?? GIFT_CERTIFICATE_PLACEHOLDER_IMAGE;
  const displayBackground = activeImage
    ? "bg-stone-50"
    : giftCertificateFallbackBackground(activeDesignIndex);
  const displayImageClass = activeImage
    ? "object-cover"
    : "object-contain p-6 mix-blend-multiply";

  function handleAddToCart() {
    addItem({
      productId: "gift-certificate",
      variantId: buildGiftCertificateVariantId(activeDesign.id, nominal, activeType.id),
      slug: "gift-certificate",
      name: "Подарочный сертификат",
      size: activeType.label,
      color: `Дизайн ${activeDesign.name}`,
      price: nominal,
      imageUrl: displayImage,
    });
    router.push("/cart");
  }

  function handleHint() {
    const url = window.location.href;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url);
      alert("Ссылка скопирована — отправьте её близким");
    } else {
      alert("Поделитесь ссылкой на эту страницу");
    }
  }

  const sections = [
    { id: "description" as const, label: "Описание", content: config.description },
    { id: "delivery" as const, label: "Доставка и возврат", content: config.deliveryText },
  ].filter((section) => section.content.trim());

  return (
    <SiteContainer className="py-8 lg:py-12">
      <Breadcrumbs
        items={[
          { label: "Главная", href: "/" },
          { label: "Каталог", href: "/catalog" },
          { label: "Сертификаты", href: "/gift-certificate" },
          { label: "Подарочный сертификат" },
        ]}
      />

      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,518px)_1fr] lg:items-start lg:gap-12 xl:grid-cols-[minmax(0,576px)_1fr]">
        <div className="mx-auto w-full max-w-[461px] space-y-4 sm:max-w-[518px] lg:mx-0">
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            aria-label="Открыть изображение сертификата"
            className={`relative aspect-[3/4] w-full cursor-pointer overflow-hidden border border-stone-200 transition duration-300 hover:opacity-95 ${displayBackground}`}
          >
            <Image
              src={displayImage}
              alt="Подарочный сертификат Nega"
              fill
              className={displayImageClass}
              priority
              sizes="(max-width: 1024px) 100vw, 576px"
            />
          </button>

          {config.designs.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {config.designs.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setDesign(item.id)}
                  aria-label={`Дизайн ${item.name}`}
                  aria-pressed={design === item.id}
                  className={`relative aspect-square cursor-pointer overflow-hidden border transition duration-300 ${
                    design === item.id
                      ? "border-brand ring-2 ring-brand ring-offset-2"
                      : "border-stone-200 opacity-80 hover:opacity-100"
                  }`}
                >
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={`Дизайн ${item.name}`}
                      fill
                      className="object-cover"
                      sizes="130px"
                    />
                  ) : (
                    <>
                      <div
                        className={`absolute inset-0 ${giftCertificateFallbackBackground(index)}`}
                      />
                      <span className="relative z-10 flex h-full items-center justify-center text-xs font-medium text-brand">
                        {item.name}
                      </span>
                    </>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-stone-400">
            Идеальный подарок
          </p>

          <h1 className="mt-4 text-xl font-semibold uppercase tracking-wide text-[#260402] sm:text-2xl lg:text-3xl">
            Подарочный сертификат
          </h1>

          <p className="mt-2 text-xs uppercase tracking-widest text-stone-400">
            Арт. {GIFT_CERTIFICATE_SKU}
          </p>

          <p className="mt-5 text-2xl font-medium text-stone-900">{formatPrice(nominal)}</p>

          <div className="mt-8 space-y-6">
            <div>
              <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-stone-500">
                Дизайн сертификата
              </p>
              <div className="flex flex-wrap gap-2">
                {config.designs.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setDesign(item.id)}
                    className={`min-w-12 border px-4 py-2.5 text-sm ${
                      design === item.id ? selectedClass : defaultClass
                    }`}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-stone-500">
                Номинал сертификата
              </p>
              <div className="flex flex-wrap gap-2">
                {config.nominals.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setNominal(value)}
                    className={`border px-4 py-2.5 text-sm ${
                      nominal === value ? selectedClass : defaultClass
                    }`}
                  >
                    {value.toLocaleString("ru-RU")}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-stone-500">
                Тип сертификата
              </p>
              <div className="flex flex-wrap gap-2">
                {config.types.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setType(item.id)}
                    className={`border px-4 py-2.5 text-sm ${
                      type === item.id ? selectedClass : defaultClass
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <Button type="button" className="w-full py-4" onClick={handleAddToCart}>
              В корзину
            </Button>

            <button
              type="button"
              onClick={handleHint}
              className="w-full cursor-pointer border border-stone-300 bg-white py-3 text-sm font-medium uppercase tracking-widest text-[#260402] transition-colors duration-300 hover:border-brand"
            >
              Намекнуть на подарок
            </button>
          </div>

          {sections.length > 0 && (
            <div className="mt-10 border-t border-stone-200">
              {sections.map((section) => {
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
                        <p className="whitespace-pre-line pb-4 text-sm leading-relaxed text-stone-600">
                          {section.content}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <ImagePreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        src={displayImage}
        alt="Подарочный сертификат Nega"
        ariaLabel="Подарочный сертификат"
        frameClassName={`bg-white ${displayBackground}`}
        imageClassName={
          activeImage ? "object-contain" : "object-contain p-6 mix-blend-multiply"
        }
      />
    </SiteContainer>
  );
}
