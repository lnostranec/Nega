import type { User } from "@prisma/client";
import { getSessionUser } from "@/lib/auth";
import { isDbConfigured } from "@/lib/prisma";

export async function getAdminUser(): Promise<User | null> {
  if (!isDbConfigured()) return null;
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") return null;
  return user;
}

export function unauthorizedResponse(message = "Требуется вход администратора") {
  return Response.json({ error: message }, { status: 401 });
}

export function forbiddenResponse(message = "Недостаточно прав") {
  return Response.json({ error: message }, { status: 403 });
}

export async function requireAdminUser(): Promise<User | Response> {
  const user = await getAdminUser();
  if (!user) return unauthorizedResponse();
  return user;
}
