import { searchProducts } from "@/lib/search";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";

  const results = await searchProducts(q);
  return Response.json({ results });
}
