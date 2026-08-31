import { NEGRA_PHOTOS } from "./photos";

export const PLACEHOLDER_PRODUCT = "/placeholders/product.svg";

export type HeroSlideView = {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  image: string;
};

export const HERO_SLIDES: readonly HeroSlideView[] = [
  {
    id: "hero-1",
    title: "Новая коллекция",
    subtitle: "Изысканное бельё для особых моментов",
    href: "/catalog",
    image: NEGRA_PHOTOS.hero[1],
  },
  {
    id: "hero-2",
    title: "Кружева",
    subtitle: "Нежные линии и выразительные детали",
    href: "/catalog?collection=sets",
    image: NEGRA_PHOTOS.hero[2],
  },
  {
    id: "hero-3",
    title: "Комфорт",
    subtitle: "Мягкие ткани на каждый день",
    href: "/catalog?collection=bras",
    image: NEGRA_PHOTOS.hero[3],
  },
  {
    id: "hero-4",
    title: "Образ",
    subtitle: "Завершите look с аксессуарами",
    href: "/catalog?collection=accessories",
    image: NEGRA_PHOTOS.hero[4],
  },
] as const;

export const CATEGORY_GRID = [
  {
    title: "Комплекты",
    href: "/catalog?collection=sets",
    image: NEGRA_PHOTOS.category.sets,
  },
  {
    title: "Бюстгальтеры",
    href: "/catalog?collection=bras",
    image: NEGRA_PHOTOS.category.bras,
  },
  {
    title: "Трусики",
    href: "/catalog?collection=panties",
    image: NEGRA_PHOTOS.category.panties,
  },
  {
    title: "Аксессуары",
    href: "/catalog?collection=accessories",
    image: NEGRA_PHOTOS.category.accessories,
  },
] as const;
