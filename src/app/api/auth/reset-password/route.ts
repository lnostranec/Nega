import { resetPasswordWithToken } from "@/lib/password-reset";
import { dbUnavailableResponse } from "@/lib/auth";
import { isDbConfigured } from "@/lib/prisma";
import { validatePassword, validatePasswordConfirm } from "@/lib/validation";
import {
  clientIpFromRequest,
  rateLimit,
  rateLimitResponse,
} from "@/lib/rate-limit";

type Body = {
  token?: string;
  password?: string;
  passwordConfirm?: string;
};

export async function POST(request: Request) {
  if (!isDbConfigured()) return dbUnavailableResponse();

  const ip = clientIpFromRequest(request);
  const limited = rateLimit(`reset:${ip}`, 10, 15 * 60 * 1000);
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);

  let body: Body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  const token = body.token?.trim() ?? "";
  if (!token) {
    return Response.json({ error: "Некорректная ссылка" }, { status: 400 });
  }

  const passwordError = validatePassword(body.password ?? "");
  if (passwordError) {
    return Response.json({ error: passwordError }, { status: 400 });
  }

  const confirmError = validatePasswordConfirm(
    body.password ?? "",
    body.passwordConfirm ?? "",
  );
  if (confirmError) {
    return Response.json({ error: confirmError }, { status: 400 });
  }

  const result = await resetPasswordWithToken(token, body.password!);
  if (result === "invalid") {
    return Response.json(
      { error: "Ссылка недействительна или уже использована" },
      { status: 400 },
    );
  }
  if (result === "expired") {
    return Response.json(
      { error: "Срок действия ссылки истёк. Запросите новую." },
      { status: 400 },
    );
  }

  return Response.json({ ok: true });
}
