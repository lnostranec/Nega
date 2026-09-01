import {
  getSessionUser,
  hashPassword,
  dbUnavailableResponse,
} from "@/lib/auth";
import { getPrisma, isDbConfigured } from "@/lib/prisma";
import { validatePassword, validatePasswordConfirm } from "@/lib/validation";

type Body = {
  password?: string;
  passwordConfirm?: string;
};

export async function PATCH(request: Request) {
  if (!isDbConfigured()) return dbUnavailableResponse();

  const user = await getSessionUser();
  if (!user) {
    return Response.json({ error: "Требуется авторизация" }, { status: 401 });
  }

  let body: Body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  const password = body.password ?? "";
  const passwordConfirm = body.passwordConfirm ?? "";

  const passwordError = validatePassword(password);
  if (passwordError) {
    return Response.json({ error: passwordError }, { status: 400 });
  }

  const confirmError = validatePasswordConfirm(password, passwordConfirm);
  if (confirmError) {
    return Response.json({ error: confirmError }, { status: 400 });
  }

  const passwordHash = await hashPassword(password);
  const prisma = getPrisma();

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  return Response.json({ ok: true });
}
