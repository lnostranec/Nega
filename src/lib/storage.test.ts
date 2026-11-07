import assert from "node:assert/strict";
import { rm } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import {
  buildObjectKey,
  extensionForMime,
  isStorageConfigured,
  publicUrlForKey,
  saveToLocalUploads,
  storagePublicBaseUrl,
} from "./storage";

const STORAGE_ENV = [
  "S3_BUCKET",
  "S3_ACCESS_KEY_ID",
  "S3_SECRET_ACCESS_KEY",
  "S3_ENDPOINT",
  "S3_PUBLIC_BASE_URL",
  "S3_PREFIX",
] as const;

function resetEnv() {
  for (const key of STORAGE_ENV) delete process.env[key];
}

test("extensionForMime понимает поддерживаемые типы", () => {
  assert.equal(extensionForMime("image/jpeg"), "jpg");
  assert.equal(extensionForMime("image/PNG"), "png");
  assert.equal(extensionForMime("image/webp"), "webp");
  assert.equal(extensionForMime("application/pdf"), null);
});

test("isStorageConfigured требует бакет и ключи", () => {
  resetEnv();
  assert.equal(isStorageConfigured(), false);

  process.env.S3_BUCKET = "nega-media";
  process.env.S3_ACCESS_KEY_ID = "key";
  assert.equal(isStorageConfigured(), false);

  process.env.S3_SECRET_ACCESS_KEY = "secret";
  assert.equal(isStorageConfigured(), true);
  resetEnv();
});

test("publicUrlForKey использует публичный адрес бакета", () => {
  resetEnv();
  process.env.S3_BUCKET = "nega-media";
  assert.equal(
    storagePublicBaseUrl(),
    "https://storage.yandexcloud.net/nega-media",
  );
  assert.equal(
    publicUrlForKey("products/2026/11/photo.jpg"),
    "https://storage.yandexcloud.net/nega-media/products/2026/11/photo.jpg",
  );

  process.env.S3_PUBLIC_BASE_URL = "https://media.nega.ru/";
  assert.equal(
    publicUrlForKey("products/2026/11/photo.jpg"),
    "https://media.nega.ru/products/2026/11/photo.jpg",
  );
  resetEnv();
});

test("buildObjectKey раскладывает файлы по году и месяцу", () => {
  resetEnv();
  process.env.S3_PREFIX = "/photos/";
  const key = buildObjectKey("image/jpeg", new Date("2026-11-07T10:00:00Z"));
  assert.match(key, /^photos\/2026\/11\/[0-9a-f-]{36}\.jpg$/);
  resetEnv();
});

test("buildObjectKey отвергает неподдерживаемый тип", () => {
  resetEnv();
  assert.throws(() => buildObjectKey("application/pdf"), /Неподдерживаемый тип/);
  resetEnv();
});

test("saveToLocalUploads пишет файл и возвращает локальный URL", async () => {
  resetEnv();
  const uploaded = await saveToLocalUploads({
    body: Buffer.from("test"),
    contentType: "image/png",
  });
  assert.match(uploaded.url, /^\/uploads\/products\/[0-9a-f-]{36}\.png$/);
  assert.match(uploaded.key, /^local\/[0-9a-f-]{36}\.png$/);

  // Не оставляем мусор в public/uploads после теста
  await rm(path.join(process.cwd(), "public", uploaded.url), { force: true });
});
