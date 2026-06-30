import { NextRequest } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { requireAdminUser } from "@/lib/admin";
import { isDbConfigured } from "@/lib/prisma";
import { dbUnavailableResponse } from "@/lib/auth";

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

  const ext = file.type.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
  const filename = `${randomUUID()}.${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", "products");
  await mkdir(uploadDir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadDir, filename), buffer);

  return Response.json({ url: `/uploads/products/${filename}` });
}
