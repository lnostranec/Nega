/**
 * Загрузка фото в объектное хранилище (S3-совместимое).
 *
 * Прод: Yandex Object Storage (или Cloudflare R2 / Selectel / MinIO) — через S3_* переменные.
 * Локально: если S3 не настроен и это не production, файл пишется в public/uploads
 * (на Vercel такая запись не переживает деплой, поэтому в проде нужен бакет).
 */

import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

export const IMAGE_MIME_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export class MediaStorageError extends Error {}

export type UploadedMedia = { url: string; key: string };

function env(name: string): string {
  return process.env[name]?.trim() ?? "";
}

export function extensionForMime(mime: string): string | null {
  return IMAGE_MIME_EXTENSIONS[mime.toLowerCase()] ?? null;
}

export function isStorageConfigured(): boolean {
  return Boolean(
    env("S3_BUCKET") && env("S3_ACCESS_KEY_ID") && env("S3_SECRET_ACCESS_KEY"),
  );
}

export function storageEndpoint(): string {
  return (env("S3_ENDPOINT") || "https://storage.yandexcloud.net").replace(
    /\/$/,
    "",
  );
}

export function storageRegion(): string {
  return env("S3_REGION") || "ru-central1";
}

export function storageBucket(): string {
  return env("S3_BUCKET");
}

/** Публичный адрес объекта: свой домен/CDN, иначе endpoint + бакет. */
export function storagePublicBaseUrl(): string {
  const custom = env("S3_PUBLIC_BASE_URL");
  if (custom) return custom.replace(/\/$/, "");
  return `${storageEndpoint()}/${storageBucket()}`;
}

export function storagePrefix(): string {
  const prefix = env("S3_PREFIX").replace(/^\/+|\/+$/g, "");
  return prefix || "products";
}

/** Ключ объекта: products/2026/11/<uuid>.jpg */
export function buildObjectKey(mime: string, date: Date = new Date()): string {
  const ext = extensionForMime(mime);
  if (!ext) {
    throw new MediaStorageError(`Неподдерживаемый тип файла: ${mime}`);
  }
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${storagePrefix()}/${year}/${month}/${randomUUID()}.${ext}`;
}

export function publicUrlForKey(key: string): string {
  const encoded = key.split("/").map(encodeURIComponent).join("/");
  return `${storagePublicBaseUrl()}/${encoded}`;
}

/** Загружает файл в S3-совместимый бакет и возвращает публичный URL. */
export async function uploadToStorage(input: {
  body: Buffer;
  contentType: string;
}): Promise<UploadedMedia> {
  if (!isStorageConfigured()) {
    throw new MediaStorageError("S3-хранилище не настроено");
  }

  const key = buildObjectKey(input.contentType);
  const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");

  const client = new S3Client({
    region: storageRegion(),
    endpoint: storageEndpoint(),
    forcePathStyle: true,
    credentials: {
      accessKeyId: env("S3_ACCESS_KEY_ID"),
      secretAccessKey: env("S3_SECRET_ACCESS_KEY"),
    },
  });

  try {
    await client.send(
      new PutObjectCommand({
        Bucket: storageBucket(),
        Key: key,
        Body: input.body,
        ContentType: input.contentType,
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new MediaStorageError(`Не удалось загрузить файл в хранилище: ${detail}`);
  }

  return { url: publicUrlForKey(key), key };
}

/** Локальная разработка без S3: пишем в public/uploads/products. */
export async function saveToLocalUploads(input: {
  body: Buffer;
  contentType: string;
}): Promise<UploadedMedia> {
  const ext = extensionForMime(input.contentType);
  if (!ext) {
    throw new MediaStorageError(`Неподдерживаемый тип файла: ${input.contentType}`);
  }

  const filename = `${randomUUID()}.${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads", "products");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), input.body);

  return { url: `/uploads/products/${filename}`, key: `local/${filename}` };
}
