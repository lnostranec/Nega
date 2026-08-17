export const SHOP_NAME = "Nega";

export const BRAND_COLOR = "#260402";

/** Максимальная ширина контента магазина (px) */
export const SITE_MAX_WIDTH = 1800;

export const SITE_CONTAINER_CLASS =
  "mx-auto w-full max-w-[1800px] px-4 lg:px-8";

export const COOKIE_CONSENT_KEY = "nega-cookie-consent";

export const LOGO_SRC = "/images/logo/logo.png";

export const FOOTER_CONTACTS_ID = "contacts";

export const NAV_LINKS = [
  { href: "/catalog", label: "Каталог" },
  { href: `#${FOOTER_CONTACTS_ID}`, label: "Контакты" },
] as const;

export const SIZES = ["XS", "S", "M", "L", "XL"] as const;

export { HERO_SLIDES, CATEGORY_GRID, PLACEHOLDER_PRODUCT } from "./placeholders";

export const FOOTER_HELP_LINKS = [
  { href: "/delivery", label: "Доставка" },
  { href: "/order/track", label: "Отслеживание заказа" },
  { href: "/returns", label: "Отмена" },
  { href: "/faq", label: "FAQ" },
  { href: "/about", label: "О нас" },
  { href: "/reviews", label: "Отзывы" },
  { href: "/loyalty", label: "Программа лояльности" },
  { href: "/measurements", label: "Как снять мерки" },
] as const;

export const FOOTER_LEGAL_LINKS = [
  { href: "/payment-security", label: "Политика безопасности платежей" },
  { href: "/offer", label: "Публичная оферта" },
  { href: "/privacy", label: "Политика конфиденциальности" },
] as const;
