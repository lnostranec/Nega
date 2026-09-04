import { isDbConfigured, getPrisma } from "@/lib/prisma";

export async function GET() {
  const yandexPayUrl = process.env.YANDEX_PAY_API_URL?.trim() || "";

  const checks: Record<string, string> = {
    db: "skip",
    yookassa: process.env.YOOKASSA_SHOP_ID ? "ok" : "skip",
    yandexPay: process.env.YANDEX_PAY_API_KEY ? "ok" : "skip",
    yandexPayUrl: !yandexPayUrl
      ? "skip"
      : yandexPayUrl.includes("sandbox")
        ? "sandbox"
        : "production",
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
