import { getSessionUser, dbUnavailableResponse } from "@/lib/auth";
import { normalizePhone, toPublicUser } from "@/lib/auth-types";
import { getPrisma, isDbConfigured } from "@/lib/prisma";
import { validateName, validatePhone } from "@/lib/validation";

type ProfileBody = {
  firstName?: string;
  lastName?: string;
  phone?: string;
};

function validateOptionalName(value: string, field: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const nameError = validateName(trimmed);
  if (nameError) return `${field}: ${nameError}`;
  return null;
}

export async function PATCH(request: Request) {
  if (!isDbConfigured()) return dbUnavailableResponse();

  const user = await getSessionUser();
  if (!user) {
    return Response.json({ error: "Требуется авторизация" }, { status: 401 });
  }

  let body: ProfileBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  const firstName = body.firstName?.trim() ?? "";
  const lastName = body.lastName?.trim() ?? "";
  const phoneRaw = body.phone?.trim() ?? "";

  const firstNameError = validateName(firstName);
  if (firstNameError) {
    return Response.json({ error: firstNameError }, { status: 400 });
  }

  const lastNameError = validateOptionalName(lastName, "Фамилия");
  if (lastNameError) {
    return Response.json({ error: lastNameError }, { status: 400 });
  }

  const phoneError = validatePhone(phoneRaw);
  if (phoneError) {
    return Response.json({ error: phoneError }, { status: 400 });
  }

  const phone = normalizePhone(phoneRaw);
  const prisma = getPrisma();

  if (phone) {
    const existing = await prisma.user.findFirst({
      where: { phone, NOT: { id: user.id } },
      select: { id: true },
    });
    if (existing) {
      return Response.json(
        { error: "Этот номер телефона уже используется" },
        { status: 400 },
      );
    }
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      firstName,
      lastName: lastName || null,
      phone,
    },
  });

  return Response.json({ user: toPublicUser(updated) });
}
