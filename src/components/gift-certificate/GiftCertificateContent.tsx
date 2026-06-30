"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { SiteContainer } from "@/components/layout/SiteContainer";
import { formatPrice } from "@/lib/format";
import {
  GIFT_CERTIFICATE_DELIVERY,
  GIFT_CERTIFICATE_DESCRIPTION,
  GIFT_CERTIFICATE_DESIGNS,
  GIFT_CERTIFICATE_IMAGE,
  GIFT_CERTIFICATE_NOMINALS,
  GIFT_CERTIFICATE_SKU,
  GIFT_CERTIFICATE_TYPES,
  type GiftCertificateDesignId,
  type GiftCertificateTypeId,
} from "@/lib/gift-certificate";
import { useCartStore } from "@/store/cart";

const selectedClass = "border border-brand bg-brand text-white";
const defaultClass =
  "border border-stone-300 bg-white text-stone-700 transition-colors duration-300 hover:border-brand";

type AccordionSection = "description" | "delivery" | null;

export function GiftCertificateContent() {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);

  const [design, setDesign] = useState<GiftCertificateDesignId>(
    GIFT_CERTIFICATE_DESIGNS[0].id,
  );
  const [nominal, setNominal] = useState<number>(GIFT_CERTIFICATE_NOMINALS[0]);
  const [type, setType] = useState<GiftCertificateTypeId>(
    GIFT_CERTIFICATE_TYPES[0].id,
  );
  const [openSection, setOpenSection] = useState<AccordionSection>(null);
  const [viewers, setViewers] = useState(12);

  useEffect(() => {
    setViewers(Math.floor(Math.random() * 12) + 8);
  }, []);

  const activeDesign =
    GIFT_CERTIFICATE_DESIGNS.find((d) => d.id === design) ?? GIFT_CERTIFICATE_DESIGNS[0];
  const activeType =
    GIFT_CERTIFICATE_TYPES.find((t) => t.id === type) ?? GIFT_CERTIFICATE_TYPES[0];

  function handleAddToCart() {
    addItem({
      productId: "gift-certificate",
      variantId: `gift-${design}-${nominal}-${type}`,
      slug: "gift-certificate",
      name: "Подарочный сертификат",
      size: activeType.label,
      color: `Дизайн ${design}`,
      price: nominal,
      imageUrl: GIFT_CERTIFICATE_IMAGE,
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
    { id: "description" as const, label: "Описание", content: GIFT_CERTIFICATE_DESCRIPTION },
    { id: "delivery" as const, label: "Доставка и возврат", content: GIFT_CERTIFICATE_DELIVERY },
  ];

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
          <div
            className={`relative aspect-[3/4] overflow-hidden border border-stone-200 ${activeDesign.previewClass}`}
          >
            <Image
              src={GIFT_CERTIFICATE_IMAGE}
              alt="Подарочный сертификат Nega"
              fill
              className="object-contain p-6 mix-blend-multiply"
              priority
              sizes="(max-width: 1024px) 100vw, 576px"
            />
          </div>

          <div className="grid grid-cols-4 gap-2">
            {GIFT_CERTIFICATE_DESIGNS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setDesign(item.id)}
                aria-label={`Дизайн ${item.label}`}
                className={`relative aspect-square overflow-hidden border transition duration-300 ${
                  design === item.id
                    ? "border-brand ring-2 ring-brand ring-offset-2"
                    : "border-stone-200 opacity-80 hover:opacity-100"
                }`}
              >
                <div className={`absolute inset-0 ${item.previewClass}`} />
                <span className="relative z-10 flex h-full items-center justify-center text-xs font-medium text-brand">
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-stone-400">
            Идеальный подарок
          </p>
          <p className="mt-2 text-sm text-stone-500">
            Сейчас смотрят {viewers} {viewers % 10 >= 2 && viewers % 10 <= 4 ? "человека" : "человек"}
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
                {GIFT_CERTIFICATE_DESIGNS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setDesign(item.id)}
                    className={`min-w-12 border px-4 py-2.5 text-sm ${
                      design === item.id ? selectedClass : defaultClass
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-stone-500">
                Номинал сертификата
              </p>
              <div className="flex flex-wrap gap-2">
                {GIFT_CERTIFICATE_NOMINALS.map((value) => (
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
                {GIFT_CERTIFICATE_TYPES.map((item) => (
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
              className="w-full border border-stone-300 bg-white py-3 text-sm font-medium uppercase tracking-widest text-[#260402] transition-colors duration-300 hover:border-brand"
            >
              Намекнуть на подарок
            </button>
          </div>

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
                    className="flex w-full items-center justify-between py-4 text-left text-sm font-medium uppercase tracking-widest text-[#260402]"
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
        </div>
      </div>
    </SiteContainer>
  );
}
