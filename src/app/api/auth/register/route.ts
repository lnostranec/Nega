import { getPrisma, isDbConfigured } from "@/lib/prisma";
import { normalizeEmail, normalizePhone } from "@/lib/auth-types";
import {
  createSession,
  dbUnavailableResponse,
  findUserByEmail,
  hashPassword,
  setSessionCookie,
  toPublicUser,
} from "@/lib/auth";
import { linkGuestOrdersToUser } from "@/lib/guest-orders";
import {
  validateEmail,
  validateName,
  validatePassword,
  validatePasswordConfirm,
  validatePhone,
} from "@/lib/validation";
import {
  clientIpFromRequest,
  rateLimit,
  rateLimitResponse,
} from "@/lib/rate-limit";

type RegisterBody = {
  firstName?: string;
  email?: string;
  phone?: string;
  password?: string;
  passwordConfirm?: string;
};

export async function POST(request: Request) {
  if (!isDbConfigured()) return dbUnavailableResponse();

  const ip = clientIpFromRequest(request);
  const limited = rateLimit(`register:${ip}`, 10, 60 * 60 * 1000);
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);

  let body: RegisterBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  const firstName = body.firstName?.trim() ?? "";
  const email = body.email ?? "";
  const phone = body.phone?.trim() ?? "";
  const password = body.password ?? "";
  const passwordConfirm = body.passwordConfirm ?? "";

  const firstNameError = validateName(firstName);
  if (firstNameError) {
    return Response.json({ error: firstNameError }, { status: 400 });
  }

  const emailError = validateEmail(email);
  if (emailError) {
    return Response.json({ error: emailError }, { status: 400 });
  }

  if (phone) {
    const phoneError = validatePhone(phone);
    if (phoneError) {
      return Response.json({ error: phoneError }, { status: 400 });
    }
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    return Response.json({ error: passwordError }, { status: 400 });
  }

  const confirmError = validatePasswordConfirm(password, passwordConfirm);
  if (confirmError) {
    return Response.json({ error: confirmError }, { status: 400 });
  }

  const normalizedEmail = normalizeEmail(email);
  const normalizedPhone = normalizePhone(phone);

  const existing = await findUserByEmail(normalizedEmail);
  if (existing) {
    return Response.json(
      { error: "Пользователь с таким email уже зарегистрирован" },
      { status: 409 },
    );
  }

  const prisma = getPrisma();

  if (normalizedPhone) {
    const phoneTaken = await prisma.user.findUnique({
      where: { phone: normalizedPhone },
    });
    if (phoneTaken) {
      return Response.json(
        { error: "Этот номер телефона уже используется" },
        { status: 409 },
      );
    }
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      passwordHash,
      firstName,
      phone: normalizedPhone,
    },
  });

  await linkGuestOrdersToUser(user.id, user.email, user.phone);

  const { token, expiresAt } = await createSession(user.id);
  await setSessionCookie(token, expiresAt);

  return Response.json({ user: toPublicUser(user) });
}
