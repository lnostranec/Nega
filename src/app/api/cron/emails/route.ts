import { processPendingEmails } from "@/lib/email/outbox";
import { isDbConfigured } from "@/lib/prisma";

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  if (!isDbConfigured()) {
    return Response.json({ processed: 0, skipped: "db" });
  }

  const processed = await processPendingEmails();
  return Response.json({ processed });
}
