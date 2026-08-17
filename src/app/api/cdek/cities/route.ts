import { searchCities } from "@/lib/cdek";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const cities = await searchCities(q);
  return Response.json({ cities });
}
