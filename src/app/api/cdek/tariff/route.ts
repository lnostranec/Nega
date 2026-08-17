import {
  calculateDeliveryCost,
  type DeliveryType,
} from "@/lib/cdek";

type TariffBody = {
  type?: DeliveryType;
  subtotal?: number;
  cityCode?: number;
  address?: string;
};

export async function POST(request: Request) {
  let body: TariffBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  const type = body.type;
  const subtotal = body.subtotal ?? 0;
  const cityCode = body.cityCode;

  if (
    type !== "cdek_pvz" &&
    type !== "cdek_courier" &&
    type !== "yandex_courier"
  ) {
    return Response.json({ error: "Некорректный тип доставки" }, { status: 400 });
  }

  const cost = await calculateDeliveryCost(
    type,
    subtotal,
    cityCode,
    body.address,
  );
  return Response.json({ cost, type });
}
