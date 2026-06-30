import type { User } from "@prisma/client";

export const SESSION_COOKIE = "nega_session";
export const SESSION_MAX_AGE_DAYS = 30;

export type PublicUser = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  points: number;
  createdAt: string;
};

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    points: user.points,
    createdAt: user.createdAt.toISOString(),
  };
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function normalizePhone(phone: string | undefined | null): string | null {
  if (!phone?.trim()) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("7")) return `+${digits}`;
  if (digits.length === 10) return `+7${digits}`;
  return phone.trim();
}
