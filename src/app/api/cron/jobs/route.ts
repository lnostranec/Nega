import { processPendingEmails } from "@/lib/email/outbox";
import { releaseExpiredOrders } from "@/lib/orders";
import { isDbConfigured } from "@/lib/prisma";

function authorize(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  return POST(request);
}

export async function POST(request: Request) {
  if (!authorize(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isDbConfigured()) {
    return Response.json({
      expiredOrders: 0,
      emailsProcessed: 0,
      skipped: "db",
    });
  }

  const expiredOrders = await releaseExpiredOrders();
  const emailsProcessed = await processPendingEmails();

  return Response.json({ expiredOrders, emailsProcessed });
}
