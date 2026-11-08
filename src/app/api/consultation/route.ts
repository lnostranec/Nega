import { normalizePhone } from "@/lib/auth-types";
import { captureException } from "@/lib/monitoring";
import {
  clientIpFromRequest,
  rateLimit,
  rateLimitResponse,
} from "@/lib/rate-limit";
import { sendVkMessage } from "@/lib/vk";
import {
  CONSULTATION_COMMENT_MAX,
  validateName,
  validatePhone,
} from "@/lib/validation";

type ConsultationBody = {
  name?: string;
  phone?: string;
  comment?: string;
  agreed?: boolean;
};

export async function POST(request: Request) {
  const ip = clientIpFromRequest(request);
  const limited = rateLimit(`consultation:${ip}`, 5, 15 * 60 * 1000);
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);

  let body: ConsultationBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  const name = body.name?.trim() ?? "";
  const phone = body.phone?.trim() ?? "";
  const comment = typeof body.comment === "string" ? body.comment.trim() : "";

  if (comment.length > CONSULTATION_COMMENT_MAX) {
    return Response.json(
      { error: `Комментарий не длиннее ${CONSULTATION_COMMENT_MAX} символов` },
      { status: 400 },
    );
  }

  if (!body.agreed) {
    return Response.json(
      { error: "Необходимо согласие на обработку данных" },
      { status: 400 },
    );
  }

  const nameError = validateName(name);
  if (nameError) return Response.json({ error: nameError }, { status: 400 });

  const phoneError = validatePhone(phone);
  if (phoneError) return Response.json({ error: phoneError }, { status: 400 });

  const normalizedPhone = normalizePhone(phone) ?? phone;
  const time = new Date().toLocaleString("ru-RU", {
    timeZone: "Europe/Moscow",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  const lines = [
    "📞 Заявка на консультацию",
    "",
    `Имя: ${name}`,
    `Телефон: ${normalizedPhone}`,
    `Время: ${time} (МСК)`,
  ];
  if (comment) {
    lines.push("", "Комментарий:", comment);
  }

  try {
    await sendVkMessage(lines.join("\n"));
  } catch (error) {
    console.error("[consultation] vk error:", error);
    void captureException(error, { route: "POST /api/consultation" });
    return Response.json(
      {
        error:
          "Не удалось отправить заявку. Попробуйте ещё раз или напишите нам в Telegram @Nega_store",
      },
      { status: 502 },
    );
  }

  return Response.json({ ok: true });
}
