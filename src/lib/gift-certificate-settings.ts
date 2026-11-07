import type { Prisma } from "@prisma/client";
import { randomBytes } from "crypto";
import {
  DEFAULT_GIFT_CERTIFICATE_CONFIG,
  type GiftCertificateConfig,
  type GiftCertificateDesign,
  type GiftCertificateType,
} from "@/lib/gift-certificate";
import { getPrisma, isDbAvailable } from "@/lib/prisma";

const SETTINGS_ID = "default";

export const GIFT_CERTIFICATE_LIMITS = {
  textMax: 5000,
  labelMax: 40,
  designsMax: 12,
  typesMax: 6,
  nominalsMax: 20,
  nominalMin: 100,
  nominalMax: 1_000_000,
} as const;

const ID_PATTERN = /^[a-z0-9]{1,16}$/i;

/** Только файлы, загруженные через админку (локальный путь), — их умеет next/image. */
function isValidImageUrl(url: unknown): url is string {
  return (
    typeof url === "string" &&
    url.length <= 500 &&
    url.startsWith("/") &&
    !url.startsWith("//")
  );
}

function newId(): string {
  return randomBytes(4).toString("hex");
}

function asArray(value: Prisma.JsonValue | unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

/** Приводит данные из БД к конфигу; битые записи заменяются значениями по умолчанию. */
function fromDb(row: {
  mainImageUrl: string | null;
  description: string;
  deliveryText: string;
  designs: Prisma.JsonValue;
  nominals: Prisma.JsonValue;
  types: Prisma.JsonValue;
}): GiftCertificateConfig {
  const designs = asArray(row.designs).filter(
    (item): item is GiftCertificateDesign =>
      typeof item === "object" &&
      item !== null &&
      typeof (item as GiftCertificateDesign).id === "string" &&
      typeof (item as GiftCertificateDesign).name === "string",
  );
  const types = asArray(row.types).filter(
    (item): item is GiftCertificateType =>
      typeof item === "object" &&
      item !== null &&
      typeof (item as GiftCertificateType).id === "string" &&
      typeof (item as GiftCertificateType).label === "string",
  );
  const nominals = asArray(row.nominals).filter(
    (item): item is number => typeof item === "number" && item > 0,
  );

  return {
    mainImageUrl: row.mainImageUrl,
    description: row.description,
    deliveryText: row.deliveryText,
    designs: designs.length
      ? designs.map((design) => ({ ...design, imageUrl: design.imageUrl ?? null }))
      : DEFAULT_GIFT_CERTIFICATE_CONFIG.designs,
    nominals: nominals.length ? nominals : DEFAULT_GIFT_CERTIFICATE_CONFIG.nominals,
    types: types.length ? types : DEFAULT_GIFT_CERTIFICATE_CONFIG.types,
  };
}

/**
 * Настройки сертификата. Если БД недоступна или миграция ещё не применена —
 * возвращает значения по умолчанию, чтобы страница и оформление заказа не падали.
 */
export async function getGiftCertificateConfig(): Promise<GiftCertificateConfig> {
  if (!(await isDbAvailable())) return DEFAULT_GIFT_CERTIFICATE_CONFIG;
  try {
    const row = await getPrisma().giftCertificateSettings.findUnique({
      where: { id: SETTINGS_ID },
    });
    return row ? fromDb(row) : DEFAULT_GIFT_CERTIFICATE_CONFIG;
  } catch (error) {
    // Обычно — миграция ещё не применена. Не роняем страницу и не шумим stack trace.
    console.warn(
      "[gift-certificate] settings table unavailable, using defaults:",
      error instanceof Error ? error.message.split("\n").at(-1) : error,
    );
    return DEFAULT_GIFT_CERTIFICATE_CONFIG;
  }
}

export class GiftCertificateSettingsError extends Error {}

function fail(message: string): never {
  throw new GiftCertificateSettingsError(message);
}

function cleanLabel(value: unknown, what: string): string {
  const label = typeof value === "string" ? value.trim() : "";
  if (!label) fail(`Заполните название: ${what}`);
  if (label.length > GIFT_CERTIFICATE_LIMITS.labelMax) {
    fail(`Название «${label.slice(0, 20)}…» длиннее ${GIFT_CERTIFICATE_LIMITS.labelMax} символов`);
  }
  return label;
}

function cleanText(value: unknown, what: string): string {
  const text = typeof value === "string" ? value.trim() : "";
  if (text.length > GIFT_CERTIFICATE_LIMITS.textMax) {
    fail(`${what}: не больше ${GIFT_CERTIFICATE_LIMITS.textMax} символов`);
  }
  return text;
}

function cleanId(value: unknown, used: Set<string>): string {
  let id = typeof value === "string" && ID_PATTERN.test(value) ? value : newId();
  while (used.has(id)) id = newId();
  used.add(id);
  return id;
}

/** Проверяет и нормализует данные из формы админки. */
export function normalizeGiftCertificateConfig(input: unknown): GiftCertificateConfig {
  const data = (typeof input === "object" && input !== null ? input : {}) as Record<
    string,
    unknown
  >;

  const designsInput = asArray(data.designs);
  if (designsInput.length === 0) fail("Добавьте хотя бы один дизайн");
  if (designsInput.length > GIFT_CERTIFICATE_LIMITS.designsMax) {
    fail(`Дизайнов может быть не больше ${GIFT_CERTIFICATE_LIMITS.designsMax}`);
  }
  const designIds = new Set<string>();
  const designs = designsInput.map((item, index) => {
    const design = (item ?? {}) as Record<string, unknown>;
    return {
      id: cleanId(design.id, designIds),
      name: cleanLabel(design.name, `дизайн №${index + 1}`),
      imageUrl: isValidImageUrl(design.imageUrl) ? design.imageUrl : null,
    };
  });

  const typesInput = asArray(data.types);
  if (typesInput.length === 0) fail("Добавьте хотя бы один тип сертификата");
  if (typesInput.length > GIFT_CERTIFICATE_LIMITS.typesMax) {
    fail(`Типов может быть не больше ${GIFT_CERTIFICATE_LIMITS.typesMax}`);
  }
  const typeIds = new Set<string>();
  const types = typesInput.map((item, index) => {
    const type = (item ?? {}) as Record<string, unknown>;
    return {
      id: cleanId(type.id, typeIds),
      label: cleanLabel(type.label, `тип №${index + 1}`),
    };
  });

  const nominals = [
    ...new Set(
      asArray(data.nominals).map((value) => {
        const nominal = Number(value);
        if (
          !Number.isInteger(nominal) ||
          nominal < GIFT_CERTIFICATE_LIMITS.nominalMin ||
          nominal > GIFT_CERTIFICATE_LIMITS.nominalMax
        ) {
          fail(
            `Номинал должен быть целым числом от ${GIFT_CERTIFICATE_LIMITS.nominalMin} до ${GIFT_CERTIFICATE_LIMITS.nominalMax.toLocaleString("ru-RU")} ₽`,
          );
        }
        return nominal;
      }),
    ),
  ].sort((a, b) => a - b);
  if (nominals.length === 0) fail("Добавьте хотя бы один номинал");
  if (nominals.length > GIFT_CERTIFICATE_LIMITS.nominalsMax) {
    fail(`Номиналов может быть не больше ${GIFT_CERTIFICATE_LIMITS.nominalsMax}`);
  }

  return {
    mainImageUrl: isValidImageUrl(data.mainImageUrl) ? data.mainImageUrl : null,
    description: cleanText(data.description, "Описание"),
    deliveryText: cleanText(data.deliveryText, "Доставка и возврат"),
    designs,
    nominals,
    types,
  };
}

export async function saveGiftCertificateConfig(
  config: GiftCertificateConfig,
): Promise<GiftCertificateConfig> {
  const data = {
    mainImageUrl: config.mainImageUrl,
    description: config.description,
    deliveryText: config.deliveryText,
    designs: config.designs,
    nominals: config.nominals,
    types: config.types,
  };
  const row = await getPrisma().giftCertificateSettings.upsert({
    where: { id: SETTINGS_ID },
    create: { id: SETTINGS_ID, ...data },
    update: data,
  });
  return fromDb(row);
}
