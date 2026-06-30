import { isDbConfigured } from "@/lib/prisma";
import {
  clearSessionCookie,
  dbUnavailableResponse,
  deleteSessionByToken,
  getSessionToken,
} from "@/lib/auth";

export async function POST() {
  if (!isDbConfigured()) return dbUnavailableResponse();

  const token = await getSessionToken();
  if (token) {
    await deleteSessionByToken(token);
  }

  await clearSessionCookie();

  return Response.json({ ok: true });
}
