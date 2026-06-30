import { validateCartItems } from "@/lib/cart-validation";
import { releaseExpiredOrders } from "@/lib/orders";
import { isDbConfigured } from "@/lib/prisma";
import { dbUnavailableResponse } from "@/lib/auth";

type ValidateBody = {
  items?: {
    productId?: string;
    variantId?: string;
    price?: number;
    quantity?: number;
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

  const rawItems = body.items ?? [];
  const items = rawItems
    .filter(
      (item) =>
        item.productId &&
        item.variantId &&
        item.price &&
        item.price > 0 &&
        item.quantity &&
        item.quantity > 0,
    )
    .map((item) => ({
      productId: item.productId!,
      variantId: item.variantId!,
      price: item.price!,
      quantity: item.quantity!,
    }));

  await releaseExpiredOrders();

  const result = await validateCartItems(items);
  return Response.json(result);
}
