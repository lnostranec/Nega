import { requestPasswordReset } from "@/lib/password-reset";
import { dbUnavailableResponse } from "@/lib/auth";
import { isDbConfigured } from "@/lib/prisma";
import { validateEmail } from "@/lib/validation";
import {
  clientIpFromRequest,
  rateLimit,
  rateLimitResponse,
} from "@/lib/rate-limit";

type Body = { email?: string };

export async function POST(request: Request) {
  if (!isDbConfigured()) return dbUnavailableResponse();

  const ip = clientIpFromRequest(request);
  const limited = rateLimit(`forgot:${ip}`, 5, 15 * 60 * 1000);
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);

  let body: Body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  const emailError = validateEmail(body.email ?? "");
  if (emailError) {
    return Response.json({ error: emailError }, { status: 400 });
  }

  // Всегда одинаковый ответ — не раскрываем, есть ли email
  await requestPasswordReset(body.email!).catch((error) =>
    console.error("Password reset request error:", error),
  );

  return Response.json({
    ok: true,
    message: "Если аккаунт существует, мы отправили письмо со ссылкой",
  });
}
