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
  phones: [
    { display: "+7 (910) 887-55-43", tel: "+79108875543" },
    { display: "+7 (910) 887-73-93", tel: "+79108877393" },
  ],
  email: "nega.store@yandex.ru",
  telegram: "@Nega_store",
  telegramUrl: "https://t.me/Nega_store",
  vkUrl: "https://vk.ru/negalingerie",
  instagramUrl: "https://www.instagram.com/negalingerie.ru",
  bankAccount: "40802810242710002943" as string | null,
  bankName: null as string | null,
  bankBik: null as string | null,
} as const;

export function formatSellerOgrnip(): string {
  return `ОГРНИП ${SELLER.ogrnip} от ${SELLER.ogrnipDate} г.`;
}

export function formatSellerPhone(): string {
  return SELLER.phones.map((phone) => phone.display).join(", ");
}

export function formatBankDetails(): string {
  if (!SELLER.bankAccount) return "Расчётный счёт: [уточняется]";

  const bank = SELLER.bankName ? ` в ${SELLER.bankName}` : "";
  const bik = SELLER.bankBik ? `, БИК ${SELLER.bankBik}` : "";

  return `Расчётный счёт: ${SELLER.bankAccount}${bank}${bik}`;
}
