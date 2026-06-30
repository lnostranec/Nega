import { SIZES } from "./constants";
import { BRUNA_SET_GALLERY, LEO_SET_GALLERY, NEGRA_PHOTOS } from "./photos";

export type DemoVariant = {
  id: string;
  size: string;
  color: string | null;
  stock: number;
};

export type DemoProduct = {
  id: string;
  slug: string;
  name: string;
  description: string;
  composition: string;
  care: string;
  price: number;
  comparePrice: number | null;
  sku: string;
  style: string;
  country: string;
  pattern: string;
  material: string;
  images: { id: string; url: string; alt: string }[];
  variants: DemoVariant[];
  collection: { name: string; slug: string };
};

function buildVariants(productId: string, colors: string[]): DemoVariant[] {
  return colors.flatMap((color, colorIndex) =>
    SIZES.map((size, sizeIndex) => ({
      id: `${productId}-v-${colorIndex}-${sizeIndex}`,
      size,
      color,
      stock: size === "XS" || size === "XL" ? 2 : 8,
    })),
  );
}

const DEMO_PRODUCTS: DemoProduct[] = [
  {
    id: "fallback-1",
    slug: "bra-aurora",
    name: "Комплект белья Leo",
    description:
      "Кружевной комплект из бюстгальтера и трусиков. Мягкая посадка, эластичные материалы и аккуратная отделка для комфорта на каждый день.",
    composition: "85% полиамид, 15% эластан",
    care: "Ручная стирка при 30 °C. Не отбеливать. Сушить в расправленном виде.",
    price: 12999,
    comparePrice: null,
    sku: "NEGA-LEO-001",
    style: "Романтика",
    country: "Италия",
    pattern: "Кружево",
    material: "Полиамид",
    images: [
      { id: "1", url: LEO_SET_GALLERY[0], alt: "Комплект белья Leo — вид 1" },
      { id: "2", url: LEO_SET_GALLERY[1], alt: "Комплект белья Leo — вид 2" },
      { id: "3", url: LEO_SET_GALLERY[2], alt: "Комплект белья Leo — вид 3" },
      { id: "4", url: LEO_SET_GALLERY[3], alt: "Комплект белья Leo — вид 4" },
    ],
    variants: buildVariants("fallback-1", ["Чёрный", "Бордо"]),
    collection: { name: "Комплекты", slug: "sets" },
  },
  {
    id: "fallback-2",
    slug: "set-silk-line",
    name: "Комплект белья Bruna Desire",
    description:
      "Изысканный комплект с выразительным кружевом и плавными линиями силуэта. Создан для особых случаев и уверенного настроения.",
    composition: "90% полиэстер, 10% эластан",
    care: "Деликатная стирка в мешочке для белья. Не гладить.",
    price: 10500,
    comparePrice: 12900,
    sku: "NEGA-BRUNA-001",
    style: "Романтика",
    country: "Франция",
    pattern: "Кружево",
    material: "Полиэстер",
    images: [
      { id: "1", url: BRUNA_SET_GALLERY[0], alt: "Комплект белья Bruna Desire — вид 1" },
      { id: "2", url: BRUNA_SET_GALLERY[1], alt: "Комплект белья Bruna Desire — вид 2" },
      { id: "3", url: BRUNA_SET_GALLERY[2], alt: "Комплект белья Bruna Desire — вид 3" },
      { id: "4", url: BRUNA_SET_GALLERY[3], alt: "Комплект белья Bruna Desire — вид 4" },
    ],
    variants: buildVariants("fallback-2", ["Бордо", "Чёрный"]),
    collection: { name: "Комплекты", slug: "sets" },
  },
  {
    id: "fallback-3",
    slug: "panties-classic",
    name: "Пояс Toffee",
    description:
      "Кружевной пояс для чулок с мягкой посадкой на талии. Дополнит образ и подчеркнёт линию бёдер.",
    composition: "88% полиамид, 12% эластан",
    care: "Ручная стирка при 30 °C.",
    price: 3400,
    comparePrice: null,
    sku: "NEGA-TOFFEE-BELT",
    style: "Классика",
    country: "Россия",
    pattern: "Кружево",
    material: "Полиамид",
    images: [{ id: "1", url: NEGRA_PHOTOS.category.accessories, alt: "Пояс Toffee" }],
    variants: buildVariants("fallback-3", ["Чёрный"]),
    collection: { name: "Пояса", slug: "belts" },
  },
  {
    id: "fallback-4",
    slug: "bra-rose",
    name: "Комплект белья Toffee",
    description:
      "Лаконичный комплект в насыщенном оттенке. Комфортная посадка и универсальный силуэт.",
    composition: "86% полиамид, 14% эластан",
    care: "Стирать отдельно от остальной одежды.",
    price: 10500,
    comparePrice: null,
    sku: "NEGA-TOFFEE-SET",
    style: "Минимализм",
    country: "Турция",
    pattern: "Однотон",
    material: "Полиамид",
    images: [{ id: "1", url: NEGRA_PHOTOS.card[12], alt: "Комплект белья Toffee" }],
    variants: buildVariants("fallback-4", ["Чёрный", "Карамель"]),
    collection: { name: "Комплекты", slug: "sets" },
  },
  {
    id: "fallback-5",
    slug: "set-minimal",
    name: "Комплект белья Passion Plum Desire",
    description:
      "Комплект в глубоком сливовом оттенке. Мягкое кружево и продуманная конструкция чашки.",
    composition: "84% полиамид, 16% эластан",
    care: "Деликатная стирка, сушка в тени.",
    price: 10500,
    comparePrice: 11900,
    sku: "NEGA-PLUM-001",
    style: "Романтика",
    country: "Италия",
    pattern: "Кружево",
    material: "Полиамид",
    images: [{ id: "1", url: NEGRA_PHOTOS.card[13], alt: "Комплект белья Passion Plum Desire" }],
    variants: buildVariants("fallback-5", ["Сливовый", "Чёрный"]),
    collection: { name: "Комплекты", slug: "sets" },
  },
  {
    id: "fallback-6",
    slug: "bra-flex",
    name: "Комплект белья Aurora",
    description:
      "Нежный комплект с акцентом на комфорт. Подходит для ежедневной носки под любую одежду.",
    composition: "82% хлопок, 18% эластан",
    care: "Машинная стирка при 30 °C в деликатном режиме.",
    price: 10500,
    comparePrice: null,
    sku: "NEGA-AURORA-001",
    style: "Минимализм",
    country: "Россия",
    pattern: "Однотон",
    material: "Хлопок",
    images: [{ id: "1", url: NEGRA_PHOTOS.card[14], alt: "Комплект белья Aurora" }],
    variants: buildVariants("fallback-6", ["Белый", "Пудра"]),
    collection: { name: "Комплекты", slug: "sets" },
  },
  {
    id: "fallback-7",
    slug: "bra-white-petal",
    name: "Балконет White Petal Desire",
    description:
      "Балконет с мягкими чашками и изящным кружевом по краю. Поддерживает форму и подходит под открытую одежду.",
    composition: "85% полиамид, 15% эластан",
    care: "Ручная стирка при 30 °C.",
    price: 9150,
    comparePrice: null,
    sku: "NEGA-PETAL-WHITE",
    style: "Классика",
    country: "Франция",
    pattern: "Однотон",
    material: "Полиамид",
    images: [{ id: "1", url: NEGRA_PHOTOS.category.bras, alt: "Балконет White Petal Desire" }],
    variants: buildVariants("fallback-7", ["Белый"]),
    collection: { name: "Бюстгальтеры", slug: "bras" },
  },
  {
    id: "fallback-8",
    slug: "panties-red-pearl",
    name: "Высокие стринги Red Pearl",
    description:
      "Высокие стринги с выразительным кружевом. Комфортная посадка на бёдрах без видимых линий под одеждой.",
    composition: "88% полиамид, 12% эластан",
    care: "Деликатная стирка.",
    price: 3905,
    comparePrice: null,
    sku: "NEGA-RED-PEARL",
    style: "Романтика",
    country: "Италия",
    pattern: "Кружево",
    material: "Полиамид",
    images: [{ id: "1", url: NEGRA_PHOTOS.category.panties, alt: "Высокие стринги Red Pearl" }],
    variants: buildVariants("fallback-8", ["Красный"]),
    collection: { name: "Трусики", slug: "panties" },
  },
  {
    id: "fallback-9",
    slug: "bodysuit-moon",
    name: "Боди Moon",
    description:
      "Элегантное боди с глубоким вырезом и мягкой посадкой. Универсальный элемент для вечернего образа.",
    composition: "90% полиэстер, 10% эластан",
    care: "Стирать в мешочке для белья.",
    price: 7990,
    comparePrice: null,
    sku: "NEGA-MOON-BODY",
    style: "Винтаж",
    country: "Италия",
    pattern: "Однотон",
    material: "Полиэстер",
    images: [{ id: "1", url: NEGRA_PHOTOS.card[15], alt: "Боди Moon" }],
    variants: buildVariants("fallback-9", ["Чёрный", "Бордо"]),
    collection: { name: "Боди", slug: "bodysuits" },
  },
  {
    id: "fallback-10",
    slug: "stockings-classic",
    name: "Чулки Classic Sheer",
    description:
      "Классические чулки с кружевной резинкой. Тонкая полупрозрачная фактура для повседневных и вечерних образов.",
    composition: "85% полиамид, 15% эластан",
    care: "Ручная стирка.",
    price: 2890,
    comparePrice: null,
    sku: "NEGA-STOCK-CLASSIC",
    style: "Классика",
    country: "Китай",
    pattern: "Однотон",
    material: "Полиамид",
    images: [{ id: "1", url: NEGRA_PHOTOS.category.accessories, alt: "Чулки Classic Sheer" }],
    variants: buildVariants("fallback-10", ["Чёрный", "Телесный"]),
    collection: { name: "Чулки", slug: "stockings" },
  },
  {
    id: "fallback-11",
    slug: "corset-velvet",
    name: "Корсет Velvet Line",
    description:
      "Корсет с мягкими косточками и бархатистой отделкой. Подчёркивает талию и создаёт выразительный силуэт.",
    composition: "82% полиэстер, 18% эластан",
    care: "Только ручная стирка.",
    price: 12400,
    comparePrice: 13900,
    sku: "NEGA-CORSET-VELVET",
    style: "Винтаж",
    country: "Франция",
    pattern: "Геометрия",
    material: "Полиэстер",
    images: [{ id: "1", url: NEGRA_PHOTOS.card[2], alt: "Корсет Velvet Line" }],
    variants: buildVariants("fallback-11", ["Чёрный", "Бордо"]),
    collection: { name: "Корсеты", slug: "corsets" },
  },
  {
    id: "fallback-12",
    slug: "homewear-silk-robe",
    name: "Халат Silk Home",
    description:
      "Лёгкий домашний халат из мягкой ткани. Свободный крой и приятная текстура для отдыха дома.",
    composition: "95% вискоза, 5% эластан",
    care: "Машинная стирка при 30 °C.",
    price: 8900,
    comparePrice: null,
    sku: "NEGA-HOME-ROBE",
    style: "Минимализм",
    country: "Россия",
    pattern: "Однотон",
    material: "Вискоза",
    images: [{ id: "1", url: NEGRA_PHOTOS.category.sets, alt: "Халат Silk Home" }],
    variants: buildVariants("fallback-12", ["Пудра", "Серый"]),
    collection: { name: "Одежда", slug: "homewear" },
  },
];

export function getDemoProductBySlug(slug: string): DemoProduct | null {
  return DEMO_PRODUCTS.find((p) => p.slug === slug) ?? null;
}

export function getDemoProducts(limit?: number): DemoProduct[] {
  return limit ? DEMO_PRODUCTS.slice(0, limit) : DEMO_PRODUCTS;
}

export function demoToPageProduct(product: DemoProduct) {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    description: product.description,
    composition: product.composition,
    care: product.care,
    price: product.price,
    comparePrice: product.comparePrice,
    sku: product.sku,
    style: product.style,
    country: product.country,
    material: product.material,
    pattern: product.pattern,
    images: product.images,
    variants: product.variants,
    collections: [{ collection: product.collection }],
  };
}
