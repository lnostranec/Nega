import { isDbConfigured } from "@/lib/prisma";
import { dbUnavailableResponse } from "@/lib/auth";
import { promoErrorMessage, validatePromoCode } from "@/lib/promo-codes";

type ValidateBody = {
  code?: string;
  items?: {
    variantId: string;
    price: number;
    quantity: number;
  }[];
};

export async function POST(request: Request) {
  if (!isDbConfigured()) return dbUnavailableResponse();

  let body: ValidateBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  const code = body.code ?? "";
  const items = body.items ?? [];

  if (items.length === 0) {
    return Response.json({ error: "Корзина пуста" }, { status: 400 });
  }

  try {
    const promo = await validatePromoCode(code, items);
    return Response.json({ promo });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("PROMO_")) {
      return Response.json(
        { error: promoErrorMessage(error.message) },
        { status: 400 },
      );
    }
    return Response.json(
      { error: "Не удалось проверить промокод" },
      { status: 500 },
    );
  }
}
