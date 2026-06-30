import { isDbConfigured } from "@/lib/prisma";
import { dbUnavailableResponse, getSessionUser, toPublicUser } from "@/lib/auth";

export async function GET() {
  if (!isDbConfigured()) {
    return Response.json({ user: null, dbConfigured: false });
  }

  const user = await getSessionUser();
  return Response.json({
    user: user ? toPublicUser(user) : null,
    dbConfigured: true,
  });
}
