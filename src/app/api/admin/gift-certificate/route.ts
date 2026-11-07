import { revalidatePath } from "next/cache";
import { requireAdminUser } from "@/lib/admin";
import { writeAuditLog } from "@/lib/audit";
import { dbUnavailableResponse } from "@/lib/auth";
import {
  getGiftCertificateConfig,
  GiftCertificateSettingsError,
  normalizeGiftCertificateConfig,
  saveGiftCertificateConfig,
} from "@/lib/gift-certificate-settings";
import { captureException } from "@/lib/monitoring";
import { isDbConfigured } from "@/lib/prisma";

export async function GET() {
  if (!isDbConfigured()) return dbUnavailableResponse();
  const admin = await requireAdminUser();
  if (admin instanceof Response) return admin;

  return Response.json({ config: await getGiftCertificateConfig() });
}

export async function PUT(request: Request) {
  if (!isDbConfigured()) return dbUnavailableResponse();
  const admin = await requireAdminUser();
  if (admin instanceof Response) return admin;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  let config;
  try {
    config = normalizeGiftCertificateConfig(body);
  } catch (error) {
    if (error instanceof GiftCertificateSettingsError) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }

  try {
    const saved = await saveGiftCertificateConfig(config);
    await writeAuditLog({
      adminId: admin.id,
      action: "update",
      entityType: "gift_certificate_settings",
      meta: {
        designs: saved.designs.length,
        nominals: saved.nominals,
        types: saved.types.map((type) => type.label),
      },
    });
    revalidatePath("/gift-certificate");
    return Response.json({ config: saved });
  } catch (error) {
    console.error("[gift-certificate] save failed:", error);
    void captureException(error, { route: "PUT /api/admin/gift-certificate" });
    return Response.json(
      {
        error:
          "Не удалось сохранить. Если это первый запуск — нужно применить миграцию базы (prisma migrate deploy).",
      },
      { status: 500 },
    );
  }
}
