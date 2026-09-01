/** Реквизиты продавца (ИП) — для оферты, политики и страниц доставки */

export const SELLER = {
  /** Полное наименование для юридических документов */
  legalName: "ИП Гасенина Наталья Юрьевна",
  fullName: "Гасенина Наталья Юрьевна",
  inn: "526220285045",
  ogrnip: "325527500022771",
  ogrnipDate: "19.02.2025",
  registrationDate: "19.02.2025",
  address: "Нижегородская область, город Нижний Новгород",
  /** Город отгрузки заказов */
  shipFromCity: "Нижний Новгород",
  /** Уточнить у заказчицы */
  shipFromAddress: null as string | null,
  phone: null as string | null,
  email: "support@nega.ru",
  bankAccount: null as string | null,
  bankName: null as string | null,
  bankBik: null as string | null,
} as const;

export function formatSellerOgrnip(): string {
  return `ОГРНИП ${SELLER.ogrnip} от ${SELLER.ogrnipDate} г.`;
}

export function formatSellerPhone(): string {
  return SELLER.phone ?? "[уточняется]";
}

export function formatShipFromAddress(): string {
  return SELLER.shipFromAddress ?? "[уточняется]";
}

export function formatBankDetails(): string {
  if (SELLER.bankAccount && SELLER.bankName && SELLER.bankBik) {
    return `Расчётный счёт: ${SELLER.bankAccount} в ${SELLER.bankName}, БИК ${SELLER.bankBik}`;
  }
  return "Расчётный счёт: [уточняется]";
}
