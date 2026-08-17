import { isDbConfigured, getPrisma } from "@/lib/prisma";

export async function GET() {
  const checks: Record<string, "ok" | "fail" | "skip"> = {
    db: "skip",
    yookassa: process.env.YOOKASSA_SHOP_ID ? "ok" : "skip",
    cdek: process.env.CDEK_CLIENT_ID ? "ok" : "skip",
    resend: process.env.RESEND_API_KEY ? "ok" : "skip",
  };

  let status: "ok" | "degraded" = "ok";

  if (isDbConfigured()) {
    try {
      await getPrisma().$queryRaw`SELECT 1`;
      checks.db = "ok";
    } catch {
      checks.db = "fail";
      status = "degraded";
    }
  } else {
    checks.db = "fail";
    status = "degraded";
  }

  return Response.json(
    {
      status,
      checks,
      time: new Date().toISOString(),
    },
    { status: status === "ok" ? 200 : 503 },
  );
}
