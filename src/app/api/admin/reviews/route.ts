import { requireAdminUser } from "@/lib/admin";
import { listAdminReviews } from "@/lib/admin-reviews";
import { dbUnavailableResponse } from "@/lib/auth";
import { isDbConfigured } from "@/lib/prisma";

export async function GET() {
  if (!isDbConfigured()) return dbUnavailableResponse();
  const admin = await requireAdminUser();
  if (admin instanceof Response) return admin;

  return Response.json({ reviews: await listAdminReviews() });
}
