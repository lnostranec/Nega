import { isDbConfigured } from "@/lib/prisma";
import { getSessionUser, toPublicUser } from "@/lib/auth";
import { getUserLoyalty } from "@/lib/loyalty";

export async function GET() {
  if (!isDbConfigured()) {
    return Response.json({ user: null, dbConfigured: false });
  }

  const user = await getSessionUser();
  if (!user) {
    return Response.json({ user: null, dbConfigured: true });
  }

  const loyalty = await getUserLoyalty(user.id);
  return Response.json({
    user: toPublicUser(user, {
      lifetimeSpend: loyalty.lifetimeSpend,
      percent: loyalty.percent,
    }),
    dbConfigured: true,
  });
}
