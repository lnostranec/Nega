import { requireAdminUser } from "@/lib/admin";
import {
  createAdminPromoCode,
  listAdminPromoCodes,
} from "@/lib/admin-promo-codes";
import { dbUnavailableResponse } from "@/lib/auth";
import { isDbConfigured } from "@/lib/prisma";

export async function GET() {
  if (!isDbConfigured()) return dbUnavailableResponse();
  const admin = await requireAdminUser();
  if (admin instanceof Response) return admin;

  const promos = await listAdminPromoCodes();
  return Response.json({ promos });
}

export async function POST(request: Request) {
  if (!isDbConfigured()) return dbUnavailableResponse();
  const admin = await requireAdminUser();
  if (admin instanceof Response) return admin;

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

  if (!body.code?.trim() || !body.type || body.value === undefined) {
    return Response.json({ error: "Заполните код, тип и значение" }, { status: 400 });
  }

  try {
    const promo = await createAdminPromoCode({
      code: body.code,
      type: body.type,
      value: body.value,
      minOrderAmount: body.minOrderAmount,
      maxUses: body.maxUses,
      expiresAt: body.expiresAt,
      isActive: body.isActive,
    });
    return Response.json({ promo }, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "INVALID_CODE") {
        return Response.json({ error: "Некорректный код" }, { status: 400 });
      }
      if (error.message === "INVALID_PERCENT") {
        return Response.json({ error: "Процент должен быть от 1 до 100" }, { status: 400 });
      }
      if (error.message === "INVALID_VALUE") {
        return Response.json({ error: "Сумма скидки должна быть больше 0" }, { status: 400 });
      }
    }

    console.error("Create promo error:", error);
    return Response.json(
      { error: "Не удалось создать промокод. Возможно, код уже занят" },
      { status: 400 },
    );
  }
}
