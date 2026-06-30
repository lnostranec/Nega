import { requireAdminUser } from "@/lib/admin";
import {
  deleteAdminPromoCode,
  updateAdminPromoCode,
} from "@/lib/admin-promo-codes";
import { dbUnavailableResponse } from "@/lib/auth";
import { isDbConfigured } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

function mapUpdateError(error: unknown): { message: string; status: number } {
  if (!(error instanceof Error)) {
    return { message: "Не удалось обновить промокод", status: 500 };
  }

  switch (error.message) {
    case "NOT_FOUND":
      return { message: "Промокод не найден", status: 404 };
    case "GIFT_CERT_READONLY":
      return { message: "Подарочные сертификаты нельзя редактировать", status: 400 };
    case "INVALID_CODE":
      return { message: "Некорректный код", status: 400 };
    case "INVALID_PERCENT":
      return { message: "Процент должен быть от 1 до 100", status: 400 };
    case "INVALID_VALUE":
      return { message: "Сумма скидки должна быть больше 0", status: 400 };
    case "MAX_USES_TOO_LOW":
      return {
        message: "Лимит использований не может быть меньше уже использованных",
        status: 400,
      };
    default:
      return {
        message: "Не удалось сохранить. Возможно, код уже занят",
        status: 400,
      };
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  if (!isDbConfigured()) return dbUnavailableResponse();
  const admin = await requireAdminUser();
  if (admin instanceof Response) return admin;

  const { id } = await context.params;

  let body: {
    code?: string;
    type?: "FIXED" | "PERCENT";
    value?: number;
    minOrderAmount?: number;
    maxUses?: number | null;
    expiresAt?: string | null;
    isActive?: boolean;
  };

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  try {
    const promo = await updateAdminPromoCode(id, body);
    return Response.json({ promo });
  } catch (error) {
    const mapped = mapUpdateError(error);
    return Response.json({ error: mapped.message }, { status: mapped.status });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  if (!isDbConfigured()) return dbUnavailableResponse();
  const admin = await requireAdminUser();
  if (admin instanceof Response) return admin;

  const { id } = await context.params;

  try {
    await deleteAdminPromoCode(id);
    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "NOT_FOUND") {
        return Response.json({ error: "Промокод не найден" }, { status: 404 });
      }
      if (error.message === "GIFT_CERT_READONLY") {
        return Response.json(
          { error: "Подарочные сертификаты нельзя удалять" },
          { status: 400 },
        );
      }
    }
    return Response.json({ error: "Не удалось удалить промокод" }, { status: 500 });
  }
}
