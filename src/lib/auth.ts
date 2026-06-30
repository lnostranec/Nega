import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import type { User } from "@prisma/client";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_DAYS,
  normalizeEmail,
  toPublicUser,
  type PublicUser,
} from "@/lib/auth-types";
import { getPrisma, isDbConfigured } from "@/lib/prisma";

export { SESSION_COOKIE, SESSION_MAX_AGE_DAYS, toPublicUser, type PublicUser };

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  passwordHash: string,
): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

export async function createSession(userId: string) {
  const prisma = getPrisma();
  const token = randomUUID();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_MAX_AGE_DAYS);

  await prisma.session.create({
    data: { userId, token, expiresAt },
  });

  return { token, expiresAt };
}

export async function setSessionCookie(token: string, expiresAt: Date) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
    maxAge: SESSION_MAX_AGE_DAYS * 24 * 60 * 60,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSessionToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value;
}

export async function deleteSessionByToken(token: string) {
  const prisma = getPrisma();
  await prisma.session.deleteMany({ where: { token } });
}

export async function getSessionUser(): Promise<User | null> {
  if (!isDbConfigured()) return null;

  const token = await getSessionToken();
  if (!token) return null;

  const prisma = getPrisma();
  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session) return null;

  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }

  return session.user;
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const prisma = getPrisma();
  return prisma.user.findUnique({
    where: { email: normalizeEmail(email) },
  });
}

export function dbUnavailableResponse() {
  return Response.json(
    {
      error:
        "База данных не настроена. Добавьте DATABASE_URL в .env и выполните npm run db:push",
    },
    { status: 503 },
  );
}
