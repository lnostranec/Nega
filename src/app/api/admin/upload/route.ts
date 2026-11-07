import { NextRequest } from "next/server";
import { requireAdminUser } from "@/lib/admin";
import { isDbConfigured } from "@/lib/prisma";
import { dbUnavailableResponse } from "@/lib/auth";
import { captureException } from "@/lib/monitoring";
import {
  isStorageConfigured,
  MediaStorageError,
  saveToLocalUploads,
  uploadToStorage,
} from "@/lib/storage";

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export async function POST(request: NextRequest) {
  if (!isDbConfigured()) return dbUnavailableResponse();
  const admin = await requireAdminUser();
  if (admin instanceof Response) return admin;

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return Response.json({ error: "Файл не передан" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return Response.json({ error: "Допустимы JPG, PNG, WebP" }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return Response.json({ error: "Файл больше 5 МБ" }, { status: 400 });
  }

  const body = Buffer.from(await file.arrayBuffer());

  // Прод: объектное хранилище. Без него на Vercel файл некуда положить.
  if (isStorageConfigured()) {
    try {
      const uploaded = await uploadToStorage({ body, contentType: file.type });
      return Response.json({ url: uploaded.url, key: uploaded.key });
    } catch (error) {
      console.error("[upload] storage error:", error);
      void captureException(error, { route: "POST /api/admin/upload" });
      return Response.json(
        {
          error:
            error instanceof MediaStorageError
              ? error.message
              : "Не удалось загрузить фото в хранилище",
        },
        { status: 502 },
      );
    }
  }

  // Локальная разработка без облака: пишем в public/uploads.
  if (process.env.NODE_ENV !== "production") {
    try {
      const uploaded = await saveToLocalUploads({ body, contentType: file.type });
      return Response.json({ url: uploaded.url, key: uploaded.key });
    } catch (error) {
      console.error("[upload] local write error:", error);
      return Response.json(
        { error: "Не удалось сохранить файл" },
        { status: 500 },
      );
    }
  }

  return Response.json(
    {
      error:
        "Хранилище фото не настроено. Добавьте S3_BUCKET, S3_ACCESS_KEY_ID и S3_SECRET_ACCESS_KEY в переменные окружения.",
    },
    { status: 503 },
  );
}
