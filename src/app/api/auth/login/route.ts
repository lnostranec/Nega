import { getPrisma } from "@/lib/prisma";
import {
  createSession,
  findUserByEmail,
  requireDb,
  setSessionCookie,
  toPublicUser,
  verifyPassword,
} from "@/lib/auth";
import { linkGuestOrdersToUser } from "@/lib/guest-orders";
import { validateEmail, validatePassword } from "@/lib/validation";
import {
  clientIpFromRequest,
  rateLimit,
  rateLimitResponse,
} from "@/lib/rate-limit";

type LoginBody = {
  email?: string;
  password?: string;
};

export async function POST(request: Request) {
  const dbError = await requireDb();
  if (dbError) return dbError;

  const ip = clientIpFromRequest(request);
  const limited = rateLimit(`login:${ip}`, 20, 15 * 60 * 1000);
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);

  let body: LoginBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  const email = body.email ?? "";
  const password = body.password ?? "";

  const emailError = validateEmail(email);
  if (emailError) {
    return Response.json({ error: emailError }, { status: 400 });
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    return Response.json({ error: passwordError }, { status: 400 });
  }

  const user = await findUserByEmail(email);
  if (!user) {
    return Response.json({ error: "Неверный email или пароль" }, { status: 401 });
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return Response.json({ error: "Неверный email или пароль" }, { status: 401 });
  }

  const prisma = getPrisma();
  await prisma.session.deleteMany({ where: { userId: user.id } });

  await linkGuestOrdersToUser(user.id, user.email, user.phone);

  const { token, expiresAt } = await createSession(user.id);
  await setSessionCookie(token, expiresAt);

  return Response.json({ user: toPublicUser(user) });
}
