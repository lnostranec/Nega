import { getPvzByCity } from "@/lib/cdek";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cityCode = parseInt(searchParams.get("cityCode") ?? "", 10);
  if (!cityCode) {
    return Response.json({ error: "Укажите cityCode" }, { status: 400 });
  }
  const pvz = await getPvzByCity(cityCode);
  return Response.json({ pvz });
}
